// ============================================================
// CRM MODULE - CUSTOMER RELATIONSHIP MANAGEMENT
// Developed by: R.G.S. Nadeesha (Cyber Serpents WD-41)
// ============================================================

let customers = [];
let currentDeleteId = null;
let selectedReportType = 'all';
let currentFilter = { search: '', type: '', rating: '', status: '' };

document.addEventListener('DOMContentLoaded', function () {
    loadCustomersFromFirestore();
    setupEventListeners();
    showPage('home');
});

function loadCustomersFromFirestore() {
    db.collection('customers').orderBy('dateAdded', 'desc').get()
        .then((snapshot) => {
            customers = [];
            snapshot.forEach(doc => customers.push({ id: doc.id, ...doc.data() }));
            updateStats();
            renderFilteredCustomersTable();
            populateCustomerDropdown();
        })
        .catch((error) => {
            console.error('Error:', error);
            showToast('Error loading customers: ' + error.message, 'danger');
        });
}

function updateStats() {
    var t = document.getElementById('totalCustomers');
    var f = document.getElementById('newFeedbacks');
    if (t) t.innerText = customers.length;
    if (f) f.innerText = customers.filter(function(c){ return c.feedback && c.feedback.startsWith('5'); }).length;
}

async function saveCustomer() {
    var id       = document.getElementById('customerId').value;
    var name     = document.getElementById('customerName').value.trim();
    var company  = document.getElementById('customerCompany').value.trim();
    var email    = document.getElementById('customerEmail').value.trim();
    var phone    = document.getElementById('customerPhone').value.trim();
    var address  = document.getElementById('customerAddress').value.trim();
    var orders   = parseInt(document.getElementById('customerOrders').value) || 0;
    var feedback = document.getElementById('customerFeedback').value;
    var type     = document.getElementById('customerType').value;

    if (!name || !company || !email || !phone) { showToast('Please fill all required fields!', 'danger'); return; }
    if (!isValidEmail(email))  { showToast('Please enter a valid email address!', 'danger'); return; }
    if (!validatePhone(phone)) { showToast('Phone number must be exactly 10 digits!', 'danger'); return; }
    if (orders < 0)            { showToast('Orders cannot be negative!', 'danger'); return; }

    var data = { name: name, company: company, email: email, phone: phone, address: address || 'Not specified', orders: orders, type: type, feedback: feedback, status: 'Active', dateAdded: new Date().toISOString().split('T')[0] };

    try {
        if (id) {
            await db.collection('customers').doc(id).update(data);
            showToast('Customer "' + name + '" updated successfully!', 'success');
        } else {
            await db.collection('customers').add(data);
            showToast('Customer "' + name + '" added successfully!', 'success');
        }
        bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
        resetModalForm();
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error saving: ' + error.message, 'danger');
    }
}

function viewCustomer(id) {
    var c = customers.find(function(c){ return c.id === id; });
    if (!c) return;
    var statusColor = c.status === 'Inactive' ? '#dc3545' : '#198754';
    
    var starsModal = '';
    var ratingModal = parseInt(c.feedback ? c.feedback.charAt(0) : 5);
    for (var sm = 0; sm < ratingModal; sm++) { starsModal += '<i class="bi bi-star-fill text-warning"></i>'; }
    for (var sm = ratingModal; sm < 5; sm++) { starsModal += '<i class="bi bi-star text-warning"></i>'; }
    
    document.getElementById('viewCustomerDetails').innerHTML =
        '<div class="text-center mb-3">' +
        '<span class="customer-avatar" style="width:60px;height:60px;font-size:24px;line-height:60px;">' + getAvatar(c.name) + '</span>' +
        '<h5 class="mt-2">' + escapeHtml(c.name) + '</h5>' +
        '<span class="badge bg-' + (c.type === 'VIP' ? 'warning' : c.type === 'Corporate' ? 'info' : 'secondary') + '">' + (c.type || 'Regular') + '</span>' +
        '<span class="badge" style="background:' + statusColor + ';">' + (c.status || 'Active') + '</span>' +
        '</div><hr>' +
        '<div class="row">' +
        '<div class="col-6"><small>Company</small><p class="fw-bold">' + escapeHtml(c.company) + '</p></div>' +
        '<div class="col-6"><small>Email</small><p class="fw-bold">' + escapeHtml(c.email) + '</p></div>' +
        '<div class="col-6"><small>Phone</small><p class="fw-bold">' + escapeHtml(c.phone) + '</p></div>' +
        '<div class="col-6"><small>Address</small><p class="fw-bold">' + (escapeHtml(c.address) || 'Not specified') + '</p></div>' +
        '<div class="col-6"><small>Total Orders</small><p class="fw-bold">' + (c.orders || 0) + '</p></div>' +
        '<div class="col-6"><small>Feedback</small><p class="fw-bold">' + starsModal + '</p></div>' +
        '<div class="col-12"><small>Customer Since</small><p class="fw-bold">' + (c.dateAdded || 'N/A') + '</p></div>' +
        '</div>';
    new bootstrap.Modal(document.getElementById('viewCustomerModal')).show();
}

function openEditModal(id) {
    var c = customers.find(function(c){ return c.id === id; });
    if (!c) return;
    document.getElementById('addCustomerModalLabel').innerHTML = '<i class="bi bi-pencil-fill me-2"></i>Update Customer';
    document.getElementById('customerId').value       = c.id;
    document.getElementById('customerName').value     = c.name;
    document.getElementById('customerCompany').value  = c.company;
    document.getElementById('customerEmail').value    = c.email;
    document.getElementById('customerPhone').value    = c.phone;
    document.getElementById('customerAddress').value  = c.address || '';
    document.getElementById('customerOrders').value   = c.orders || 0;
    document.getElementById('customerFeedback').value = c.feedback || '5 ★';
    document.getElementById('customerType').value     = c.type || 'Regular';
    new bootstrap.Modal(document.getElementById('addCustomerModal')).show();
}

function openDeleteModal(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteCustomerName').innerText = name;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
}

async function deleteCustomer() {
    if (!currentDeleteId) return;
    try {
        await db.collection('customers').doc(currentDeleteId).delete();
        showToast('Customer deleted successfully!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error deleting: ' + error.message, 'danger');
    }
}

function resetModalForm() {
    document.getElementById('addCustomerModalLabel').innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Add New Customer';
    ['customerId','customerName','customerCompany','customerEmail','customerPhone','customerAddress'].forEach(function(id) {
        document.getElementById(id).value = '';
    });
    document.getElementById('customerOrders').value   = '0';
    document.getElementById('customerFeedback').value = '5 ★';
    document.getElementById('customerType').value     = 'Regular';
    document.querySelectorAll('.is-invalid-custom').forEach(function(el){ el.classList.remove('is-invalid-custom'); });
    document.querySelectorAll('.invalid-feedback-custom').forEach(function(el){ el.remove(); });
}

async function toggleCustomerStatus(id, currentStatus) {
    var newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
        await db.collection('customers').doc(id).update({ status: newStatus });
        showToast('Status changed to ' + newStatus, 'success');
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error: ' + error.message, 'danger');
    }
}

function filterCustomers() {
    var s = currentFilter.search.toLowerCase();
    return customers.filter(function(c) {
        var matchSearch = !s || (c.name && c.name.toLowerCase().includes(s)) || (c.email && c.email.toLowerCase().includes(s)) || (c.company && c.company.toLowerCase().includes(s)) || (c.phone && c.phone.includes(s));
        var matchType   = !currentFilter.type   || c.type === currentFilter.type;
        var matchStatus = !currentFilter.status || c.status === currentFilter.status;
        var matchRating = !currentFilter.rating || (c.feedback ? parseInt(c.feedback.charAt(0)) : 5) === parseInt(currentFilter.rating);
        return matchSearch && matchType && matchStatus && matchRating;
    });
}

function applyFilters() {
    currentFilter.search = document.getElementById('customerSearch') ? document.getElementById('customerSearch').value : '';
    currentFilter.type   = document.getElementById('filterType')     ? document.getElementById('filterType').value     : '';
    currentFilter.rating = document.getElementById('filterRating')   ? document.getElementById('filterRating').value   : '';
    currentFilter.status = document.getElementById('filterStatus')   ? document.getElementById('filterStatus').value   : '';
    renderFilteredCustomersTable();
}

function resetFilters() {
    currentFilter = { search: '', type: '', rating: '', status: '' };
    ['customerSearch','filterType','filterRating','filterStatus'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = '';
    });
    renderFilteredCustomersTable();
}

function renderFilteredCustomersTable() {
    var tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    var list = filterCustomers();
    if (list.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No customers found. </td><\/tr>';
        return;
    }
    tableBody.innerHTML = '';
    list.forEach(function(c) {
        var starsHtmlTable = '';
        var ratingVal = parseInt(c.feedback ? c.feedback.charAt(0) : 5);
        for (var s = 0; s < ratingVal; s++) { starsHtmlTable += '<i class="bi bi-star-fill text-warning"></i>'; }
        for (var s = ratingVal; s < 5; s++) { starsHtmlTable += '<i class="bi bi-star text-warning"></i>'; }
        
        var row = document.createElement('tr');
        row.innerHTML =
            '<td><div class="d-flex align-items-center"><span class="customer-avatar me-2">' + getAvatar(c.name) + '</span><div><div class="fw-bold">' + (escapeHtml(c.name)||'—') + '</div><small class="text-muted">' + (escapeHtml(c.type)||'Regular') + '</small></div></div></td>' +
            '<td>' + (escapeHtml(c.company)||'—') + '</td>' +
            '<td>' + (escapeHtml(c.email)||'—') + '</td>' +
            '<td>' + (escapeHtml(c.phone)||'—') + '</td>' +
            '<td style="max-width:180px;white-space:normal;">' + (escapeHtml(c.address)||'Not specified') + '</td>' +
            '<td class="text-center"><span class="badge bg-primary bg-opacity-10 text-primary">' + (c.orders||0) + ' orders</span></td>' +
            '<td class="text-center"><span class="feedback-badge">' + starsHtmlTable + '</span></td>' +
            '<td class="text-center"><span class="badge ' + (c.status==='Inactive'?'bg-secondary':'bg-success') + ' status-badge" onclick="toggleCustomerStatus(\'' + c.id + '\',\'' + (c.status||'Active') + '\')">' + (c.status||'Active') + '</span></td>' +
            '<td class="text-center"><div class="action-icons d-flex justify-content-center gap-2">' +
            '<i class="bi bi-eye action-icon icon-view" onclick="viewCustomer(\'' + c.id + '\')" title="View"></i>' +
            '<i class="bi bi-pencil action-icon icon-edit" onclick="openEditModal(\'' + c.id + '\')" title="Edit"></i>' +
            '<i class="bi bi-trash action-icon icon-delete" onclick="openDeleteModal(\'' + c.id + '\',\'' + escapeHtml(c.name) + '\')" title="Delete"></i>' +
            '</div></td>';
        tableBody.appendChild(row);
    });
}

function loadFeedbacks() {
    var container = document.getElementById('feedbacksContainer');
    if (!container) return;
    var list = customers.filter(function(c){ return c.feedback; });
    if (list.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-chat-square-text fs-1"></i><p class="mt-2">No feedback available yet.</p></div>';
        return;
    }
    container.innerHTML = '';
    list.forEach(function(c) {
        var ratingValue = parseInt(c.feedback.charAt(0));
        var starsHtml = '';
        for (var i = 0; i < ratingValue; i++) { starsHtml += '<i class="bi bi-star-fill text-warning"></i>'; }
        for (var i = ratingValue; i < 5; i++) { starsHtml += '<i class="bi bi-star text-warning"></i>'; }
        
        var cls = 'feedback-card';
        if (c.type === 'VIP') cls += ' vip-card';
        else if (c.type === 'Corporate') cls += ' corporate-card';
        else if (c.type === 'New') cls += ' new-card';
        else cls += ' regular-card';
        
        var card = document.createElement('div');
        card.className = cls;
        card.innerHTML =
            '<div class="d-flex justify-content-between align-items-start mb-3">' +
            '<div class="d-flex align-items-center"><span class="customer-avatar me-3">' + getAvatar(c.name) + '</span><div><h6 class="fw-bold mb-0">' + c.name + '</h6><small class="text-muted"><i class="bi bi-building"></i> ' + c.company + '</small></div></div>' +
            '<div class="feedback-stars">' + starsHtml + '</div></div>' +
            '<div class="row">' +
            '<div class="col-md-6"><div class="info-item"><i class="bi bi-envelope"></i><span><strong>Email:</strong> ' + c.email + '</span></div><div class="info-item"><i class="bi bi-telephone"></i><span><strong>Phone:</strong> ' + c.phone + '</span></div></div>' +
            '<div class="col-md-6"><div class="info-item"><i class="bi bi-geo-alt"></i><span><strong>Address:</strong> ' + (c.address||'Not specified') + '</span></div><div class="info-item"><i class="bi bi-bag-check"></i><span><strong>Orders:</strong> ' + (c.orders||0) + '</span></div></div>' +
            '</div>' +
            '<div class="info-row"><div class="d-flex justify-content-between"><small class="text-muted"><i class="bi bi-calendar"></i> Since: ' + (c.dateAdded||'N/A') + '</small><span class="badge bg-secondary">' + (c.type||'Regular') + '</span></div></div>';
        container.appendChild(card);
    });
}

function showPage(pageName) {
    document.querySelectorAll('.page-container').forEach(function(p){ p.classList.remove('active-page'); });
    var dashboard = document.getElementById('mainDashboard');
    if (pageName === 'home') {
        if (dashboard) dashboard.style.display = 'block';
    } else {
        if (dashboard) dashboard.style.display = 'none';
        var page = document.getElementById(pageName + 'Page');
        if (page) page.classList.add('active-page');
        if (pageName === 'feedbacks') loadFeedbacks();
        if (pageName === 'profiles')  renderFilteredCustomersTable();
    }
}

function openAddCustomerModal() {
    resetModalForm();
    new bootstrap.Modal(document.getElementById('addCustomerModal')).show();
}

function selectReportType(type) {
    selectedReportType = type;
    ['reportTypeAll','reportTypeFeedback','reportTypeIndividual'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.classList.remove('selected');
    });
    var map = { all: 'reportTypeAll', feedback: 'reportTypeFeedback', individual: 'reportTypeIndividual' };
    var el = document.getElementById(map[type]);
    if (el) el.classList.add('selected');
    var section = document.getElementById('customerSelectSection');
    if (section) section.style.display = type === 'individual' ? 'block' : 'none';
    if (type === 'individual') populateCustomerDropdown();
}

function populateCustomerDropdown() {
    var select = document.getElementById('individualCustomerSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Select a customer --</option>';
    customers.forEach(function(c) {
        select.innerHTML += '<option value="' + c.id + '">' + escapeHtml(c.name) + ' (' + escapeHtml(c.company) + ')</option>';
    });
}

function closePreview() {
    var preview = document.getElementById('reportPreviewContainer');
    if (preview) preview.style.display = 'none';
}

// ==================== REPORT GENERATION ====================

function generateSelectedReport() {
    var fromDate = document.getElementById('fromDate') ? document.getElementById('fromDate').value : '';
    var toDate   = document.getElementById('toDate')   ? document.getElementById('toDate').value   : '';

    if (selectedReportType === 'all') {
        generateAllCustomersReport(fromDate, toDate);
    } else if (selectedReportType === 'feedback') {
        generateFeedbackReport(fromDate, toDate);
    } else if (selectedReportType === 'individual') {
        var select = document.getElementById('individualCustomerSelect');
        if (!select || !select.value) { showToast('Please select a customer!', 'danger'); return; }
        var customer = customers.find(function(c){ return c.id === select.value; });
        if (!customer) { showToast('Customer not found!', 'danger'); return; }
        generateIndividualReport(customer, fromDate, toDate);
    }
}

function fmtDate(d) {
    if (!d) return 'All Time';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function filterByDates(list, fromDate, toDate) {
    return list.filter(function(c) {
        if (fromDate && c.dateAdded < fromDate) return false;
        if (toDate   && c.dateAdded > toDate)   return false;
        return true;
    });
}

function drawReportHeader(doc, subtitle, fromDate, toDate) {
    var pageWidth = doc.internal.pageSize.width;
    // Dark header background
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 45, 'F');
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('GRAFIX PRINT HUB', 14, 20);
    // Subtitle - WHITE color (changed from black)
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(subtitle, 14, 30);
    // Right side metadata - DARK GREY for better visibility
    doc.setFontSize(8);
    doc.setTextColor(192, 192, 192);  // Dark grey/silver
    doc.text('TIME PERIOD: ' + fmtDate(fromDate) + ' TO ' + fmtDate(toDate), pageWidth - 14, 20, { align: 'right' });
    doc.text('GENERATED: ' + new Date().toLocaleString(), pageWidth - 14, 28, { align: 'right' });
    // Reset text color
    doc.setTextColor(0, 0, 0);
}

// Helper for PDF reports - returns TEXT format (not stars)
function getRatingText(rating) {
    return rating + ' Stars';
}

// ---- All Customers Report with PIE CHART ----
function generateAllCustomersReport(fromDate, toDate) {
    var list = filterByDates(customers.slice(), fromDate, toDate);
    if (list.length === 0) { showToast('No customers found for this period!', 'danger'); return; }

    var totalOrders = list.reduce(function(s,c){ return s+(c.orders||0); }, 0);
    var avgOrders   = (totalOrders / list.length).toFixed(1);
    var avgRating   = (list.reduce(function(s,c){ return s+(c.feedback?parseInt(c.feedback.charAt(0)):5); }, 0) / list.length).toFixed(1);
    var vip  = list.filter(function(c){ return c.type==='VIP'; }).length;
    var corp = list.filter(function(c){ return c.type==='Corporate'; }).length;
    var reg  = list.filter(function(c){ return c.type==='Regular'||!c.type; }).length;
    var newC = list.filter(function(c){ return c.type==='New'; }).length;
    var s5   = list.filter(function(c){ return c.feedback&&c.feedback.startsWith('5'); }).length;
    var s4   = list.filter(function(c){ return c.feedback&&c.feedback.startsWith('4'); }).length;
    var s3   = list.filter(function(c){ return c.feedback&&c.feedback.startsWith('3'); }).length;
    var pct  = function(n){ return ((n/list.length)*100).toFixed(1); };

    var doc = new window.jspdf.jsPDF();
    var pageWidth = doc.internal.pageSize.width;

    // Draw Pie Chart
    var canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;
    var ctx = canvas.getContext('2d');
    
    var pieData = [vip, corp, reg, newC];
    var pieLabels = ['VIP', 'Corporate', 'Regular', 'New'];
    var pieColors = ['#ffc107', '#0dcaf0', '#6c757d', '#198754'];
    var total = vip + corp + reg + newC;
    
    if (total > 0) {
        var startAngle = -Math.PI / 2;
        for (var i = 0; i < pieData.length; i++) {
            var angle = (pieData[i] / total) * Math.PI * 2;
            var endAngle = startAngle + angle;
            ctx.beginPath();
            ctx.fillStyle = pieColors[i];
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 150, startAngle, endAngle);
            ctx.fill();
            startAngle = endAngle;
        }
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#333';
        ctx.textAlign = 'center';
        for (var i = 0; i < pieData.length; i++) {
            if (pieData[i] > 0) {
                var midAngle = -Math.PI / 2 + (pieData.slice(0, i).reduce(function(a,b){ return a+b; }, 0) + pieData[i]/2) / total * Math.PI * 2;
                var labelX = 200 + Math.cos(midAngle) * 100;
                var labelY = 200 + Math.sin(midAngle) * 100;
                ctx.fillStyle = '#fff';
                ctx.fillText(pieLabels[i] + ' (' + ((pieData[i]/total)*100).toFixed(1) + '%)', labelX, labelY);
            }
        }
    }

    drawReportHeader(doc, 'SYSTEM GENERATED CUSTOMER ANALYSIS', fromDate, toDate);

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Business Performance Summary', 14, 58);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    var boxes = [
        { label: 'Total Customers', value: String(list.length),  x: 14,  color: [94,96,206] },
        { label: 'Total Orders',    value: String(totalOrders),  x: 62,  color: [231,111,81] },
        { label: 'Avg Orders/Cust', value: String(avgOrders),    x: 110, color: [69,123,157] },
        { label: 'Avg Rating',      value: avgRating + ' Stars', x: 158, color: [42,157,143] }
    ];
    boxes.forEach(function(b) {
        doc.setFillColor(b.color[0], b.color[1], b.color[2]);
        doc.roundedRect(b.x, 63, 44, 22, 3, 3, 'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(b.value, b.x + 22, 72, { align: 'center' });
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text(b.label, b.x + 22, 80, { align: 'center' });
    });
    doc.setTextColor(0,0,0);

    var pieImage = canvas.toDataURL('image/png');
    doc.addImage(pieImage, 'PNG', 14, 95, 80, 80);
    
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Distribution', 100, 105);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    
    var distY = 112;
    var distData = [
        ['VIP', vip, pct(vip) + '%'],
        ['Corporate', corp, pct(corp) + '%'],
        ['Regular', reg, pct(reg) + '%'],
        ['New', newC, pct(newC) + '%']
    ];
    for (var i = 0; i < distData.length; i++) {
        doc.text(distData[i][0] + ': ' + distData[i][1] + ' (' + distData[i][2] + ')', 100, distY + (i * 6));
    }

    var feedY = 190;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Feedback Rating Distribution', 14, feedY);
    doc.setFont(undefined, 'normal');

    var ratingBoxes = [
        { label: '5 Stars', value: s5, x: 14,  bg: [255,243,205], fg: [133,100,4]  },
        { label: '4 Stars', value: s4, x: 76,  bg: [209,236,241], fg: [12,84,96]   },
        { label: '3 Stars', value: s3, x: 138, bg: [226,227,229], fg: [56,61,65]   }
    ];
    ratingBoxes.forEach(function(b) {
        doc.setFillColor(b.bg[0], b.bg[1], b.bg[2]);
        doc.roundedRect(b.x, feedY + 5, 56, 22, 3, 3, 'F');
        doc.setTextColor(b.fg[0], b.fg[1], b.fg[2]);
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(String(b.value), b.x + 28, feedY + 15, { align: 'center' });
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(b.label, b.x + 28, feedY + 22, { align: 'center' });
    });
    doc.setTextColor(0,0,0);

    var tableY = feedY + 40;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Customer List', 14, tableY);
    doc.setFont(undefined, 'normal');

    doc.autoTable({
        head: [['Name', 'Company', 'Email', 'Phone', 'Orders', 'Rating', 'Type', 'Status']],
        body: list.map(function(c) {
            var ratingText = c.feedback ? getRatingText(parseInt(c.feedback.charAt(0))) : '5 Stars';
            return [c.name, c.company, c.email, c.phone, c.orders||0, ratingText, c.type||'Regular', c.status||'Active'];
        }),
        startY: tableY + 5,
        theme: 'striped',
        headStyles: { fillColor: [26, 26, 46] },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Grafix Print Hub | CRM Report | Page ' + i + ' of ' + pageCount, pageWidth / 2, 287, { align: 'center' });
    }

    doc.save('CRM_All_Customers_' + new Date().getTime() + '.pdf');
    showToast('Report downloaded successfully!', 'success');
}

// ---- Feedback Report with BAR CHART ----
function generateFeedbackReport(fromDate, toDate) {
    var list = filterByDates(customers.slice(), fromDate, toDate).filter(function(c){ return c.feedback; });
    if (list.length === 0) { showToast('No feedback found for this period!', 'danger'); return; }

    var avg = (list.reduce(function(s,c){ return s+parseInt(c.feedback.charAt(0)); }, 0) / list.length).toFixed(1);
    var s5  = list.filter(function(c){ return c.feedback.startsWith('5'); }).length;
    var s4  = list.filter(function(c){ return c.feedback.startsWith('4'); }).length;
    var s3  = list.filter(function(c){ return c.feedback.startsWith('3'); }).length;
    var s2  = list.filter(function(c){ return c.feedback.startsWith('2'); }).length;
    var s1  = list.filter(function(c){ return c.feedback.startsWith('1'); }).length;

    var doc = new window.jspdf.jsPDF();
    var pageWidth = doc.internal.pageSize.width;

    // Draw Bar Chart
    var canvas = document.createElement('canvas');
    canvas.width = 500;
    canvas.height = 300;
    var ctx = canvas.getContext('2d');
    
    var barLabels = ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star'];
    var barData = [s5, s4, s3, s2, s1];
    var barColors = ['#ffc107', '#0dcaf0', '#6c757d', '#fd7e14', '#dc3545'];
    var maxValue = Math.max.apply(null, barData);
    
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    var barWidth = 60;
    var startX = 80;
    var baseY = 250;
    
    for (var i = 0; i < barData.length; i++) {
        var barHeight = (barData[i] / (maxValue || 1)) * 180;
        ctx.fillStyle = barColors[i];
        ctx.fillRect(startX + (i * (barWidth + 15)), baseY - barHeight, barWidth, barHeight);
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(barLabels[i], startX + (i * (barWidth + 15)) + barWidth/2, baseY + 15);
        ctx.fillStyle = '#000';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(barData[i], startX + (i * (barWidth + 15)) + barWidth/2, baseY - barHeight - 5);
    }
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Rating Distribution', canvas.width/2, 30);

    drawReportHeader(doc, 'FEEDBACK ANALYSIS REPORT', fromDate, toDate);

    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Overview', 14, 58);
    doc.setFont(undefined, 'normal');

    doc.setFillColor(94, 96, 206);
    doc.roundedRect(14, 63, 85, 25, 3, 3, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(String(list.length), 56, 74, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Total Feedbacks', 56, 82, { align: 'center' });

    doc.setFillColor(231, 111, 81);
    doc.roundedRect(105, 63, 85, 25, 3, 3, 'F');
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(avg + ' Stars', 147, 74, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Average Rating', 147, 82, { align: 'center' });
    doc.setTextColor(0,0,0);

    var barImage = canvas.toDataURL('image/png');
    doc.addImage(barImage, 'PNG', 14, 95, 180, 80);

    var ratingY = 190;
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');
    doc.text('Rating Summary', 14, ratingY);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    var ratingY2 = ratingY + 8;
    doc.text('5 Stars: ' + s5 + ' (' + ((s5/list.length)*100).toFixed(1) + '%)', 14, ratingY2);
    doc.text('4 Stars: ' + s4 + ' (' + ((s4/list.length)*100).toFixed(1) + '%)', 14, ratingY2 + 6);
    doc.text('3 Stars: ' + s3 + ' (' + ((s3/list.length)*100).toFixed(1) + '%)', 14, ratingY2 + 12);
    doc.text('2 Stars: ' + s2 + ' (' + ((s2/list.length)*100).toFixed(1) + '%)', 14, ratingY2 + 18);
    doc.text('1 Star: ' + s1 + ' (' + ((s1/list.length)*100).toFixed(1) + '%)', 14, ratingY2 + 24);

    var tableY = 230;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Customer Feedback Details', 14, tableY);
    doc.setFont(undefined, 'normal');

    doc.autoTable({
        head: [['Customer', 'Company', 'Rating', 'Orders', 'Type', 'Since']],
        body: list.map(function(c) {
            var ratingText = c.feedback ? getRatingText(parseInt(c.feedback.charAt(0))) : '5 Stars';
            return [c.name, c.company, ratingText, c.orders||0, c.type||'Regular', c.dateAdded||'N/A'];
        }),
        startY: tableY + 5,
        theme: 'striped',
        headStyles: { fillColor: [26, 26, 46] },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('Grafix Print Hub | Feedback Report | Page ' + i + ' of ' + pageCount, pageWidth / 2, 287, { align: 'center' });
    }

    doc.save('CRM_Feedback_Report_' + new Date().getTime() + '.pdf');
    showToast('Report downloaded successfully!', 'success');
}

// ---- Individual Report (Avatar letter size increased to 22) ----
function generateIndividualReport(customer, fromDate, toDate) {
    var ratingValue = customer.feedback ? parseInt(customer.feedback.charAt(0)) : 5;
    var starsStr = ratingValue + ' out of 5 Stars';
    var ratingText = customer.feedback ? getRatingText(parseInt(customer.feedback.charAt(0))) : '5 Stars';

    var doc = new window.jspdf.jsPDF();
    var pageWidth = doc.internal.pageSize.width;

    drawReportHeader(doc, 'CUSTOMER PROFILE REPORT', fromDate, toDate);

    // Avatar circle - Larger letter (size 22)
    doc.setFillColor(25, 93, 122);
    doc.circle(30, 65, 14, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    var avatarLetter = getAvatar(customer.name);
    doc.text(avatarLetter, 30, 70, { align: 'center' });
    doc.setTextColor(0,0,0);

    // Name & company
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(customer.name, 52, 62);
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100,100,100);
    doc.text(customer.company, 52, 70);

    // Status & type badges
    var statusColor = customer.status === 'Inactive' ? [220,53,69] : [25,135,84];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(52, 75, 32, 8, 4, 4, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(8);
    doc.setFont(undefined, 'bold');
    doc.text(customer.status||'Active', 68, 81, { align: 'center' });

    var typeColor = customer.type === 'VIP' ? [255,193,7] : customer.type === 'Corporate' ? [13,202,240] : [108,117,125];
    var typeTextColor = customer.type === 'VIP' ? 0 : 255;
    doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
    doc.roundedRect(90, 75, 32, 8, 4, 4, 'F');
    doc.setTextColor(typeTextColor, typeTextColor, typeTextColor);
    doc.text(customer.type||'Regular', 106, 81, { align: 'center' });
    doc.setTextColor(0,0,0);

    // Contact Info
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Contact Information', 14, 95);
    doc.setFont(undefined, 'normal');

    doc.autoTable({
        body: [
            ['Email', customer.email,              'Phone',   customer.phone],
            ['Address', customer.address||'N/A',   'Since',   customer.dateAdded||'N/A']
        ],
        startY: 100,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [240,240,240], cellWidth: 30 },
            1: { cellWidth: 70 },
            2: { fontStyle: 'bold', fillColor: [240,240,240], cellWidth: 30 },
            3: { cellWidth: 60 }
        }
    });

    // Performance
    var afterY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Performance Summary', 14, afterY);
    doc.setFont(undefined, 'normal');

    doc.setFillColor(232, 244, 255);
    doc.roundedRect(14, afterY + 4, 85, 28, 3, 3, 'F');
    doc.setTextColor(13, 110, 253);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text(String(customer.orders||0), 56, afterY + 17, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text('Total Orders', 56, afterY + 26, { align: 'center' });

    doc.setFillColor(255, 249, 230);
    doc.roundedRect(105, afterY + 4, 85, 28, 3, 3, 'F');
    doc.setTextColor(255, 193, 7);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(starsStr, 147, afterY + 17, { align: 'center' });
    doc.setFontSize(9);
    doc.setTextColor(100,100,100);
    doc.setFont(undefined, 'normal');
    doc.text('Feedback Rating - ' + ratingText, 147, afterY + 26, { align: 'center' });
    doc.setTextColor(0,0,0);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Grafix Print Hub | CRM Customer Profile | Confidential', pageWidth / 2, 287, { align: 'center' });

    doc.save('CRM_' + customer.name.replace(/\s/g,'_') + '_' + new Date().getTime() + '.pdf');
    showToast('Report downloaded successfully!', 'success');
}

// ==================== HELPERS ====================

function getStarsFromFeedback(feedback) {
    var r = parseInt(feedback) || 5;
    return r + ' Stars';
}

function getAvatar(name) {
    if (!name) return '??';
    var initials = name.split(' ').map(function(n){ return n[0]; }).join('').substring(0,2).toUpperCase();
    return initials;
}

function escapeHtml(str) {
    if (!str) return str;
    return String(str).replace(/[&<>"']/g, function(m) {
        return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m];
    });
}

function validatePhone(phone) { return /^\d{10}$/.test(phone); }
function isValidEmail(email)  { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function showToast(message, type) {
    if (!type) type = 'success';
    var toast = document.getElementById('successToast');
    var msg   = document.getElementById('toastMessage');
    if (!toast || !msg) return;
    msg.innerText = message;
    toast.className = 'toast bg-' + type + ' text-white';
    new bootstrap.Toast(toast).show();
}

function setupEventListeners() {
    var saveBtn     = document.getElementById('saveCustomerBtn');
    var confirmBtn  = document.getElementById('confirmDeleteBtn');
    var addModal    = document.getElementById('addCustomerModal');
    var phoneInput  = document.getElementById('customerPhone');
    var ordersInput = document.getElementById('customerOrders');
    if (saveBtn)     saveBtn.addEventListener('click', saveCustomer);
    if (confirmBtn)  confirmBtn.addEventListener('click', deleteCustomer);
    if (addModal)    addModal.addEventListener('hidden.bs.modal', resetModalForm);
    if (phoneInput)  phoneInput.addEventListener('input', function() {
        phoneInput.classList.toggle('is-invalid-custom', phoneInput.value.trim() !== '' && !validatePhone(phoneInput.value.trim()));
    });
    if (ordersInput) ordersInput.addEventListener('input', function() {
        ordersInput.classList.toggle('is-invalid-custom', parseInt(ordersInput.value) < 0);
    });
}

window.openAddCustomerModal   = openAddCustomerModal;
window.showPage               = showPage;
window.applyFilters           = applyFilters;
window.resetFilters           = resetFilters;
window.viewCustomer           = viewCustomer;
window.openEditModal          = openEditModal;
window.openDeleteModal        = openDeleteModal;
window.toggleCustomerStatus   = toggleCustomerStatus;
window.selectReportType       = selectReportType;
window.generateSelectedReport = generateSelectedReport;
window.closePreview           = closePreview;