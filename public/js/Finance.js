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



    // E. RESTRICT DATES TO PAST & PRESENT ONLY
    const todayStr = new Date().toISOString().split('T')[0];
    const dateInputs = ['billDate', 'filterDateStart', 'filterDateEnd'];
    
    dateInputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.setAttribute('max', todayStr);
    });

    
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

        tableBody.innerHTML += `
            <tr>
                <td>${record.id}</td>
                <td><span class="badge ${record.type === 'Order' ? 'bg-success' : 'bg-danger'}">${record.type}</span></td>
                <td>${record.date}</td>
                <td class="text-start">${record.description}</td>
                <td>Rs. ${record.amount.toLocaleString()}</td>
                <td>
                    <div class="d-flex justify-content-center gap-2">
                       <button class="btn btn-light border-dark btn-sm" onclick="viewRecord('${record.docId}')"><i class="bi bi-file-earmark-ruled"></i></button>
                        <button class="btn btn-light border-dark btn-sm" onclick="editRecord('${record.docId}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-light border-dark btn-sm text-danger" onclick="deleteRecord('${record.docId}', '${record.type}')"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>`;
    });

    updateHistorySummary(currentIncome, currentOutgoings);
}





filtered.forEach(record => {
    if (record.type === 'Order') currentIncome += record.amount;
    else currentOutgoings += record.amount;

    // 1. Create a variable to hold the action buttons
    let actionButtons = '';

    if (record.type === 'Bill') {
        // Bills get View, Edit, and Delete
        actionButtons = `
            <button class="btn btn-light border-dark btn-sm" onclick="viewRecord('${record.docId}')"><i class="bi bi-file-earmark-ruled"></i></button>
            <button class="btn btn-light border-dark btn-sm" onclick="editRecord('${record.docId}')"><i class="bi bi-pencil"></i></button>
            <button class="btn btn-light border-dark btn-sm text-danger" onclick="deleteRecord('${record.docId}', '${record.type}')"><i class="bi bi-trash"></i></button>
        `;
    } else {
        // Orders ONLY get the View button
        actionButtons = `
            <button class="btn btn-light border-dark btn-sm" onclick="viewRecord('${record.docId}')"><i class="bi bi-file-earmark-ruled"></i></button>
        `;
    }

    // 2. Insert the actionButtons variable into the table row
    tableBody.innerHTML += `
        <tr>
            <td>${record.id}</td>
            <td><span class="badge ${record.type === 'Order' ? 'bg-success' : 'bg-danger'}">${record.type}</span></td>
            <td>${record.date}</td>
            <td class="text-start">${record.description}</td>
            <td>Rs. ${record.amount.toLocaleString()}</td>
            <td>
                <div class="d-flex justify-content-center gap-2">
                    ${actionButtons}
                </div>
            </td>
        </tr>`;
});







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





function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const type = document.getElementById('reportType').value;
    const start = document.getElementById('reportDateStart').value;
    const end = document.getElementById('reportDateEnd').value;

    // 1. Filter the masterRecords based on the form selection
    let reportData = masterRecords.filter(record => {
        const matchesType = (type === "All" || record.type === type);
        let matchesDate = true;
        if (start && end) {
            matchesDate = record.date >= start && record.date <= end;
        }
        return matchesType && matchesDate;
    });

    if (reportData.length === 0) {
        alert("No records found for the selected criteria.");
        return;
    }

    // 2. Add Header Content
    doc.setFontSize(18);
    doc.text("Grafix Print Hub - Financial Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Report Type: ${type} | Date Range: ${start || 'All'} to ${end || 'Present'}`, 14, 30);

    // 3. Setup Table Data
    const tableColumn = ["ID", "Type", "Date", "Description", "Amount (Rs.)"];
    const tableRows = [];

    let totalAmount = 0;

    reportData.forEach(record => {
        const rowData = [
            record.id,
            record.type,
            record.date,
            record.description,
            record.amount.toLocaleString()
        ];
        tableRows.push(rowData);
        
        // Summing up (Orders are positive, Bills are negative for Net Total)
        if (record.type === 'Order') totalAmount += record.amount;
        else totalAmount -= record.amount;
    });

    // 4. Generate Table
    doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0] }
    });

    // 5. Add Total Summary at the bottom
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Summary: Rs. ${totalAmount.toLocaleString()}`, 14, finalY);

    // 6. Save PDF
    doc.save(`Grafix_Report_${new Date().getTime()}.pdf`);
}





