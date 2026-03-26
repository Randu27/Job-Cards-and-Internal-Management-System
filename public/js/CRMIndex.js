// Customer data array (synced with Firestore)
let customers = [];
let currentDeleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
    // Show home page by default
    showPage('home');
});

function initializePage() {
    loadCustomersFromFirestore();
}

// Open Add Customer Modal
function openAddCustomerModal() {
    resetModalForm();
    const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    modal.show();
}

// Page navigation function
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-container').forEach(page => {
        page.classList.remove('active-page');
    });
    
    // Hide main dashboard
    const mainDashboard = document.getElementById('mainDashboard');
    
    if (pageName === 'home') {
        // Show main dashboard
        if (mainDashboard) mainDashboard.style.display = 'block';
        // Hide all pages
        document.querySelectorAll('.page-container').forEach(page => {
            page.classList.remove('active-page');
        });
    } else {
        // Hide main dashboard
        if (mainDashboard) mainDashboard.style.display = 'none';
        // Show selected page
        const selectedPage = document.getElementById(`${pageName}Page`);
        if (selectedPage) {
            selectedPage.classList.add('active-page');
        }
        
        // Load specific content based on page
        if (pageName === 'feedbacks') {
            loadFeedbacks();
        } else if (pageName === 'profiles') {
            renderCustomersTable();
        } else if (pageName === 'reports') {
            previewReport();
        }
    }
}

// LOAD FROM FIRESTORE
function loadCustomersFromFirestore() {
    db.collection('customers').orderBy('dateAdded', 'desc').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        updateStats();
        renderCustomersTable();
        if (document.getElementById('feedbacksPage') && document.getElementById('feedbacksPage').classList.contains('active-page')) {
            loadFeedbacks();
        }
    }).catch((error) => {
        console.error('Error loading customers:', error);
        showToast('Error loading customers: ' + error.message, 'danger');
    });
}

// UPDATE STATS
function updateStats() {
    const totalCustomers = customers.length;
    const newFeedbacks = customers.filter(c => c.feedback && c.feedback.includes('5')).length;
    
    document.getElementById('totalCustomers').innerText = totalCustomers;
    document.getElementById('newFeedbacks').innerText = newFeedbacks;
}

// RENDER TABLE for Profiles page with icon buttons
function renderCustomersTable() {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox"></i> No customers found. Click "Add New" to add one.
                </td
            </tr>
        `;
        return;
    }
    
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <span class="customer-avatar me-2">${getAvatar(c.name)}</span>
                    <div>
                        <div class="fw-bold">${c.name}</div>
                        <small class="text-muted">${c.type || 'Regular'}</small>
                    </div>
                </div>
            </td>
            <td>${c.company}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td style="max-width: 200px; white-space: normal;">${c.address || 'Not specified'}</td>
            <td><span class="badge bg-primary">${c.orders || 0} orders</span></td>
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td>
            <td>
                <div class="action-icons">
                    <i class="bi bi-eye action-icon icon-view" onclick="viewCustomer('${c.id}')" title="View Details"></i>
                    <i class="bi bi-pencil action-icon icon-edit" onclick="openEditModal('${c.id}')" title="Edit Customer"></i>
                    <i class="bi bi-trash action-icon icon-delete" onclick="openDeleteModal('${c.id}', '${c.name}')" title="Delete Customer"></i>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// View Customer Details
function viewCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    const stars = getStarsFromFeedback(customer.feedback);
    const detailsHtml = `
        <div class="text-center mb-3">
            <span class="customer-avatar" style="width: 60px; height: 60px; font-size: 24px; line-height: 60px;">${getAvatar(customer.name)}</span>
            <h5 class="mt-2">${customer.name}</h5>
            <span class="badge bg-${customer.type === 'VIP' ? 'warning' : customer.type === 'Corporate' ? 'info' : 'secondary'}">${customer.type || 'Regular'}</span>
        </div>
        <hr>
        <div class="row">
            <div class="col-6">
                <small class="text-muted">Company</small>
                <p class="fw-bold">${customer.company}</p>
            </div>
            <div class="col-6">
                <small class="text-muted">Email</small>
                <p class="fw-bold">${customer.email}</p>
            </div>
            <div class="col-6">
                <small class="text-muted">Phone</small>
                <p class="fw-bold">${customer.phone}</p>
            </div>
            <div class="col-6">
                <small class="text-muted">Address</small>
                <p class="fw-bold">${customer.address || 'Not specified'}</p>
            </div>
            <div class="col-6">
                <small class="text-muted">Total Orders</small>
                <p class="fw-bold">${customer.orders || 0}</p>
            </div>
            <div class="col-6">
                <small class="text-muted">Feedback Rating</small>
                <p class="fw-bold">${stars} ${customer.feedback || '5 ★'}</p>
            </div>
            <div class="col-12">
                <small class="text-muted">Customer Since</small>
                <p class="fw-bold">${customer.dateAdded || 'N/A'}</p>
            </div>
        </div>
    `;
    
    document.getElementById('viewCustomerDetails').innerHTML = detailsHtml;
    const modal = new bootstrap.Modal(document.getElementById('viewCustomerModal'));
    modal.show();
}

// Load Feedbacks with Customer Details and Colorful Borders
function loadFeedbacks() {
    const container = document.getElementById('feedbacksContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    const customersWithFeedback = customers.filter(c => c.feedback);
    
    if (customersWithFeedback.length === 0) {
        container.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-chat-square-text fs-1"></i>
                <p class="mt-2">No feedback available yet.</p>
            </div>
        `;
        return;
    }
    
    customersWithFeedback.forEach(c => {
        const stars = getStarsFromFeedback(c.feedback);
        const feedbackCard = document.createElement('div');
        
        // Determine card class based on customer type
        let cardClass = 'feedback-card';
        if (c.type === 'VIP') {
            cardClass += ' vip-card';
        } else if (c.type === 'Corporate') {
            cardClass += ' corporate-card';
        } else if (c.type === 'New') {
            cardClass += ' new-card';
        } else {
            cardClass += ' regular-card';
        }
        
        feedbackCard.className = cardClass;
        feedbackCard.innerHTML = `
            <div class="d-flex justify-content-between align-items-start mb-3">
                <div class="d-flex align-items-center">
                    <span class="customer-avatar me-3">${getAvatar(c.name)}</span>
                    <div>
                        <h6 class="fw-bold mb-0" style="font-size: 16px;">${c.name}</h6>
                        <small class="text-muted"><i class="bi bi-building"></i> ${c.company}</small>
                    </div>
                </div>
                <div class="feedback-stars">${stars}</div>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <div class="info-item">
                        <i class="bi bi-envelope"></i>
                        <span><strong>Email:</strong> ${c.email}</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-telephone"></i>
                        <span><strong>Phone:</strong> ${c.phone}</span>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="info-item">
                        <i class="bi bi-geo-alt"></i>
                        <span><strong>Address:</strong> ${c.address || 'Not specified'}</span>
                    </div>
                    <div class="info-item">
                        <i class="bi bi-bag-check"></i>
                        <span><strong>Orders:</strong> ${c.orders || 0}</span>
                    </div>
                </div>
            </div>
            <div class="info-row">
                <div class="d-flex justify-content-between align-items-center">
                    <small class="text-muted">
                        <i class="bi bi-calendar"></i> Customer since: ${c.dateAdded || 'N/A'}
                    </small>
                    <span class="badge bg-${c.type === 'VIP' ? 'warning' : c.type === 'Corporate' ? 'info' : c.type === 'New' ? 'success' : 'secondary'}">
                        ${c.type || 'Regular'}
                    </span>
                </div>
            </div>
        `;
        container.appendChild(feedbackCard);
    });
}

// Preview Report
function previewReport() {
    const reportContent = generateReportHTML();
    document.getElementById('reportContent').innerHTML = reportContent;
    document.getElementById('reportPreview').style.display = 'block';
}

// Simple Report HTML Generation
function generateReportHTML() {
    const totalCustomers = customers.length;
    const totalOrders = customers.reduce((sum, c) => sum + (c.orders || 0), 0);
    const avgOrders = totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(1) : 0;
    const vipCount = customers.filter(c => c.type === 'VIP').length;
    const currentDate = new Date().toLocaleString();
    
    return `
        <div style="text-align: center; margin-bottom: 20px;">
            <h4>Grafix Print Hub</h4>
            <h5>Customer Report</h5>
            <p>Generated on: ${currentDate}</p>
            <hr>
        </div>
        
        <div style="margin-bottom: 20px;">
            <h6>Summary Statistics</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="background: #f8f9fa;">
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Metric</th>
                    <th style="padding: 8px; border: 1px solid #ddd; text-align: right;">Value</th>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #ddd;">Total Customers</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${totalCustomers}</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #ddd;">Total Orders</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${totalOrders}</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #ddd;">Average Orders per Customer</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${avgOrders}</td>
                </tr>
                <tr>
                    <td style="padding: 6px; border: 1px solid #ddd;">VIP Customers</td>
                    <td style="padding: 6px; border: 1px solid #ddd; text-align: right;">${vipCount}</td>
                </tr>
            </table>
        </div>
        
        <div>
            <h6>Customer List</h6>
            <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Name</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Company</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Phone</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Orders</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(c => `
                        <tr>
                            <td style="padding: 6px; border: 1px solid #ddd;">${c.name}</td>
                            <td style="padding: 6px; border: 1px solid #ddd;">${c.company}</td>
                            <td style="padding: 6px; border: 1px solid #ddd;">${c.email}</td>
                            <td style="padding: 6px; border: 1px solid #ddd;">${c.phone}</td>
                            <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${c.orders || 0}</td>
                            <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${c.type || 'Regular'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd;">
            <small>Grafix Print Hub - Confidential Report</small>
        </div>
    `;
}

// Generate and Download PDF Report
async function generateAndDownloadReport() {
    const reportHTML = generateReportHTML();
    const reportElement = document.createElement('div');
    reportElement.innerHTML = `
        <div style="padding: 30px; font-family: Arial, sans-serif;">
            ${reportHTML}
        </div>
    `;
    
    document.body.appendChild(reportElement);
    
    const opt = {
        margin: 0.5,
        filename: `Grafix_CRM_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    try {
        await html2pdf().set(opt).from(reportElement).save();
        showToast('Report generated and downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showToast('Error generating report: ' + error.message, 'danger');
    } finally {
        document.body.removeChild(reportElement);
    }
}

function getStarsFromFeedback(feedback) {
    const rating = parseInt(feedback);
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<i class="bi bi-star-fill"></i>';
        } else {
            stars += '<i class="bi bi-star"></i>';
        }
    }
    return stars;
}

function getAvatar(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function setupEventListeners() {
    const saveBtn = document.getElementById('saveCustomerBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCustomer);
    }
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', deleteCustomer);
    }
    
    const addModal = document.getElementById('addCustomerModal');
    if (addModal) {
        // Reset modal form when modal is hidden
        addModal.addEventListener('hidden.bs.modal', resetModalForm);
    }
}

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

    const customerData = {
        name: name,
        company: company,
        email: email,
        phone: phone,
        address: address || 'Not specified',
        orders: orders,
        type: type,
        feedback: feedback,
        dateAdded: new Date().toISOString().split('T')[0]
    };

    try {
        if (id) {
            // UPDATE Operation
            await db.collection('customers').doc(id).update(customerData);
            showToast(`Customer "${name}" updated successfully!`, 'success');
        } else {
            // CREATE Operation
            await db.collection('customers').add(customerData);
            showToast(`Customer "${name}" added successfully!`, 'success');
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();
        
        // Reset form after saving
        resetModalForm();
        
        // Reload customers
        loadCustomersFromFirestore();

    } catch (error) {
        showToast('Error saving customer: ' + error.message, 'danger');
    }
}

// Open Edit Modal - This function is called when clicking edit icon
function openEditModal(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    // Change modal title to "Update Customer"
    const modalLabel = document.getElementById('addCustomerModalLabel');
    modalLabel.innerHTML = '<i class="bi bi-pencil-fill me-2"></i>Update Customer';
    
    // Fill the form with customer data
    document.getElementById('customerId').value = customer.id;
    document.getElementById('customerName').value = customer.name;
    document.getElementById('customerCompany').value = customer.company;
    document.getElementById('customerEmail').value = customer.email;
    document.getElementById('customerPhone').value = customer.phone;
    document.getElementById('customerAddress').value = customer.address || '';
    document.getElementById('customerOrders').value = customer.orders || 0;
    document.getElementById('customerFeedback').value = customer.feedback || '5 ★';
    document.getElementById('customerType').value = customer.type || 'Regular';
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('addCustomerModal'));
    modal.show();
}

function openDeleteModal(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteCustomerName').innerText = name;
    const modal = new bootstrap.Modal(document.getElementById('deleteModal'));
    modal.show();
}

async function deleteCustomer() {
    if (!currentDeleteId) return;
    
    try {
        await db.collection('customers').doc(currentDeleteId).delete();
        showToast('Customer deleted successfully!', 'success');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error deleting customer: ' + error.message, 'danger');
    }
}

// Reset Modal Form - This is called when modal is closed
function resetModalForm() {
    // Change modal title back to "Add New Customer"
    const modalLabel = document.getElementById('addCustomerModalLabel');
    modalLabel.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Add New Customer';
    
    // Clear all form fields
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerCompany').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerOrders').value = '0';
    document.getElementById('customerFeedback').value = '5 ★';
    document.getElementById('customerType').value = 'Regular';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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