// --- 1. INITIALIZATION & VIEW NAVIGATION ---

document.addEventListener('DOMContentLoaded', function() {
    // A. RESTORE SAVED VIEW
    const savedView = localStorage.getItem('currentFinanceView') || 'dashboard-view';
    navigateTo(savedView);

    // B. INITIALIZE FIREBASE DATA
    loadFinanceRecords();

    // C. SET DASHBOARD DATE RANGE TEXT
    const dateRangeElement = document.getElementById('dateRangeText');
    if (dateRangeElement) {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        dateRangeElement.innerText = `Showing data from: ${thirtyDaysAgo.toLocaleDateString(undefined, options)} to ${today.toLocaleDateString(undefined, options)}`;
    }

    // D. INITIALIZE CHART
    const chartCtx = document.getElementById('profitChart');
    if (chartCtx) {
        new Chart(chartCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Income (LKR)',
                    data: [120000, 150000, 110000, 160000],
                    borderColor: '#18bc9c',
                    backgroundColor: 'rgba(24, 188, 156, 0.1)',
                    fill: true,
                    tension: 0.4
                }, {
                    label: 'Outgoings (LKR)',
                    data: [40000, 60000, 35000, 50000],
                    borderColor: '#e74a3b',
                    backgroundColor: 'rgba(231, 74, 59, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }


    window.onload = () => {
    // Other initialization code...
    autoCheckMonthlyReport(); 
};



    // E. RESTRICT DATES TO PAST & PRESENT ONLY
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInputs = ['billDate', 'filterDateStart', 'filterDateEnd'];
    
    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('max', todayStr);
    });



    // E. BLOCK MINUS SIGN (Move this here!)
    const amountInput = document.getElementById('billAmount');
    if (amountInput) {
        amountInput.addEventListener('keydown', function(e) {
            if (e.key === '-' || e.key === 'e' || e.key === '+') {
                e.preventDefault();
            }
        });
        amountInput.addEventListener('paste', function(e) {
            const pasteData = e.clipboardData.getData('text');
            if (pasteData.includes('-')) {
                e.preventDefault();
                alert("Negative values are not allowed.");
            }
        });
    }

    
});





function navigateTo(viewId) {
    // If going to add-bill-view via the "+" button, reset it to default
    if (viewId === 'add-bill-view') {
        resetFormToDefault();
    }
    
    localStorage.setItem('currentFinanceView', viewId);
    // ... rest of your existing navigateTo code ...

    // Hide all
    document.querySelectorAll('.content-view').forEach(view => view.classList.add('d-none'));

    // Show target
    const target = document.getElementById(viewId);
    if (target) target.classList.remove('d-none');

    // Update Hero
    const titles = {
        'dashboard-view': 'Financial Management',
        'add-bill-view': 'Add Expenditure',
        'history-view': 'Transaction History',
        'print-view': 'Print Reports'
    };
    const heroTitle = document.getElementById('heroTitle');
    if (heroTitle) heroTitle.innerText = titles[viewId] || 'Financial Management';

    // Refresh Chart if Dashboard
    if (viewId === 'dashboard-view') {
        const chartInstance = Chart.getChart("profitChart");
        if (chartInstance) {
            chartInstance.resize();
            chartInstance.update();
        }
    }

    // Close sidebar
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar) {
        const instance = bootstrap.Offcanvas.getInstance(sidebar);
        if (instance) instance.hide();
    }
}

// --- 2. FIREBASE DATA LOADING & FILTERING ---

let masterRecords = []; 

async function loadFinanceRecords() {
    const tableBody = document.getElementById('financeRecordsTableBody');
    if (!tableBody) return;

    let bills = [];
    let orders = [];

    const combineAndFilter = () => {
        masterRecords = [...bills, ...orders];
        applyFilters(); 
    };

    db.collection("Bills").onSnapshot(snap => {
        bills = snap.docs.map(doc => ({
            docId: doc.id,
            id: doc.data().id || 'BILL',
            type: 'Bill',
            date: doc.data().date, 
            description: doc.data().description,
            amount: parseFloat(doc.data().amount) || 0,
            url: doc.data().attachmenturl
        }));
        combineAndFilter();
    });

    db.collection("orders").onSnapshot(snap => {
        orders = snap.docs.map(doc => {
            const d = doc.data();
            let dateStr = d.createdAt ? d.createdAt.toDate().toISOString().split('T')[0] : "N/A";
            return {
                docId: doc.id,
                id: 'ORD-' + doc.id.substring(0, 4).toUpperCase(),
                type: 'Order',
                date: dateStr,
                description: `${d.customerName} - ${d.designDescription}`,
                amount: parseFloat(d.amountPaid) || 0,
                url: '#'
            };
        });
        combineAndFilter();
    });
}



function applyFilters() {
    const typeFilter = document.getElementById('filterType')?.value || 'All';
    const startDate = document.getElementById('filterDateStart')?.value;
    const endDate = document.getElementById('filterDateEnd')?.value;
    const tableBody = document.getElementById('financeRecordsTableBody');

    if (!tableBody) return;

    let filtered = masterRecords.filter(record => {
        const matchesType = (typeFilter === "All" || record.type === typeFilter);
        let matchesDate = true;

        if (startDate && endDate) {
            matchesDate = record.date >= startDate && record.date <= endDate;
        } else if (startDate) {
            matchesDate = record.date === startDate;
        } else if (!startDate && !endDate) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            matchesDate = record.date >= thirtyDaysAgo.toISOString().split('T')[0];
        }
        return matchesType && matchesDate;
    });

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    tableBody.innerHTML = '';
    let currentIncome = 0;
    let currentOutgoings = 0;

    filtered.forEach(record => {
    if (record.type === 'Order') currentIncome += record.amount;
    else currentOutgoings += record.amount;

    const isBill = record.type === 'Bill';

    // 1. View Column (Always exists)
    const viewCell = `<td><button class="btn btn-light border-dark btn-sm" onclick="viewRecord('${record.docId}')"><i class="bi bi-file-earmark-ruled"></i></button></td>`;
    
    // 2. Edit Column (Only for Bills)
    const editCell = isBill 
        ? `<td><button class="btn btn-light border-dark btn-sm" onclick="editRecord('${record.docId}')"><i class="bi bi-pencil"></i></button></td>` 
        : `<td class="text-muted">-</td>`;
        
    // 3. Delete Column (Only for Bills)
    const deleteCell = isBill 
        ? `<td><button class="btn btn-light border-dark btn-sm text-danger" onclick="deleteRecord('${record.docId}', '${record.type}')"><i class="bi bi-trash"></i></button></td>` 
        : `<td class="text-muted">-</td>`;

    // 4. Inject all 8 columns
    tableBody.innerHTML += `
        <tr>
            <td>${record.id}</td>
            <td><span class="badge ${record.type === 'Order' ? 'bg-success' : 'bg-danger'}">${record.type}</span></td>
            <td>${record.date}</td>
            <td class="text-start">${record.description}</td>
            <td>Rs. ${record.amount.toLocaleString()}</td>
            ${viewCell}
            ${editCell}
            ${deleteCell}
        </tr>`;
});

    updateHistorySummary(currentIncome, currentOutgoings);
}












// --- 3. HELPER FUNCTIONS ---

function updateHistorySummary(income, outgoings) {
    const net = income - outgoings;
    const sets = [
        { inc: 'summaryIncome', out: 'summaryOutgoings', nt: 'summaryNet' },
        { inc: 'totalIncomeDisplay', out: 'totalOutgoingsDisplay', nt: 'netProfitDisplay' }
    ];

    sets.forEach(ids => {
        if (document.getElementById(ids.inc)) document.getElementById(ids.inc).innerText = `Rs. ${income.toLocaleString()}`;
        if (document.getElementById(ids.out)) document.getElementById(ids.out).innerText = `Rs. ${outgoings.toLocaleString()}`;
        if (document.getElementById(ids.nt)) document.getElementById(ids.nt).innerText = `Rs. ${net.toLocaleString()}`;
    });
}



function resetFilters() {
    if (document.getElementById('filterType')) document.getElementById('filterType').value = "All";
    if (document.getElementById('filterDateStart')) document.getElementById('filterDateStart').value = "";
    if (document.getElementById('filterDateEnd')) document.getElementById('filterDateEnd').value = "";
    applyFilters();
}



function viewRecord(docId) {
    // 1. Find the specific record from our loaded data
    const record = masterRecords.find(r => r.docId === docId);
    if (!record) return;

    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    const modalTitle = document.getElementById('modalTitle');

    modalTitle.innerText = record.type === 'Bill' ? "Bill Details" : "Order Details";

    // 2. Build the Body Content
    let content = `
        <div class="mb-3">
            <label class="small text-muted d-block">Reference ID</label>
            <span class="fw-bold">${record.id}</span>
        </div>
        <div class="mb-3">
            <label class="small text-muted d-block">Date</label>
            <span>${record.date}</span>
        </div>
        <div class="mb-3">
            <label class="small text-muted d-block">Description</label>
            <p class="mb-0">${record.description}</p>
        </div>
        <div class="mb-3">
            <label class="small text-muted d-block">Amount</label>
            <span class="text-primary fw-bold">Rs. ${record.amount.toLocaleString()}</span>
        </div>
    `;

    // Add Image Preview if it's a Bill and has a URL
    if (record.type === 'Bill' && record.url !== "none") {
        content += `
            <div class="mt-3 p-2 border rounded bg-light text-center">
                <label class="small text-muted d-block mb-2">Attached Physical Bill</label>
                <img src="${record.url}" class="img-fluid rounded border border-dark" style="max-height: 200px;" alt="Bill Attachment">
                <div class="mt-2">
                    <a href="${record.url}" target="_blank" class="btn btn-sm btn-outline-dark">View Full Image</a>
                </div>
            </div>`;
    } else if (record.type === 'Bill') {
        content += `<div class="alert alert-warning py-2 small mt-2">No physical bill attached.</div>`;
    }

    modalBody.innerHTML = content;

    // 3. Build the Footer (Buttons)
    if (record.type === 'Bill') {
        // Bills get Edit and Delete
        modalFooter.innerHTML = `
            <button class="btn btn-outline-danger me-auto" onclick="deleteAndClose('${record.docId}', 'Bill')">Delete</button>
            <button class="btn btn-primary" onclick="editRecord('${record.docId}')">Edit Bill</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;
    } else {
        // Orders are View-Only
        modalFooter.innerHTML = `
            <span class="small text-muted me-auto"><i class="bi bi-info-circle"></i> Orders cannot be edited here.</span>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        `;
    }

    // 4. Show the Modal
    const myModal = new bootstrap.Modal(document.getElementById('transactionModal'));
    myModal.show();
}

// Helper to close modal and delete
function deleteAndClose(id, type) {
    const modalElement = document.getElementById('transactionModal');
    const modalInstance = bootstrap.Modal.getInstance(modalElement);
    if (modalInstance) modalInstance.hide();
    deleteRecord(id, type);
}




function deleteRecord(docId, type) {
    const coll = (type === 'Order') ? "orders" : "Bills";
    if (confirm(`Are you sure you want to delete this ${type}?`)) {
        db.collection(coll).doc(docId).delete()
            .then(() => alert("Deleted!"))
            .catch(err => console.error(err));
    }
}






function editRecord(docId) {
    // 1. Find the specific record
    const record = masterRecords.find(r => r.docId === docId);
    if (!record) return;

    // 2. Navigate to the form view
    navigateTo('add-bill-view');

    // 3. Update the UI labels to say "Edit" instead of "New"
    document.getElementById('heroTitle').innerText = "Edit Bill Details";
    const formTitle = document.querySelector('#add-bill-view h4');
    if (formTitle) formTitle.innerHTML = `<i class="bi bi-pencil-square me-2"></i>Edit Bill Details`;

    // 4. Pre-fill the form fields
    document.getElementById('billID').value = record.id;
    document.getElementById('billDate').value = record.date;
    document.getElementById('billDesc').value = record.description;
    document.getElementById('billAmount').value = record.amount;

    // 5. Change the "Save" button to run an Update function instead of Add
    const saveBtn = document.querySelector('#billEntryForm button[onclick="saveTransaction()"]');
    if (saveBtn) {
        saveBtn.innerText = "Update Bill";
        saveBtn.setAttribute('onclick', `updateTransaction('${docId}')`);
    }
}





async function updateTransaction(docId) {
    const amount = document.getElementById('billAmount').value;
    const date = document.getElementById('billDate').value;
    const desc = document.getElementById('billDesc').value;

    try {
        await db.collection("Bills").doc(docId).update({
            amount: Number(amount),
            date: date,
            description: desc
        });

        alert("✅ Bill Updated Successfully!");
        
        // Reset the form labels back to "Add" mode for next time
        resetFormToDefault();
        navigateTo('dashboard-view');
    } catch (error) {
        alert("Error updating: " + error.message);
    }
}

// Helper to reset the form state back to "New Bill"
function resetFormToDefault() {
    const saveBtn = document.querySelector('#billEntryForm button');
    if (saveBtn) {
        saveBtn.innerText = "Save Transaction";
        saveBtn.setAttribute('onclick', 'saveTransaction()');
    }
    document.getElementById('billEntryForm').reset();
}



async function saveTransaction() {
    
    // 1. Get references to elements and values
    const amountInput = document.getElementById('billAmount');
    const amount = parseFloat(amountInput.value);
    const date = document.getElementById('billDate').value;
    const desc = document.getElementById('billDesc').value;
    const file = document.getElementById('billAttachment').files[0];
    const todayStr = new Date().toISOString().split('T')[0];

    // 2. --- VALIDATION START ---
    if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid positive amount.");
        return;
    }
    if (!date) {
        alert("Please select a date.");
        return;
    }
    if (date > todayStr) {
        alert("Future dates are not allowed for bills.");
        return;
    }
    // --- VALIDATION END ---

    try {
        // 3. Generate Auto ID
        const snapshot = await db.collection("Bills").get();
        const autoID = "BILL-" + String(snapshot.size + 1).padStart(3, '0');
        let fileUrl = "none";

        // 4. Handle File Upload (if any)
        if (file) {
            const fileRef = storage.ref().child(`bill_images/${autoID}_${file.name}`);
            const uploadSnap = await fileRef.put(file);
            fileUrl = await uploadSnap.ref.getDownloadURL();
        }

        // 5. Save to Firestore
        await db.collection("Bills").add({
            id: autoID,
            amount: Number(amount),
            date: date,
            description: desc,
            attachmenturl: fileUrl,
            type: "Bill"
        });

        alert("🎉 Success! ID: " + autoID);
        
        // 6. UI Reset
        document.getElementById('billEntryForm').reset();
        navigateTo('dashboard-view');
        
    } catch (error) {
        alert("Error: " + error.message);
    }
}




/**
 * Helper: Calculates Income, Expenses, and Profit for the last 6 months
 * based on the current date (April 2026).
 */
function getMonthlyData() {
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mName = d.toLocaleString('default', { month: 'short' });
        const ym = d.toISOString().substring(0, 7); // Format: "2026-04"
        
        months.push(mName);
        
        // Filter masterRecords for this specific month
        const monthly = masterRecords.filter(r => r.date.startsWith(ym));
        let inc = 0, exp = 0;
        
        monthly.forEach(r => {
            if (r.type === 'Order') inc += r.amount;
            else exp += r.amount;
        });

        incomeData.push(inc);
        expenseData.push(exp);
    }
    return { months, incomeData, expenseData };
}



//Helper Function to genereate PDF to collect the six months dates
function getMonthlyData() {
    const months = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const mName = d.toLocaleString('default', { month: 'short' });
        const ym = d.toISOString().substring(0, 7); // "2026-04"
        
        months.push(mName);
        
        // Filter masterRecords for the specific month
        const monthly = masterRecords.filter(r => r.date.startsWith(ym));
        let inc = 0, exp = 0;
        
        monthly.forEach(r => {
            if (r.type === 'Order') inc += r.amount;
            else exp += r.amount;
        });

        incomeData.push(inc);
        expenseData.push(exp);
    }
    return { months, incomeData, expenseData };
}



//Generate PDF with charts

async function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    const type = document.getElementById('reportType').value;
    const startInput = document.getElementById('reportDateStart').value;
    const endInput = document.getElementById('reportDateEnd').value;

    // Filter local records based on UI inputs
    let reportData = masterRecords.filter(record => {
        const matchesType = (type === "All" || record.type === type);
        let matchesDate = (startInput && endInput) ? (record.date >= startInput && record.date <= endInput) : true;
        return matchesType && matchesDate;
    });

    if (reportData.length === 0) {
        alert("No records found for the selected criteria.");
        return;
    }

    // --- CALCULATE SUMMARY TOTALS ---
    let totalInc = 0, totalExp = 0;
    reportData.forEach(r => r.type === 'Order' ? totalInc += r.amount : totalExp += r.amount);
    const netProfit = totalInc - totalExp;

    /**
     * REUSABLE HEADER FUNCTION
     * Displays Site Name, Report Subject, and Time/Date Metadata
     */
    const drawHeader = (pageTitle) => {
        // Dark Background Header
        doc.setFillColor(33, 37, 41); 
        doc.rect(0, 0, pageWidth, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text("GRAFIX PRINT HUB", 14, 20); 
        
        doc.setFontSize(10);
        doc.text(pageTitle, 14, 28);
        
        // Metadata Block (Right-aligned)
        doc.setFontSize(8);
        doc.text(`REPORT TYPE: ${type.toUpperCase()}`, pageWidth - 14, 15, { align: 'right' });
        doc.text(`TIME PERIOD: ${startInput || 'START'} TO ${endInput || 'TODAY'}`, pageWidth - 14, 22, { align: 'right' });
        doc.text(`GENERATED: ${new Date().toLocaleString()}`, pageWidth - 14, 29, { align: 'right' });
    };

    // --- PAGE 1: ANALYTICS ---
    drawHeader("SYSTEM GENERATED FINANCIAL ANALYSIS");
    doc.setTextColor(0, 0, 0);

    if (type === "All") {
        // Text Summary
        doc.setFontSize(12);
        doc.text("Business Performance Summary", 14, 60);
        doc.setFontSize(10);
        doc.text(`Total Income (Orders): Rs. ${totalInc.toLocaleString()}`, 14, 70);
        doc.text(`Total Expenses (Bills): Rs. ${totalExp.toLocaleString()}`, 14, 77);
        doc.setFont(undefined, 'bold');
        doc.text(`Net Profit: Rs. ${netProfit.toLocaleString()}`, 14, 87);
        doc.setFont(undefined, 'normal');

        // Prepare 6-Month Data
        const trend = getMonthlyData();
        const profitTrendData = trend.incomeData.map((inc, i) => inc - trend.expenseData[i]);

        // Draw Pie Chart (Income vs Expense)
        const ctxPie = document.getElementById('pdfPieChart').getContext('2d');
        const pieChart = new Chart(ctxPie, {
            type: 'pie',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{ data: [totalInc, totalExp], backgroundColor: ['#198754', '#dc3545'] }]
            },
            options: { animation: false, responsive: false }
        });

        // Draw Bar Chart (Profit Trend)
        const ctxBar = document.getElementById('pdfBarChart').getContext('2d');
        const barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: trend.months,
                datasets: [{ label: 'Monthly Net Profit (Rs.)', data: profitTrendData, backgroundColor: '#0d6efd' }]
            },
            options: { animation: false, responsive: false }
        });

        // Wait for rendering to complete
        await new Promise(r => setTimeout(r, 1000));
        
        // Add Images to PDF
        doc.addImage(document.getElementById('pdfPieChart').toDataURL('image/png'), 'PNG', 135, 55, 55, 55);
        doc.setFontSize(11);
        doc.text("6-Month Net Profit Performance Trend", 14, 115);
        doc.addImage(document.getElementById('pdfBarChart').toDataURL('image/png'), 'PNG', 14, 120, 180, 75);

        pieChart.destroy();
        barChart.destroy();

        // Move to New Page for the list
        doc.addPage();
        drawHeader("DETAILED TRANSACTION LOG");
        var tableY = 55;

    } else {
        // LOGIC FOR BILLS OR ORDERS ONLY (Single Page)
        const trend = getMonthlyData();
        const label = type === "Bill" ? "Total Expenditure" : "Total Income";
        const val = type === "Bill" ? totalExp : totalInc;
        
        doc.setFontSize(13);
        doc.text(`${label}: Rs. ${val.toLocaleString()}`, 14, 60);

        const ctxBar = document.getElementById('pdfBarChart').getContext('2d');
        const barChart = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: trend.months,
                datasets: [{ 
                    label: type === "Bill" ? 'Monthly Bills' : 'Monthly Orders', 
                    data: type === "Bill" ? trend.expenseData : trend.incomeData, 
                    backgroundColor: type === "Bill" ? '#dc3545' : '#198754' 
                }]
            },
            options: { animation: false, responsive: false }
        });

        await new Promise(r => setTimeout(r, 800));
        doc.addImage(document.getElementById('pdfBarChart').toDataURL('image/png'), 'PNG', 14, 70, 180, 75);
        barChart.destroy();
        var tableY = 155;
    }

    // --- TRANSACTION TABLE ---
    doc.autoTable({
        head: [["ID", "Type", "Date", "Description", "Amount (Rs.)"]],
        body: reportData.map(r => [r.id, r.type, r.date, r.description, r.amount.toLocaleString()]),
        startY: tableY,
        theme: 'striped',
        headStyles: { fillColor: [33, 37, 41] },
        styles: { fontSize: 9, cellPadding: 3 }
    });

    // --- FOOTER (Automatic Page Numbering) ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Grafix Print Hub | Cloud Audit | Page ${i} of ${pageCount}`, pageWidth / 2, 287, { align: 'center' });
    }

    // Save PDF with unique timestamp
    doc.save(`Grafix_Audit_${type}_${new Date().getTime()}.pdf`);
}




async function triggerMonthlyReport() {
    try {
        const now = new Date();
        const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const compareDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);

        const reportMonthNum = reportDate.getMonth(); 
        const compareMonthNum = compareDate.getMonth();
        const reportYear = reportDate.getFullYear();
        const compareYear = compareDate.getFullYear();

        const reportMonthName = reportDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        const compareMonthName = compareDate.toLocaleString('default', { month: 'long' });

        const billsSnap = await db.collection("Bills").get();
        const ordersSnap = await db.collection("orders").get(); 

        let reportInc = 0, reportExp = 0, compareInc = 0, compareExp = 0;
        let reportOrderCount = 0; // New variable to track order count

        // 1. Process Bills
        billsSnap.forEach(doc => {
            const data = doc.data();
            if (data.date) {
                const parts = data.date.split('-'); 
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                if (y === reportYear && m === reportMonthNum) reportExp += Number(data.amount || 0);
                if (y === compareYear && m === compareMonthNum) compareExp += Number(data.amount || 0);
            }
        });

        // 2. Process Orders
        ordersSnap.forEach(doc => {
            const data = doc.data();
            if (data.createdAt && typeof data.createdAt.toDate === 'function') {
                const dateObj = data.createdAt.toDate(); 
                const y = dateObj.getFullYear();
                const m = dateObj.getMonth();

                if (y === reportYear && m === reportMonthNum) {
                    reportInc += parseFloat(data.amountPaid) || 0;
                    reportOrderCount++; // Increment count for each March order found
                }
                if (y === compareYear && m === compareMonthNum) {
                    compareInc += parseFloat(data.amountPaid) || 0;
                }
            }
        });

        const reportProfit = reportInc - reportExp;
        const compareProfit = compareInc - compareExp;

        // 3. Dynamic Trend Calculation
        let trendText = "";
        if (compareInc === 0 && compareExp === 0) {
            trendText = "a 100% baseline increase";
        } else {
            const diff = compareProfit === 0 ? 100 : (((reportProfit - compareProfit) / Math.abs(compareProfit)) * 100).toFixed(1);
            const direction = reportProfit >= compareProfit ? "up" : "down";
            trendText = `${Math.abs(diff)}% ${direction}`;
        }

        // 4. Send to EmailJS
        const templateParams = {
            month_name: reportMonthName,
            income: reportInc.toLocaleString(),
            outgoings: reportExp.toLocaleString(),
            profit: reportProfit.toLocaleString(),
            profit_trend: trendText,    // Matches {{profit_trend}}
            order_count: reportOrderCount // Matches {{order_count}}
        };

        await emailjs.send("service_1fljhbq", "template_mnwlhwn", templateParams);
        alert(`Report for ${reportMonthName} has been sent to email Successfully`);

    } catch (error) {
        console.error("Error:", error);
        alert("Error: " + error.message);
    }
}




async function autoCheckMonthlyReport() {
    try {
        const now = new Date();
        // If it's early in the month (e.g., April 1st - April 5th), check for March report
        // However, for your review, we can just check if the PREVIOUS month's report exists.
        
        const reportDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const reportMonthID = reportDate.toLocaleString('default', { month: 'long', year: 'numeric' }); // e.g., "March 2026"

        // 1. Check Firestore to see if "March 2026" was already sent
        const docRef = db.collection("ReportHistory").doc(reportMonthID);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
            console.log(`No report found for ${reportMonthID}. Generating now...`);
            
            // 2. Run your existing logic (the code we perfected earlier)
            await triggerMonthlyReport();

            // 3. Mark it as SENT in Firestore so it never runs for this month again
            await docRef.set({
                sentAt: new Date(),
                status: "Success",
                recipient: "Owner"
            });
            
            console.log(`Automated report for ${reportMonthID} completed.`);
        } else {
            console.log(`Report for ${reportMonthID} was already sent on ${docSnap.data().sentAt.toDate()}.`);
        }
    } catch (error) {
        console.error("Auto-report check failed:", error);
    }
}
