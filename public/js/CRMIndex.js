// ============================================================
// CRM MODULE - CUSTOMER RELATIONSHIP MANAGEMENT
// Developed by: R.G.S. Nadeesha (Cyber Serpents WD-41)
// ============================================================

// ==================== GLOBAL VARIABLES ====================

let customers = [];
let currentDeleteId = null;
let selectedReportType = 'all';

let currentFilter = {
    search: '',
    type: '',
    rating: '',
    status: ''
};

// ==================== PAGE INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    showPage('home');
});

function initializePage() {
    loadCustomersFromFirestore();
}

// ==================== FIRESTORE OPERATIONS ====================

function loadCustomersFromFirestore() {
    db.collection('customers').orderBy('dateAdded', 'desc').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        updateStats();
        renderFilteredCustomersTable();
        
        const customerSelect = document.getElementById('individualCustomerSelect');
        if (customerSelect) {
            populateCustomerDropdown();
        }
        
        if (document.getElementById('feedbacksPage') && 
            document.getElementById('feedbacksPage').classList.contains('active-page')) {
            loadFeedbacks();
        }
    }).catch((error) => {
        console.error('Error loading customers:', error);
        showToast('Error loading customers: ' + error.message, 'danger');
    });
}

function updateStats() {
    const totalCustomers = customers.length;
    const newFeedbacks = customers.filter(c => c.feedback && c.feedback.includes('5')).length;
    
    const totalElem = document.getElementById('totalCustomers');
    const feedbackElem = document.getElementById('newFeedbacks');
    if (totalElem) totalElem.innerText = totalCustomers;
    if (feedbackElem) feedbackElem.innerText = newFeedbacks;
}

// ==================== CRUD OPERATIONS ====================

async function saveCustomer() {
    const id = document.getElementById('customerId').value;
    const name = document.getElementById('customerName').value.trim();
    const company = document.getElementById('customerCompany').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const orders = parseInt(document.getElementById('customerOrders').value) || 0;
    const feedback = document.getElementById('customerFeedback').value;
    const type = document.getElementById('customerType').value;

    if (!name || !company || !email || !phone) {
        showToast('Please fill all required fields!', 'danger');
        return;
    }
    
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address!', 'danger');
        return;
    }
    
    if (!validatePhone(phone)) {
        showToast('Phone number must be exactly 10 digits!', 'danger');
        return;
    }
    
    if (!validateOrders(orders)) {
        showToast('Orders cannot be negative!', 'danger');
        return;
    }

    const customerData = {
        name: name,
        company: company,
        email: email,
        phone: phone,
        address: address || 'Not specified',
        orders: orders,
        type: type,
        feedback: feedback,
        status: 'Active',
        dateAdded: new Date().toISOString().split('T')[0]
    };

    try {
        if (id) {
            await db.collection('customers').doc(id).update(customerData);
            showToast(`Customer "${name}" updated successfully!`, 'success');
        } else {
            await db.collection('customers').add(customerData);
            showToast(`Customer "${name}" added successfully!`, 'success');
        }
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        if (modal) modal.hide();
        resetModalForm();
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error saving customer: ' + error.message, 'danger');
    }
}

function viewCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    const stars = getStarsFromFeedback(customer.feedback);
    const statusColor = customer.status === 'Inactive' ? '#dc3545' : '#198754';
    
    const detailsHtml = `
        <div class="text-center mb-3">
            <span class="customer-avatar" style="width: 60px; height: 60px; font-size: 24px; line-height: 60px;">${getAvatar(customer.name)}</span>
            <h5 class="mt-2">${escapeHtml(customer.name)}</h5>
            <span class="badge bg-${customer.type === 'VIP' ? 'warning' : customer.type === 'Corporate' ? 'info' : 'secondary'}">${customer.type || 'Regular'}</span>
            <span class="badge" style="background: ${statusColor};">${customer.status || 'Active'}</span>
        </div>
        <hr>
        <div class="row">
            <div class="col-6"><small>Company</small><p class="fw-bold">${escapeHtml(customer.company)}</p></div>
            <div class="col-6"><small>Email</small><p class="fw-bold">${escapeHtml(customer.email)}</p></div>
            <div class="col-6"><small>Phone</small><p class="fw-bold">${escapeHtml(customer.phone)}</p></div>
            <div class="col-6"><small>Address</small><p class="fw-bold">${escapeHtml(customer.address) || 'Not specified'}</p></div>
            <div class="col-6"><small>Total Orders</small><p class="fw-bold">${customer.orders || 0}</p></div>
            <div class="col-6"><small>Feedback Rating</small><p class="fw-bold">${stars} ${customer.feedback || '5 ★'}</p></div>
            <div class="col-12"><small>Customer Since</small><p class="fw-bold">${customer.dateAdded || 'N/A'}</p></div>
        </div>
    `;
    
    const modalBody = document.getElementById('viewCustomerDetails');
    if (modalBody) modalBody.innerHTML = detailsHtml;
    const modal = new bootstrap.Modal(document.getElementById('viewCustomerModal'));
    if (modal) modal.show();
}

function openEditModal(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    const modalLabel = document.getElementById('addCustomerModalLabel');
    if (modalLabel) modalLabel.innerHTML = '<i class="bi bi-pencil-fill me-2"></i>Update Customer';
    
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerCompany').value = customer.company;
    document.getElementById('customerEmail').value = customer.email;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerOrders').value = customer.orders || 0;
    document.getElementById('customerFeedback').value = customer.feedback || '5 ★';
    document.getElementById('customerType').value = customer.type || 'Regular';
    
    const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    if (modal) modal.show();
}

function openDeleteModal(id, name) {
    currentDeleteId = id;
    const nameSpan = document.getElementById('deleteCustomerName');
    if (nameSpan) nameSpan.innerText = name;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    if (modal) modal.show();
}

async function deleteCustomer() {
    if (!currentDeleteId) return;
    
    try {
        await db.collection('customers').doc(currentDeleteId).delete();
        showToast('Customer deleted successfully!', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        if (modal) modal.hide();
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error deleting customer: ' + error.message, 'danger');
    }
}

function resetModalForm() {
    const modalLabel = document.getElementById('addCustomerModalLabel');
    if (modalLabel) modalLabel.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Add New Customer';
    
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerCompany').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerOrders').value = '0';
    document.getElementById('customerFeedback').value = '5 ★';
    document.getElementById('customerType').value = 'Regular';
    
    document.querySelectorAll('.is-invalid-custom').forEach(el => el.classList.remove('is-invalid-custom'));
    document.querySelectorAll('.invalid-feedback-custom').forEach(el => el.remove());
}

// ==================== CUSTOMER STATUS ====================

async function toggleCustomerStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    
    try {
        await db.collection('customers').doc(id).update({ status: newStatus });
        showToast(`Customer status changed to ${newStatus}`, 'success');
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error updating status: ' + error.message, 'danger');
    }
}

// ==================== SEARCH & FILTER ====================

function filterCustomers() {
    const searchTerm = currentFilter.search.toLowerCase();
    const typeFilter = currentFilter.type;
    const ratingFilter = currentFilter.rating;
    const statusFilter = currentFilter.status;
    
    return customers.filter(c => {
        const matchesSearch = searchTerm === '' || 
            (c.name && c.name.toLowerCase().includes(searchTerm)) ||
            (c.email && c.email.toLowerCase().includes(searchTerm)) ||
            (c.company && c.company.toLowerCase().includes(searchTerm)) ||
            (c.phone && c.phone.includes(searchTerm));
        
        const matchesType = typeFilter === '' || (c.type === typeFilter);
        const matchesStatus = statusFilter === '' || (c.status === statusFilter);
        
        let matchesRating = true;
        if (ratingFilter !== '') {
            const ratingValue = c.feedback ? parseInt(c.feedback.charAt(0)) : 5;
            matchesRating = ratingValue === parseInt(ratingFilter);
        }
        
        return matchesSearch && matchesType && matchesRating && matchesStatus;
    });
}

function applyFilters() {
    const searchInput = document.getElementById('customerSearch');
    const typeSelect = document.getElementById('filterType');
    const ratingSelect = document.getElementById('filterRating');
    const statusSelect = document.getElementById('filterStatus');
    
    currentFilter.search = searchInput ? searchInput.value : '';
    currentFilter.type = typeSelect ? typeSelect.value : '';
    currentFilter.rating = ratingSelect ? ratingSelect.value : '';
    currentFilter.status = statusSelect ? statusSelect.value : '';
    
    renderFilteredCustomersTable();
}

function resetFilters() {
    currentFilter = { search: '', type: '', rating: '', status: '' };
    
    const searchInput = document.getElementById('customerSearch');
    const typeSelect = document.getElementById('filterType');
    const ratingSelect = document.getElementById('filterRating');
    const statusSelect = document.getElementById('filterStatus');
    
    if (searchInput) searchInput.value = '';
    if (typeSelect) typeSelect.value = '';
    if (ratingSelect) ratingSelect.value = '';
    if (statusSelect) statusSelect.value = '';
    
    renderFilteredCustomersTable();
}

function renderFilteredCustomersTable() {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    
    const filteredCustomers = filterCustomers();
    tableBody.innerHTML = '';
    
    if (filteredCustomers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">No customers found. Try different search or filters.</td></tr>';
        return;
    }
    
    filteredCustomers.forEach(c => {
        const statusClass = c.status === 'Inactive' ? 'bg-secondary' : 'bg-success';
        const statusText = c.status || 'Active';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><div class="d-flex align-items-center"><span class="customer-avatar me-2">${getAvatar(c.name)}</span><div><div class="fw-bold">${escapeHtml(c.name) || '—'}</div><small class="text-muted">${escapeHtml(c.type) || 'Regular'}</small></div></div></td>
            <td>${escapeHtml(c.company) || '—'}</td>
            <td>${escapeHtml(c.email) || '—'}</td>
            <td>${escapeHtml(c.phone) || '—'}</td>
            <td style="max-width: 180px; white-space: normal;">${escapeHtml(c.address) || 'Not specified'}</td>
            <td class="text-center"><span class="badge bg-primary bg-opacity-10 text-primary">${c.orders || 0} orders</span></td>
            <td class="text-center"><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td>
            <td class="text-center"><span class="badge ${statusClass} status-badge" style="cursor: pointer;" onclick="toggleCustomerStatus('${c.id}', '${c.status || 'Active'}')">${statusText}</span></td>
            <td class="text-center"><div class="action-icons d-flex justify-content-center gap-2"><i class="bi bi-eye action-icon icon-view" onclick="viewCustomer('${c.id}')" title="View"></i><i class="bi bi-pencil action-icon icon-edit" onclick="openEditModal('${c.id}')" title="Edit"></i><i class="bi bi-trash action-icon icon-delete" onclick="openDeleteModal('${c.id}', '${escapeHtml(c.name)}')" title="Delete"></i></div></td>
        `;
        tableBody.appendChild(row);
    });
}

// ==================== FEEDBACK PAGE ====================

function loadFeedbacks() {
    const container = document.getElementById('feedbacksContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const customersWithFeedback = customers.filter(c => c.feedback);
    
    if (customersWithFeedback.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-chat-square-text fs-1"></i><p class="mt-2">No feedback available yet.</p></div>';
        return;
    }
    
    customersWithFeedback.forEach(c => {
        const stars = getStarsFromFeedback(c.feedback);
        let cardClass = 'feedback-card';
        if (c.type === 'VIP') cardClass += ' vip-card';
        else if (c.type === 'Corporate') cardClass += ' corporate-card';
        else if (c.type === 'New') cardClass += ' new-card';
        else cardClass += ' regular-card';
        
        const card = document.createElement('div');
        card.className = cardClass;
        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center"><span class="customer-avatar me-3">${getAvatar(c.name)}</span><div><h6 class="fw-bold mb-0">${c.name}</h6><small class="text-muted"><i class="bi bi-building"></i> ${c.company}</small></div></div>
                <div class="feedback-stars">${stars}</div>
            </div>
            <div class="row">
                <div class="col-md-6"><div class="info-item"><i class="bi bi-envelope"></i><span><strong>Email:</strong> ${c.email}</span></div><div class="info-item"><i class="bi bi-telephone"></i><span><strong>Phone:</strong> ${c.phone}</span></div></div>
                <div class="col-md-6"><div class="info-item"><i class="bi bi-geo-alt"></i><span><strong>Address:</strong> ${c.address || 'Not specified'}</span></div><div class="info-item"><i class="bi bi-bag-check"></i><span><strong>Orders:</strong> ${c.orders || 0}</span></div></div>
            </div>
            <div class="info-row"><div class="d-flex justify-content-between"><small class="text-muted"><i class="bi bi-calendar"></i> Since: ${c.dateAdded || 'N/A'}</small><span class="badge">${c.type || 'Regular'}</span></div></div>
        `;
        container.appendChild(card);
    });
}

// ==================== PAGE NAVIGATION ====================

function showPage(pageName) {
    document.querySelectorAll('.page-container').forEach(page => {
        page.classList.remove('active-page');
    });
    
    const mainDashboard = document.getElementById('mainDashboard');
    
    if (pageName === 'home') {
        if (mainDashboard) mainDashboard.style.display = 'block';
    } else {
        if (mainDashboard) mainDashboard.style.display = 'none';
        const selectedPage = document.getElementById(`${pageName}Page`);
        if (selectedPage) selectedPage.classList.add('active-page');
        
        if (pageName === 'feedbacks') loadFeedbacks();
        else if (pageName === 'profiles') renderFilteredCustomersTable();
        else if (pageName === 'reports') {
            const preview = document.getElementById('reportPreviewContainer');
            if (preview) preview.style.display = 'none';
        }
    }
}

function openAddCustomerModal() {
    resetModalForm();
    const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    if (modal) modal.show();
}

// ==================== REPORT GENERATION ====================

function selectReportType(type) {
    selectedReportType = type;
    
    const allOpt = document.getElementById('reportTypeAll');
    const feedbackOpt = document.getElementById('reportTypeFeedback');
    const individualOpt = document.getElementById('reportTypeIndividual');
    const customerSection = document.getElementById('customerSelectSection');
    
    if (allOpt) allOpt.classList.remove('selected');
    if (feedbackOpt) feedbackOpt.classList.remove('selected');
    if (individualOpt) individualOpt.classList.remove('selected');
    
    if (type === 'all') {
        if (allOpt) allOpt.classList.add('selected');
        if (customerSection) customerSection.style.display = 'none';
    } else if (type === 'feedback') {
        if (feedbackOpt) feedbackOpt.classList.add('selected');
        if (customerSection) customerSection.style.display = 'none';
    } else if (type === 'individual') {
        if (individualOpt) individualOpt.classList.add('selected');
        if (customerSection) customerSection.style.display = 'block';
        populateCustomerDropdown();
    }
}

function populateCustomerDropdown() {
    const select = document.getElementById('individualCustomerSelect');
    if (!select) return;
    
    select.innerHTML = '<option value="">-- Select a customer --</option>';
    customers.forEach(c => {
        select.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.company)})</option>`;
    });
}

function getDateRange() {
    const fromDate = document.getElementById('fromDate');
    const toDate = document.getElementById('toDate');
    return { 
        fromDate: fromDate ? fromDate.value : '', 
        toDate: toDate ? toDate.value : '' 
    };
}

function formatDateForReport(dateString) {
    if (!dateString) return 'All Time';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

 function generateSelectedReport() {
    const { fromDate, toDate } = getDateRange();
    
    if (selectedReportType === 'all') {
         generateFullReportWithDateRange(fromDate, toDate);
    } else if (selectedReportType === 'feedback') {
         generateFeedbackReportWithDateRange(fromDate, toDate);
    } else if (selectedReportType === 'individual') {
        const select = document.getElementById('individualCustomerSelect');
        const customerId = select ? select.value : '';
        if (!customerId) {
            showToast('Please select a customer', 'danger');
            return;
        }
         generateIndividualReportWithDateRange(customerId, fromDate, toDate);
    }
}

 function generateFullReportWithDateRange(fromDate, toDate) {
    if (customers.length === 0) {
        showToast('No customer data to generate report!', 'danger');
        return;
    }
    
    showToast('Generating full customer report...', 'info');
    
    let filteredCustomers = [...customers];
    if (fromDate) filteredCustomers = filteredCustomers.filter(c => c.dateAdded >= fromDate);
    if (toDate) filteredCustomers = filteredCustomers.filter(c => c.dateAdded <= toDate);
    
    const reportHTML = generateFullReportHTML(filteredCustomers, fromDate, toDate);
     downloadReportAsPDF(reportHTML, `Full_Customer_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

 function generateFeedbackReportWithDateRange(fromDate, toDate) {
    if (customers.length === 0) {
        showToast('No feedback data to generate report!', 'danger');
        return;
    }
    
    showToast('Generating feedback analysis report...', 'info');
    
    let filteredCustomers = [...customers];
    if (fromDate) filteredCustomers = filteredCustomers.filter(c => c.dateAdded >= fromDate);
    if (toDate) filteredCustomers = filteredCustomers.filter(c => c.dateAdded <= toDate);
    
    const reportHTML = generateFeedbackReportHTML(filteredCustomers, fromDate, toDate);
     downloadReportAsPDF(reportHTML, `Feedback_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

 function generateIndividualReportWithDateRange(customerId, fromDate, toDate) {
    const customer = customers.find(c => c.id === customerId);
    if (!customer) {
        showToast('Customer not found!', 'danger');
        return;
    }
    
    showToast(`Generating report for ${customer.name}...`, 'info');
    
    const reportHTML = generateIndividualReportHTML(customer, fromDate, toDate);
     downloadReportAsPDF(reportHTML, `${customer.name.replace(/\s/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`);
}

function buildFullReportHTML(filteredCustomers, fromDate, toDate) {
    const totalCustomers = filteredCustomers.length;
    const totalOrders = filteredCustomers.reduce((sum, c) => sum + (c.orders || 0), 0);
    const avgOrders = totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(1) : 0;
    const vipCount = filteredCustomers.filter(c => c.type === 'VIP').length;
    const corporateCount = filteredCustomers.filter(c => c.type === 'Corporate').length;
    const newCount = filteredCustomers.filter(c => c.type === 'New').length;
    const regularCount = filteredCustomers.filter(c => c.type === 'Regular' || !c.type).length;
    const fiveStarCount = filteredCustomers.filter(c => c.feedback && c.feedback.includes('5')).length;
    const fourStarCount = filteredCustomers.filter(c => c.feedback && c.feedback.includes('4')).length;
    const threeStarCount = filteredCustomers.filter(c => c.feedback && c.feedback.includes('3')).length;
    const avgRating = totalCustomers > 0 ?
        (filteredCustomers.reduce((sum, c) => sum + (c.feedback ? parseInt(c.feedback.charAt(0)) : 5), 0) / totalCustomers).toFixed(1) : 0;
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const fromDateStr = formatDateForReport(fromDate);
    const toDateStr = formatDateForReport(toDate);

    let customerRows = '';
    for (let i = 0; i < filteredCustomers.length; i++) {
        const c = filteredCustomers[i];
        const bg = i % 2 === 0 ? '#ffffff' : '#f9f9f9';
        customerRows += '<tr style="background:' + bg + ';">' +
            '<td style="border:1px solid #ddd;padding:8px;">' + escapeHtml(c.name) + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;">' + escapeHtml(c.company) + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;">' + escapeHtml(c.email) + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;">' + escapeHtml(c.phone) + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;text-align:center;">' + (c.orders || 0) + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;text-align:center;">' + (c.feedback || '5 ★') + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;text-align:center;">' + (c.type || 'Regular') + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;text-align:center;">' + (c.status || 'Active') + '</td>' +
            '</tr>';
    }

    const pct = (n) => totalCustomers > 0 ? ((n / totalCustomers) * 100).toFixed(1) : '0.0';

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Grafix Print Hub - Customer Report</title>' +
    '<style>' +
    'body{font-family:"Segoe UI",Arial,sans-serif;margin:0;padding:20px;background:white;color:#2c3e50;}' +
    '.header{background:#1a1a2e;padding:25px;border-radius:10px;margin-bottom:25px;}' +
    '.header h1{color:white;margin:0;font-size:24px;}' +
    '.header h3{color:#ffc107;margin:5px 0 0;font-size:14px;font-weight:normal;}' +
    '.header p{color:white;margin:10px 0 0;font-size:12px;}' +
    '.section-title{font-size:16px;font-weight:bold;color:#2c3e50;border-left:4px solid #0d6efd;padding-left:12px;margin:25px 0 15px;}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:20px;}' +
    'th{background:#f8f9fa;border:1px solid #ddd;padding:10px;text-align:left;font-weight:bold;font-size:12px;}' +
    'td{border:1px solid #ddd;padding:8px;font-size:12px;}' +
    '.footer{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:11px;color:#666;}' +
    '</style></head><body>' +

    '<div class="header"><h1>GRAFIX PRINT HUB</h1><h3>SYSTEM GENERATED CUSTOMER ANALYSIS</h3>' +
    '<p><strong>REPORT TYPE:</strong> ALL CUSTOMERS &nbsp;|&nbsp; <strong>TIME PERIOD:</strong> ' + fromDateStr + ' TO ' + toDateStr + ' &nbsp;|&nbsp; <strong>GENERATED:</strong> ' + formattedDate + ', ' + formattedTime + '</p></div>' +

    '<div class="section-title">Business Performance Summary</div>' +
    '<table><tr>' +
    '<td style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;text-align:center;padding:20px;border-radius:8px;border:none;">' +
        '<div style="font-size:32px;font-weight:bold;">' + totalCustomers + '</div><div style="font-size:12px;margin-top:5px;">Total Customers</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:linear-gradient(135deg,#f093fb,#f5576c);color:white;text-align:center;padding:20px;border-radius:8px;border:none;">' +
        '<div style="font-size:32px;font-weight:bold;">' + totalOrders + '</div><div style="font-size:12px;margin-top:5px;">Total Orders</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:linear-gradient(135deg,#4facfe,#00f2fe);color:white;text-align:center;padding:20px;border-radius:8px;border:none;">' +
        '<div style="font-size:32px;font-weight:bold;">' + avgOrders + '</div><div style="font-size:12px;margin-top:5px;">Avg Orders/Customer</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:linear-gradient(135deg,#43e97b,#38f9d7);color:#1a1a2e;text-align:center;padding:20px;border-radius:8px;border:none;">' +
        '<div style="font-size:32px;font-weight:bold;">' + avgRating + ' ★</div><div style="font-size:12px;margin-top:5px;">Average Rating</div></td>' +
    '</tr></table>' +

    '<div class="section-title">Customer Distribution</div>' +
    '<table><tr>' +
    '<td style="background:#fff3cd;text-align:center;padding:20px;border-radius:8px;border:1px solid #ffe69c;">' +
        '<div style="font-size:28px;font-weight:bold;">' + vipCount + '</div><div>VIP (' + pct(vipCount) + '%)</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:#d1ecf1;text-align:center;padding:20px;border-radius:8px;border:1px solid #bee5eb;">' +
        '<div style="font-size:28px;font-weight:bold;">' + corporateCount + '</div><div>Corporate (' + pct(corporateCount) + '%)</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:#e2e3e5;text-align:center;padding:20px;border-radius:8px;border:1px solid #d6d8db;">' +
        '<div style="font-size:28px;font-weight:bold;">' + regularCount + '</div><div>Regular (' + pct(regularCount) + '%)</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:#d4edda;text-align:center;padding:20px;border-radius:8px;border:1px solid #c3e6cb;">' +
        '<div style="font-size:28px;font-weight:bold;">' + newCount + '</div><div>New (' + pct(newCount) + '%)</div></td>' +
    '</tr></table>' +

    '<div class="section-title">Feedback Rating Distribution</div>' +
    '<table><tr>' +
    '<td style="background:#fff3cd;text-align:center;padding:20px;border-radius:8px;border:1px solid #ffe69c;">' +
        '<div style="font-size:28px;font-weight:bold;">' + fiveStarCount + '</div><div>&#9733;&#9733;&#9733;&#9733;&#9733; (5 Star)</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:#d1ecf1;text-align:center;padding:20px;border-radius:8px;border:1px solid #bee5eb;">' +
        '<div style="font-size:28px;font-weight:bold;">' + fourStarCount + '</div><div>&#9733;&#9733;&#9733;&#9733;&#9734; (4 Star)</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:#e2e3e5;text-align:center;padding:20px;border-radius:8px;border:1px solid #d6d8db;">' +
        '<div style="font-size:28px;font-weight:bold;">' + threeStarCount + '</div><div>&#9733;&#9733;&#9733;&#9734;&#9734; (3 Star)</div></td>' +
    '</tr></table>' +

    '<div class="section-title">Customer List</div>' +
    '<table><thead><tr>' +
    '<th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Orders</th><th>Rating</th><th>Type</th><th>Status</th>' +
    '</tr></thead><tbody>' + customerRows + '</tbody></table>' +

    '<div class="footer">&copy; Grafix Print Hub - Confidential Customer Report | Generated by CRM System</div>' +
    '</body></html>';
}

function buildFeedbackReportHTML(filteredCustomers, fromDate, toDate) {
    const customersWithFeedback = filteredCustomers.filter(c => c.feedback);
    const totalFeedbacks = customersWithFeedback.length;
    const avgRating = totalFeedbacks > 0 ?
        (customersWithFeedback.reduce((sum, c) => sum + parseInt(c.feedback.charAt(0)), 0) / totalFeedbacks).toFixed(1) : 0;
    const fiveStar = customersWithFeedback.filter(c => c.feedback.includes('5')).length;
    const fourStar = customersWithFeedback.filter(c => c.feedback.includes('4')).length;
    const threeStar = customersWithFeedback.filter(c => c.feedback.includes('3')).length;
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const fromDateStr = formatDateForReport(fromDate);
    const toDateStr = formatDateForReport(toDate);

    let feedbackRows = '';
    for (let i = 0; i < customersWithFeedback.length; i++) {
        const c = customersWithFeedback[i];
        const bg = i % 2 === 0 ? '#ffffff' : '#f9f9f9';
        feedbackRows += '<tr style="background:' + bg + ';">' +
            '<td style="border:1px solid #ddd;padding:8px;">' + escapeHtml(c.name) + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;">' + escapeHtml(c.company) + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;text-align:center;">' + c.feedback + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;text-align:center;">' + (c.orders || 0) + '</td>' +
            '<td style="border:1px solid #ddd;padding:8px;">' + (c.type || 'Regular') + '</td>' +
            '</tr>';
    }

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Grafix Print Hub - Feedback Report</title>' +
    '<style>' +
    'body{font-family:"Segoe UI",Arial,sans-serif;margin:0;padding:20px;background:white;color:#2c3e50;}' +
    '.header{background:#1a1a2e;padding:25px;border-radius:10px;margin-bottom:25px;}' +
    '.header h1{color:white;margin:0;font-size:24px;}' +
    '.header h3{color:#ffc107;margin:5px 0 0;font-size:14px;font-weight:normal;}' +
    '.header p{color:white;margin:10px 0 0;font-size:12px;}' +
    '.section-title{font-size:16px;font-weight:bold;color:#2c3e50;border-left:4px solid #ffc107;padding-left:12px;margin:25px 0 15px;}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:20px;}' +
    'th{background:#f8f9fa;border:1px solid #ddd;padding:10px;text-align:left;font-weight:bold;font-size:12px;}' +
    'td{border:1px solid #ddd;padding:8px;font-size:12px;}' +
    '.footer{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:11px;color:#666;}' +
    '</style></head><body>' +

    '<div class="header"><h1>GRAFIX PRINT HUB</h1><h3>FEEDBACK ANALYSIS REPORT</h3>' +
    '<p><strong>TIME PERIOD:</strong> ' + fromDateStr + ' TO ' + toDateStr + ' &nbsp;|&nbsp; <strong>GENERATED:</strong> ' + formattedDate + ', ' + formattedTime + '</p></div>' +

    '<div class="section-title">Overview</div>' +
    '<table><tr>' +
    '<td style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;text-align:center;padding:25px;border-radius:8px;border:none;">' +
        '<div style="font-size:48px;font-weight:bold;">' + totalFeedbacks + '</div><div style="font-size:14px;margin-top:8px;">Total Feedbacks</div></td>' +
    '<td style="width:20px;border:none;background:white;"></td>' +
    '<td style="background:linear-gradient(135deg,#f093fb,#f5576c);color:white;text-align:center;padding:25px;border-radius:8px;border:none;">' +
        '<div style="font-size:48px;font-weight:bold;">' + avgRating + ' ★</div><div style="font-size:14px;margin-top:8px;">Average Rating</div></td>' +
    '</tr></table>' +

    '<div class="section-title">Rating Distribution</div>' +
    '<table><tr>' +
    '<td style="background:#fff3cd;text-align:center;padding:20px;border-radius:8px;border:1px solid #ffe69c;">' +
        '<div style="font-size:32px;font-weight:bold;">' + fiveStar + '</div><div>&#9733;&#9733;&#9733;&#9733;&#9733; (5 Star)</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:#d1ecf1;text-align:center;padding:20px;border-radius:8px;border:1px solid #bee5eb;">' +
        '<div style="font-size:32px;font-weight:bold;">' + fourStar + '</div><div>&#9733;&#9733;&#9733;&#9733;&#9734; (4 Star)</div></td>' +
    '<td style="width:15px;border:none;background:white;"></td>' +
    '<td style="background:#e2e3e5;text-align:center;padding:20px;border-radius:8px;border:1px solid #d6d8db;">' +
        '<div style="font-size:32px;font-weight:bold;">' + threeStar + '</div><div>&#9733;&#9733;&#9733;&#9734;&#9734; (3 Star)</div></td>' +
    '</tr></table>' +

    '<div class="section-title">Customer Feedback Details</div>' +
    '<table><thead><tr><th>Customer</th><th>Company</th><th>Rating</th><th>Orders</th><th>Type</th></tr></thead>' +
    '<tbody>' + feedbackRows + '</tbody></table>' +

    '<div class="footer">&copy; Grafix Print Hub - Feedback Report</div>' +
    '</body></html>';
}

function buildIndividualReportHTML(customer, fromDate, toDate) {
    const stars = customer.feedback ? parseInt(customer.feedback.charAt(0)) : 5;
    const starsDisplay = '★'.repeat(stars) + '☆'.repeat(5 - stars);
    const statusColor = customer.status === 'Inactive' ? '#dc3545' : '#198754';
    const typeColor = customer.type === 'VIP' ? '#ffc107' : '#6c757d';
    const typeTextColor = customer.type === 'VIP' ? '#000' : '#fff';
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
    const formattedTime = currentDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
    const fromDateStr = formatDateForReport(fromDate);
    const toDateStr = formatDateForReport(toDate);
    const avatarText = getAvatar(customer.name);

    return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Grafix Print Hub - Customer Profile</title>' +
    '<style>' +
    'body{font-family:"Segoe UI",Arial,sans-serif;margin:0;padding:20px;background:white;color:#2c3e50;}' +
    '.header{background:#1a1a2e;padding:25px;border-radius:10px;margin-bottom:25px;}' +
    '.header h1{color:white;margin:0;font-size:24px;}' +
    '.header h3{color:#ffc107;margin:5px 0 0;font-size:14px;font-weight:normal;}' +
    '.header p{color:white;margin:10px 0 0;font-size:12px;}' +
    '.section-title{font-size:16px;font-weight:bold;color:#2c3e50;border-left:4px solid #0d6efd;padding-left:12px;margin:25px 0 15px;}' +
    'table{width:100%;border-collapse:collapse;margin-bottom:20px;}' +
    'td{padding:10px;font-size:13px;}' +
    '.footer{text-align:center;margin-top:30px;padding-top:15px;border-top:1px solid #ddd;font-size:11px;color:#666;}' +
    '.label{color:#6c757d;font-size:11px;font-weight:bold;text-transform:uppercase;display:block;margin-bottom:4px;}' +
    '.value{font-size:14px;font-weight:600;}' +
    '</style></head><body>' +

    '<div class="header"><h1>GRAFIX PRINT HUB</h1><h3>CUSTOMER PROFILE REPORT</h3>' +
    '<p><strong>PERIOD:</strong> ' + fromDateStr + ' TO ' + toDateStr + ' &nbsp;|&nbsp; <strong>GENERATED:</strong> ' + formattedDate + ', ' + formattedTime + '</p></div>' +

    '<table><tr>' +
    '<td style="width:90px;vertical-align:middle;border:none;">' +
        '<div style="width:80px;height:80px;background:linear-gradient(135deg,#195d7a,#3083a8);border-radius:50%;text-align:center;line-height:80px;color:white;font-size:28px;font-weight:bold;">' + avatarText + '</div>' +
    '</td>' +
    '<td style="vertical-align:middle;border:none;">' +
        '<div style="font-size:24px;font-weight:bold;color:#2c3e50;">' + escapeHtml(customer.name) + '</div>' +
        '<div style="color:#6c757d;margin:4px 0;">' + escapeHtml(customer.company) + '</div>' +
        '<span style="background:' + statusColor + ';color:white;padding:4px 12px;border-radius:20px;font-size:11px;">' + (customer.status || 'Active') + '</span>' +
        '&nbsp;<span style="background:' + typeColor + ';color:' + typeTextColor + ';padding:4px 12px;border-radius:20px;font-size:11px;">' + (customer.type || 'Regular') + '</span>' +
    '</td></tr></table>' +

    '<div class="section-title">Contact Information</div>' +
    '<table style="border:1px solid #e9ecef;border-radius:8px;">' +
    '<tr style="background:#f8f9fa;">' +
    '<td style="border-bottom:1px solid #e9ecef;border-right:1px solid #e9ecef;"><span class="label">Email</span><span class="value">' + escapeHtml(customer.email) + '</span></td>' +
    '<td style="border-bottom:1px solid #e9ecef;"><span class="label">Phone</span><span class="value">' + escapeHtml(customer.phone) + '</span></td>' +
    '</tr>' +
    '<tr>' +
    '<td style="border-right:1px solid #e9ecef;"><span class="label">Address</span><span class="value">' + (escapeHtml(customer.address) || 'Not specified') + '</span></td>' +
    '<td><span class="label">Customer Since</span><span class="value">' + (customer.dateAdded || 'N/A') + '</span></td>' +
    '</tr></table>' +

    '<div class="section-title">Performance Summary</div>' +
    '<table><tr>' +
    '<td style="background:linear-gradient(135deg,#e8f4ff,#d0e8ff);text-align:center;padding:25px;border-radius:8px;border:1px solid #bee3f8;">' +
        '<div style="font-size:40px;font-weight:bold;color:#0d6efd;">' + (customer.orders || 0) + '</div>' +
        '<div style="margin-top:8px;color:#2c3e50;">Total Orders</div>' +
    '</td>' +
    '<td style="width:20px;border:none;background:white;"></td>' +
    '<td style="background:linear-gradient(135deg,#fff9e6,#fff3cd);text-align:center;padding:25px;border-radius:8px;border:1px solid #ffe69c;">' +
        '<div style="font-size:40px;font-weight:bold;color:#ffc107;">' + starsDisplay + '</div>' +
        '<div style="margin-top:8px;color:#2c3e50;">Feedback Rating (' + (customer.feedback || '5 ★') + ')</div>' +
    '</td>' +
    '</tr></table>' +

    '<div class="footer">&copy; Grafix Print Hub - Confidential Customer Report</div>' +
    '</body></html>';
}

function downloadReportAsPDF(htmlContent, filename) {
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
        showToast('Pop-up blocked! Please allow pop-ups for this site.', 'danger');
        return;
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    printWindow.onload = function() {
        setTimeout(function() {
            printWindow.focus();
            printWindow.print();
            showToast('Report ready! Use "Save as PDF" in the print dialog.', 'success');
        }, 500);
    };
}
// ==================== HELPER FUNCTIONS ====================

function getStarsFromFeedback(feedback) {
    const rating = parseInt(feedback);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating ? '<i class="bi bi-star-fill"></i>' : '<i class="bi bi-star"></i>';
    }
    return stars;
}

function getAvatar(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function escapeHtml(str) {
    if (!str) return str;
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function validatePhone(phone) {
    return /^\d{10}$/.test(phone);
}

function validateOrders(orders) {
    return orders >= 0;
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhoneField() {
    const phoneInput = document.getElementById('customerPhone');
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const errorDiv = phoneInput ? phoneInput.nextElementSibling : null;
    
    if (phone && !validatePhone(phone)) {
        if (phoneInput) phoneInput.classList.add('is-invalid-custom');
        if (errorDiv && errorDiv.classList && !errorDiv.classList.contains('invalid-feedback-custom')) {
            const newDiv = document.createElement('div');
            newDiv.className = 'invalid-feedback-custom';
            newDiv.innerText = 'Phone number must be exactly 10 digits';
            if (phoneInput && phoneInput.parentNode) phoneInput.parentNode.insertBefore(newDiv, phoneInput.nextSibling);
        }
        return false;
    } else {
        if (phoneInput) phoneInput.classList.remove('is-invalid-custom');
        if (errorDiv && errorDiv.classList && errorDiv.classList.contains('invalid-feedback-custom')) errorDiv.remove();
        return true;
    }
}

function validateOrdersField() {
    const ordersInput = document.getElementById('customerOrders');
    const orders = ordersInput ? parseInt(ordersInput.value) || 0 : 0;
    const errorDiv = ordersInput ? ordersInput.nextElementSibling : null;
    
    if (!validateOrders(orders)) {
        if (ordersInput) ordersInput.classList.add('is-invalid-custom');
        if (errorDiv && errorDiv.classList && !errorDiv.classList.contains('invalid-feedback-custom')) {
            const newDiv = document.createElement('div');
            newDiv.className = 'invalid-feedback-custom';
            newDiv.innerText = 'Orders cannot be negative';
            if (ordersInput && ordersInput.parentNode) ordersInput.parentNode.insertBefore(newDiv, ordersInput.nextSibling);
        }
        return false;
    } else {
        if (ordersInput) ordersInput.classList.remove('is-invalid-custom');
        if (errorDiv && errorDiv.classList && errorDiv.classList.contains('invalid-feedback-custom')) errorDiv.remove();
        return true;
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.innerText = message;
    toast.className = `toast bg-${type} text-white`;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

function setupEventListeners() {
    const saveBtn = document.getElementById('saveCustomerBtn');
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    const addModal = document.getElementById('addCustomerModal');
    const phoneInput = document.getElementById('customerPhone');
    const ordersInput = document.getElementById('customerOrders');
    
    if (saveBtn) saveBtn.addEventListener('click', saveCustomer);
    if (confirmBtn) confirmBtn.addEventListener('click', deleteCustomer);
    if (addModal) addModal.addEventListener('hidden.bs.modal', resetModalForm);
    if (phoneInput) phoneInput.addEventListener('input', validatePhoneField);
    if (ordersInput) ordersInput.addEventListener('input', validateOrdersField);
}

// ==================== GLOBAL EXPORTS ====================

window.openAddCustomerModal = openAddCustomerModal;
window.showPage = showPage;
window.applyFilters = applyFilters;
window.resetFilters = resetFilters;
window.viewCustomer = viewCustomer;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.toggleCustomerStatus = toggleCustomerStatus;
window.selectReportType = selectReportType;
window.generateSelectedReport = generateSelectedReport;
window.closePreview = closePreview;