// Customer data array (synced with Firestore)
let customers = [];
let currentDeleteId = null;
let currentFilter = {
    search: '',
    type: '',
    rating: ''
};

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
        if (mainDashboard) mainDashboard.style.display = 'block';
        document.querySelectorAll('.page-container').forEach(page => {
            page.classList.remove('active-page');
        });
    } else {
        if (mainDashboard) mainDashboard.style.display = 'none';
        const selectedPage = document.getElementById(`${pageName}Page`);
        if (selectedPage) {
            selectedPage.classList.add('active-page');
        }
        
        if (pageName === 'feedbacks') {
            loadFeedbacks();
        } else if (pageName === 'profiles') {
            renderFilteredCustomersTable();
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
        renderFilteredCustomersTable();
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

// FILTER CUSTOMERS
function filterCustomers() {
    const searchTerm = currentFilter.search.toLowerCase();
    const typeFilter = currentFilter.type;
    const ratingFilter = currentFilter.rating;
    
    return customers.filter(c => {
        // Search filter
        const matchesSearch = searchTerm === '' || 
            (c.name && c.name.toLowerCase().includes(searchTerm)) ||
            (c.email && c.email.toLowerCase().includes(searchTerm)) ||
            (c.company && c.company.toLowerCase().includes(searchTerm)) ||
            (c.phone && c.phone.includes(searchTerm));
        
        // Type filter
        const matchesType = typeFilter === '' || (c.type === typeFilter);
        
        // Rating filter
        let matchesRating = true;
        if (ratingFilter !== '') {
            const ratingValue = c.feedback ? parseInt(c.feedback.charAt(0)) : 5;
            matchesRating = ratingValue === parseInt(ratingFilter);
        }
        
        return matchesSearch && matchesType && matchesRating;
    });
}

// Apply filters from UI
function applyFilters() {
    const searchInput = document.getElementById('customerSearch');
    const typeSelect = document.getElementById('filterType');
    const ratingSelect = document.getElementById('filterRating');
    
    currentFilter.search = searchInput ? searchInput.value : '';
    currentFilter.type = typeSelect ? typeSelect.value : '';
    currentFilter.rating = ratingSelect ? ratingSelect.value : '';
    
    renderFilteredCustomersTable();
}

// Reset all filters
function resetFilters() {
    currentFilter = { search: '', type: '', rating: '' };
    
    const searchInput = document.getElementById('customerSearch');
    const typeSelect = document.getElementById('filterType');
    const ratingSelect = document.getElementById('filterRating');
    
    if (searchInput) searchInput.value = '';
    if (typeSelect) typeSelect.value = '';
    if (ratingSelect) ratingSelect.value = '';
    
    renderFilteredCustomersTable();
}

// RENDER FILTERED TABLE for Profiles page
function renderFilteredCustomersTable() {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    
    const filteredCustomers = filterCustomers();
    
    tableBody.innerHTML = '';
    
    if (filteredCustomers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center text-muted py-4">
                    <i class="bi bi-inbox"></i> No customers found. Try different search or filters.
                </td>
            </tr>
        `;
        return;
    }
    
    filteredCustomers.forEach(c => {
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
            </td
            <td>${c.company}</td
            <td>${c.email}</td
            <td>${c.phone}</td
            <td style="max-width: 200px; white-space: normal;">${c.address || 'Not specified'}</td
            <td><span class="badge bg-primary">${c.orders || 0} orders</span></td
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td
            <td>
                <div class="action-icons">
                    <i class="bi bi-eye action-icon icon-view" onclick="viewCustomer('${c.id}')" title="View Details"></i>
                    <i class="bi bi-pencil action-icon icon-edit" onclick="openEditModal('${c.id}')" title="Edit Customer"></i>
                    <i class="bi bi-trash action-icon icon-delete" onclick="openDeleteModal('${c.id}', '${c.name}')" title="Delete Customer"></i>
                </div>
            </td
        `;
        tableBody.appendChild(row);
    });
}

// RENDER TABLE (alias for compatibility)
function renderCustomersTable() {
    renderFilteredCustomersTable();
}

// Validation functions
function validatePhone(phone) {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
}

function validateOrders(orders) {
    return orders >= 0;
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

// Load Feedbacks
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

// Enhanced Report HTML Generation (Professional Summary)
function generateReportHTML() {
    const totalCustomers = customers.length;
    const totalOrders = customers.reduce((sum, c) => sum + (c.orders || 0), 0);
    const avgOrders = totalCustomers > 0 ? (totalOrders / totalCustomers).toFixed(1) : 0;
    const vipCount = customers.filter(c => c.type === 'VIP').length;
    const corporateCount = customers.filter(c => c.type === 'Corporate').length;
    const newCount = customers.filter(c => c.type === 'New').length;
    const regularCount = customers.filter(c => c.type === 'Regular' || !c.type).length;
    
    const fiveStarCount = customers.filter(c => c.feedback && c.feedback.includes('5')).length;
    const fourStarCount = customers.filter(c => c.feedback && c.feedback.includes('4')).length;
    const threeStarCount = customers.filter(c => c.feedback && c.feedback.includes('3')).length;
    
    const avgRating = totalCustomers > 0 ? 
        (customers.reduce((sum, c) => sum + (c.feedback ? parseInt(c.feedback.charAt(0)) : 5), 0) / totalCustomers).toFixed(1) : 0;
    
    const currentDate = new Date().toLocaleString();
    const reportDate = new Date().toISOString().split('T')[0];
    
    return `
        <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #0d6efd;">
            <h2 style="color: #2c3e50; margin-bottom: 5px;">GRAFIX PRINT HUB</h2>
            <h4 style="color: #6c757d;">SYSTEM GENERATED CUSTOMER ANALYSIS</h4>
            <p style="color: #7f8c8d; margin-top: 10px;">REPORT TYPE: CUSTOMER SUMMARY</p>
            <p style="color: #7f8c8d;">TIME PERIOD: ${reportDate}</p>
            <p style="color: #7f8c8d;">GENERATED: ${currentDate}</p>
        </div>
        
        <!-- Business Performance Summary -->
        <div style="margin-bottom: 30px;">
            <h5 style="color: #2c3e50; border-left: 4px solid #0d6efd; padding-left: 12px; margin-bottom: 20px;">Business Performance Summary</h5>
            <div class="stats-summary-row" style="display: flex; gap: 15px; flex-wrap: wrap;">
                <div class="stat-summary-card" style="flex: 1; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 12px; text-align: center;">
                    <div class="stat-summary-value" style="font-size: 28px; font-weight: 700;">${totalCustomers}</div>
                    <div class="stat-summary-label" style="font-size: 11px; opacity: 0.9;">Total Customers</div>
                </div>
                <div class="stat-summary-card" style="flex: 1; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 15px; border-radius: 12px; text-align: center;">
                    <div class="stat-summary-value" style="font-size: 28px; font-weight: 700;">${totalOrders}</div>
                    <div class="stat-summary-label" style="font-size: 11px; opacity: 0.9;">Total Orders</div>
                </div>
                <div class="stat-summary-card" style="flex: 1; background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 15px; border-radius: 12px; text-align: center;">
                    <div class="stat-summary-value" style="font-size: 28px; font-weight: 700;">${avgOrders}</div>
                    <div class="stat-summary-label" style="font-size: 11px; opacity: 0.9;">Avg Orders/Customer</div>
                </div>
                <div class="stat-summary-card" style="flex: 1; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; padding: 15px; border-radius: 12px; text-align: center;">
                    <div class="stat-summary-value" style="font-size: 28px; font-weight: 700;">${avgRating}</div>
                    <div class="stat-summary-label" style="font-size: 11px; opacity: 0.9;">Avg Rating ★</div>
                </div>
            </div>
        </div>
        
        <!-- Customer Distribution -->
        <div style="margin-bottom: 25px;">
            <h5 style="color: #2c3e50; border-left: 4px solid #198754; padding-left: 12px; margin-bottom: 15px;">Customer Distribution by Type</h5>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Customer Type</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Count</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Percentage</th>
                 </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">⭐ VIP</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${vipCount}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalCustomers > 0 ? ((vipCount/totalCustomers)*100).toFixed(1) : 0}%</td>
                 </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">🏢 Corporate</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${corporateCount}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalCustomers > 0 ? ((corporateCount/totalCustomers)*100).toFixed(1) : 0}%</td>
                 </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">🆕 New</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${newCount}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalCustomers > 0 ? ((newCount/totalCustomers)*100).toFixed(1) : 0}%</td>
                 </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">📋 Regular</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${regularCount}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalCustomers > 0 ? ((regularCount/totalCustomers)*100).toFixed(1) : 0}%</td>
                 </tr>
             </table>
        </div>
        
        <!-- Feedback Distribution -->
        <div style="margin-bottom: 25px;">
            <h5 style="color: #2c3e50; border-left: 4px solid #ffc107; padding-left: 12px; margin-bottom: 15px;">Feedback Rating Distribution</h5>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr style="background: #f8f9fa;">
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Rating</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Count</th>
                    <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Percentage</th>
                 </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">★★★★★ (5 Star)</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fiveStarCount}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalCustomers > 0 ? ((fiveStarCount/totalCustomers)*100).toFixed(1) : 0}%</td>
                 </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">★★★★☆ (4 Star)</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${fourStarCount}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalCustomers > 0 ? ((fourStarCount/totalCustomers)*100).toFixed(1) : 0}%</td>
                 </tr>
                <tr>
                    <td style="padding: 8px; border: 1px solid #ddd;">★★★☆☆ (3 Star)</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${threeStarCount}</td>
                    <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${totalCustomers > 0 ? ((threeStarCount/totalCustomers)*100).toFixed(1) : 0}%</td>
                 </tr>
             </table>
        </div>
        
        <!-- Customer List Table -->
        <div>
            <h5 style="color: #2c3e50; border-left: 4px solid #0dcaf0; padding-left: 12px; margin-bottom: 15px;">Customer List</h5>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                <thead>
                    <tr style="background: #f8f9fa;">
                        <th style="padding: 8px; border: 1px solid #ddd;">Name</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Company</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Email</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Phone</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Orders</th>
                        <th style="padding: 8px; border: 1px solid #ddd;">Rating</th>
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
                            <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${c.feedback || '5 ★'}</td>
                            <td style="padding: 6px; border: 1px solid #ddd; text-align: center;">${c.type || 'Regular'}</td>
                         </tr>
                    `).join('')}
                </tbody>
             </table>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd;">
            <small style="color: #7f8c8d;">&copy; Grafix Print Hub - Confidential Customer Report | Generated by CRM System</small>
        </div>
    `;
}

// Preview Report
function previewReport() {
    const reportContent = generateReportHTML();
    document.getElementById('reportContent').innerHTML = reportContent;
    document.getElementById('reportPreview').style.display = 'block';
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
        addModal.addEventListener('hidden.bs.modal', resetModalForm);
    }
    
    // Add real-time phone validation
    const phoneInput = document.getElementById('customerPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', validatePhoneField);
    }
    
    // Add real-time orders validation
    const ordersInput = document.getElementById('customerOrders');
    if (ordersInput) {
        ordersInput.addEventListener('input', validateOrdersField);
    }
}

function validatePhoneField() {
    const phoneInput = document.getElementById('customerPhone');
    const phone = phoneInput.value.trim();
    
    if (phone && !validatePhone(phone)) {
        phoneInput.classList.add('is-invalid-custom');
        let errorDiv = phoneInput.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('invalid-feedback-custom')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback-custom';
            phoneInput.parentNode.insertBefore(errorDiv, phoneInput.nextSibling);
        }
        errorDiv.innerText = 'Phone number must be exactly 10 digits';
        return false;
    } else {
        phoneInput.classList.remove('is-invalid-custom');
        const errorDiv = phoneInput.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback-custom')) {
            errorDiv.remove();
        }
        return true;
    }
}

function validateOrdersField() {
    const ordersInput = document.getElementById('customerOrders');
    const orders = parseInt(ordersInput.value) || 0;
    
    if (!validateOrders(orders)) {
        ordersInput.classList.add('is-invalid-custom');
        let errorDiv = ordersInput.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('invalid-feedback-custom')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback-custom';
            ordersInput.parentNode.insertBefore(errorDiv, ordersInput.nextSibling);
        }
        errorDiv.innerText = 'Orders cannot be negative';
        return false;
    } else {
        ordersInput.classList.remove('is-invalid-custom');
        const errorDiv = ordersInput.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback-custom')) {
            errorDiv.remove();
        }
        return true;
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
    
    // Validate phone number (exactly 10 digits)
    if (!validatePhone(phone)) {
        showToast('Phone number must be exactly 10 digits!', 'danger');
        return;
    }
    
    // Validate orders (non-negative)
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
        modal.hide();
        
        resetModalForm();
        loadCustomersFromFirestore();

    } catch (error) {
        showToast('Error saving customer: ' + error.message, 'danger');
    }
}

function openEditModal(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    const modalLabel = document.getElementById('addCustomerModalLabel');
    modalLabel.innerHTML = '<i class="bi bi-pencil-fill me-2"></i>Update Customer';
    
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

function resetModalForm() {
    const modalLabel = document.getElementById('addCustomerModalLabel');
    modalLabel.innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Add New Customer';
    
    document.getElementById('customerId').value = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerCompany').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerOrders').value = '0';
    document.getElementById('customerFeedback').value = '5 ★';
    document.getElementById('customerType').value = 'Regular';
    
    // Clear validation errors
    document.querySelectorAll('.is-invalid-custom').forEach(el => {
        el.classList.remove('is-invalid-custom');
    });
    document.querySelectorAll('.invalid-feedback-custom').forEach(el => {
        el.remove();
    });
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