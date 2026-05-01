// ============================================================
// CRM MODULE - CUSTOMER RELATIONSHIP MANAGEMENT
// Developed by: R.G.S. Nadeesha (Cyber Serpents WD-41)
// ============================================================

let customers = [];
let currentDeleteId = null;
let selectedReportType = 'all';
let currentFilter = { search: '', type: '', rating: '', status: '' };

// ==================== CUSTOMER CODE CONFIG ====================

const CUSTOMER_CODE_CONFIG = {
    prefix: 'GPH-CUST-',
    
    generateCode: function() {
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return this.prefix + timestamp + random;
    },
    
    generateSequentialCode: async function() {
        try {
            const snapshot = await db.collection('customers')
                .orderBy('customerCode', 'desc')
                .limit(1)
                .get();
            
            let lastNumber = 0;
            if (!snapshot.empty) {
                const lastCode = snapshot.docs[0].data().customerCode;
                const match = lastCode.match(/\d+$/);
                if (match) {
                    lastNumber = parseInt(match[0]);
                }
            }
            
            const newNumber = lastNumber + 1;
            return this.prefix + newNumber.toString().padStart(6, '0');
        } catch (error) {
            console.error('Error generating sequential code:', error);
            return this.generateCode();
        }
    },
    
    formatDisplay: function(code) {
        if (!code) return 'Not assigned';
        return code;
    }
};

// ==================== RATING CONFIG ====================

const RATING_CONFIG = {
    levels: [
        { value: 5, label: 'Excellent' },
        { value: 4, label: 'Good'      },
        { value: 3, label: 'Average'   },
        { value: 2, label: 'Poor'      },
        { value: 1, label: 'Very Poor' }
    ],
    getRatingValue: function(feedbackStr) {
        if (!feedbackStr) return 5;
        const match = feedbackStr.match(/^(\d+)/);
        return match ? parseInt(match[1]) : 5;
    },
    getRatingLabel: function(value) {
        const level = this.levels.find(l => l.value === value);
        return level ? level.label : 'Excellent';
    },
    getStarHtml: function(ratingValue, iconFilled = 'bi-star-fill', iconEmpty = 'bi-star') {
        let html = '';
        for (let i = 0; i < 5; i++) {
            html += `<i class="bi ${i < ratingValue ? iconFilled : iconEmpty} text-warning"></i>`;
        }
        return html;
    },
    getRatingOptionsHtml: function() {
        let options = '';
        this.levels.forEach(level => {
            options += `<option value="${level.value} ★">${level.value} ★ - ${level.label}</option>`;
        });
        return options;
    },
    getFilterOptionsHtml: function() {
        let options = '<option value="">All Ratings</option>';
        this.levels.forEach(level => {
            options += `<option value="${level.value}">${level.value} ★ - ${level.label}</option>`;
        });
        return options;
    }
};

// ==================== CUSTOMER TYPE CONFIG ====================

const CUSTOMER_TYPE_CONFIG = {
    types: [
        { value: 'VIP',       label: 'VIP',       badgeClass: 'bg-warning'   },
        { value: 'Corporate', label: 'Corporate', badgeClass: 'bg-info'      },
        { value: 'Regular',   label: 'Regular',   badgeClass: 'bg-secondary' },
        { value: 'New',       label: 'New',       badgeClass: 'bg-success'   }
    ],
    getOptionsHtml: function() {
        let options = '';
        this.types.forEach(type => {
            options += `<option value="${type.value}">${type.label}</option>`;
        });
        return options;
    },
    getBadgeClass: function(typeValue) {
        const type = this.types.find(t => t.value === typeValue);
        return type ? type.badgeClass : 'bg-secondary';
    },
    getLabel: function(typeValue) {
        const type = this.types.find(t => t.value === typeValue);
        return type ? type.label : 'Regular';
    }
};

// ==================== STATUS CONFIG ====================

const STATUS_CONFIG = {
    getBadgeClass: function(statusValue) {
        return statusValue === 'Inactive' ? 'bg-secondary' : 'bg-success';
    }
};

// ==================== DATE HELPERS ====================

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString(navigator.language || 'en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
    });
}

// ==================== VALIDATION FUNCTIONS ====================

function validatePhone(phone) {
    if (!phone) return false;
    const cleaned = phone.toString().replace(/[\s\-().+]/g, '');
    return /^\d{10}$/.test(cleaned) || /^\d{7,15}$/.test(cleaned);
}

function isValidEmail(email) {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateField(field, isValid, errorMessage) {
    if (!field) return;
    
    const existingError = field.parentElement.querySelector('.invalid-feedback-custom');
    if (existingError) existingError.remove();
    
    if (field.value.trim() !== '' && !isValid) {
        field.classList.add('is-invalid-custom');
        const errorDiv = document.createElement('div');
        errorDiv.className = 'invalid-feedback-custom';
        errorDiv.innerText = errorMessage;
        field.parentElement.appendChild(errorDiv);
        return false;
    } else {
        field.classList.remove('is-invalid-custom');
        return true;
    }
}

function validatePhoneField() {
    const phoneInput = document.getElementById('customerPhone');
    if (!phoneInput) return true;
    
    if (phoneInput.value.trim() === '') {
        phoneInput.classList.remove('is-invalid-custom');
        return true;
    }
    
    const isValid = validatePhone(phoneInput.value.trim());
    validateField(phoneInput, isValid, 'Please enter a valid phone number (10 digits for Sri Lanka)');
    return isValid;
}

function validateEmailField() {
    const emailInput = document.getElementById('customerEmail');
    if (!emailInput) return true;
    
    if (emailInput.value.trim() === '') {
        emailInput.classList.remove('is-invalid-custom');
        return true;
    }
    
    const isValid = isValidEmail(emailInput.value.trim());
    validateField(emailInput, isValid, 'Please enter a valid email address (e.g., name@example.com)');
    return isValid;
}

function validateOrdersField() {
    const ordersInput = document.getElementById('customerOrders');
    if (!ordersInput) return true;
    
    const value = parseInt(ordersInput.value);
    const isValid = !isNaN(value) && value >= 0;
    validateField(ordersInput, isValid, 'Orders cannot be negative');
    return isValid;
}

// ==================== INITIALIZATION ====================

document.addEventListener('DOMContentLoaded', function () {
    loadCustomersFromFirestore();
    setupEventListeners();
    showPage('home');
    initializeEmailJS();
    populateDynamicDropdowns();
    setupNoticeButton();
});

function initializeEmailJS() {
    emailjs.init('Aa2hQOYFJ0qwR6b4z');
}

function populateDynamicDropdowns() {
    const feedbackSelect = document.getElementById('customerFeedback');
    if (feedbackSelect) feedbackSelect.innerHTML = RATING_CONFIG.getRatingOptionsHtml();

    const filterRatingSelect = document.getElementById('filterRating');
    if (filterRatingSelect) filterRatingSelect.innerHTML = RATING_CONFIG.getFilterOptionsHtml();

    const customerTypeSelect = document.getElementById('customerType');
    if (customerTypeSelect) customerTypeSelect.innerHTML = CUSTOMER_TYPE_CONFIG.getOptionsHtml();
}

// ==================== EMAIL TO CUSTOMER (WELCOME) ====================

async function sendCustomerEmail(customerData, isNew = true) {
    const emailParams = {
        to_email:          customerData.email,
        email:             customerData.email,
        to_name:           customerData.name,
        company_name:      customerData.company,
        customer_type:     CUSTOMER_TYPE_CONFIG.getLabel(customerData.type),
        customer_code:     customerData.customerCode || 'Not assigned',
        registration_date: formatDisplayDate(customerData.dateAdded),
        message:           isNew
                            ? 'Welcome to Grafix Print Hub!'
                            : 'Your profile has been updated successfully.',
        action_type:       isNew ? 'Registration' : 'Profile Update',
        portal_link:       window.location.href
    };

    try {
        await emailjs.send('service_xl37j5s', 'template_ovx89ee', emailParams);
        console.log('Welcome email sent to:', customerData.email);
        return true;
    } catch (error) {
        console.error('Email failed:', error);
        return false;
    }
}

// ==================== SPECIAL NOTICE TO CUSTOMERS (REUSING FEEDBACK TEMPLATE) ====================

async function sendNoticeToCustomers(noticeData, customerList) {
    let successCount = 0;
    let failCount = 0;
    
    for (const customer of customerList) {
        const emailParams = {
            to_email: customer.email,
            from_name: customer.name,
            from_email: 'admin@grafixprint.com',
            rating: noticeData.title,      // Just the title text
            message: noticeData.message,    // Just the message text
            customer_code: customer.customerCode || 'Not assigned',
            feedback_date: new Date().toLocaleString()
        };

        try {
            await emailjs.send('service_xl37j5s', 'template_r5j64pq', emailParams);
            successCount++;
            console.log('Notice sent to:', customer.email);
        } catch (error) {
            failCount++;
            console.error('Failed to send to:', customer.email, error);
        }
    }
    
    return { success: successCount, fail: failCount };
}


function openSpecialNoticeModal() {
    // Clear form
    const titleInput = document.getElementById('noticeTitle');
    const messageInput = document.getElementById('noticeMessage');
    const recipientSelect = document.getElementById('noticeRecipient');
    
    if (titleInput) titleInput.value = '';
    if (messageInput) messageInput.value = '';
    if (recipientSelect) recipientSelect.value = 'all';
    
    new bootstrap.Modal(document.getElementById('specialNoticeModal')).show();
}

async function sendSpecialNotice() {
    const title = document.getElementById('noticeTitle').value.trim();
    const message = document.getElementById('noticeMessage').value.trim();
    const recipient = document.getElementById('noticeRecipient').value;
    
    // Validation
    if (!title) {
        showToast('Please enter a notice title!', 'danger');
        return;
    }
    if (!message) {
        showToast('Please enter your notice message!', 'danger');
        return;
    }
    
    // Filter customers based on recipient selection
    let targetCustomers = [];
    
    switch(recipient) {
        case 'vip':
            targetCustomers = customers.filter(c => c.type === 'VIP');
            break;
        case 'corporate':
            targetCustomers = customers.filter(c => c.type === 'Corporate');
            break;
        case 'regular':
            targetCustomers = customers.filter(c => c.type === 'Regular');
            break;
        case 'new':
            targetCustomers = customers.filter(c => c.type === 'New');
            break;
        default:
            targetCustomers = [...customers];
    }
    
    if (targetCustomers.length === 0) {
        showToast('No customers found for the selected category!', 'danger');
        return;
    }
    
    const sendBtn = document.getElementById('sendNoticeBtn');
    const originalText = sendBtn.innerHTML;
    sendBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Sending to ' + targetCustomers.length + ' customers...';
    sendBtn.disabled = true;
    
    try {
        const result = await sendNoticeToCustomers({
            title: title,
            message: message
        }, targetCustomers);
        
        showToast(`✅ Notice sent! Sent: ${result.success} | Failed: ${result.fail}`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('specialNoticeModal')).hide();
        
        // Clear form
        document.getElementById('noticeTitle').value = '';
        document.getElementById('noticeMessage').value = '';
        
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to send notices. Please try again.', 'danger');
    } finally {
        sendBtn.innerHTML = originalText;
        sendBtn.disabled = false;
    }
}

function setupNoticeButton() {
    const sendNoticeBtn = document.getElementById('sendNoticeBtn');
    if (sendNoticeBtn) {
        sendNoticeBtn.addEventListener('click', sendSpecialNotice);
    }
}

// ==================== FIRESTORE ====================

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
    const totalCustomersEl = document.getElementById('totalCustomers');
    const newFeedbacksEl   = document.getElementById('newFeedbacks');
    if (totalCustomersEl) totalCustomersEl.innerText = customers.length;
    if (newFeedbacksEl) {
        const maxRating = Math.max(...RATING_CONFIG.levels.map(l => l.value));
        const count = customers.filter(c => RATING_CONFIG.getRatingValue(c.feedback) === maxRating).length;
        newFeedbacksEl.innerText = count;
    }
}

// ==================== SAVE CUSTOMER ====================

async function saveCustomer() {
    const id          = document.getElementById('customerId').value;
    const name        = document.getElementById('customerName').value.trim();
    const company     = document.getElementById('customerCompany').value.trim();
    const email       = document.getElementById('customerEmail').value.trim();
    const phone       = document.getElementById('customerPhone').value.trim();
    const address     = document.getElementById('customerAddress').value.trim();
    const orders      = parseInt(document.getElementById('customerOrders').value) || 0;
    const feedbackVal = document.getElementById('customerFeedback').value;
    const type        = document.getElementById('customerType').value;

    let isValid = true;
    
    if (!name) {
        showToast('Please enter customer name!', 'danger');
        isValid = false;
    }
    if (!company) {
        showToast('Please enter company name!', 'danger');
        isValid = false;
    }
    if (!email) {
        showToast('Please enter email address!', 'danger');
        isValid = false;
    }
    if (!phone) {
        showToast('Please enter phone number!', 'danger');
        isValid = false;
    }
    
    if (!isValid) return;
    
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address!', 'danger');
        return;
    }
    
    if (!validatePhone(phone)) {
        showToast('Please enter a valid phone number (10 digits for Sri Lanka)!', 'danger');
        return;
    }
    
    if (orders < 0) {
        showToast('Orders cannot be negative!', 'danger');
        return;
    }

    const data = {
        name, company, email, phone,
        address:   address || 'Not specified',
        orders, type,
        feedback:  feedbackVal,
        status:    'Active',
        dateAdded: getCurrentDate()
    };

    try {
        if (id) {
            await db.collection('customers').doc(id).update(data);
            showToast(`Customer "${name}" updated successfully!`, 'success');
        } else {
            const customerCode = await CUSTOMER_CODE_CONFIG.generateSequentialCode();
            data.customerCode = customerCode;
            
            await db.collection('customers').add(data);
            showToast(`Customer "${name}" added successfully! Code: ${customerCode}`, 'success');
            
            const emailSent = await sendCustomerEmail(data, true);
            if (emailSent) {
                showToast(`Welcome email sent to ${email}!`, 'success');
            } else {
                showToast('Customer saved, but email failed to send.', 'warning');
            }
        }
        bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
        resetModalForm();
        loadCustomersFromFirestore();
    } catch (error) {
        console.error('Save error:', error);
        showToast('Error saving: ' + error.message, 'danger');
    }
}

// ==================== VIEW CUSTOMER ====================

function viewCustomer(id) {
    const c = customers.find(c => c.id === id);
    if (!c) return;

    const statusColor    = c.status === 'Inactive' ? '#dc3545' : '#198754';
    const ratingValue    = RATING_CONFIG.getRatingValue(c.feedback);
    const starsHtml      = RATING_CONFIG.getStarHtml(ratingValue);
    const typeLabel      = CUSTOMER_TYPE_CONFIG.getLabel(c.type);
    const typeBadgeClass = CUSTOMER_TYPE_CONFIG.getBadgeClass(c.type);
    const customerCode   = CUSTOMER_CODE_CONFIG.formatDisplay(c.customerCode);

    document.getElementById('viewCustomerDetails').innerHTML =
        '<div class="text-center mb-3">' +
        '<span class="customer-avatar" style="width:60px;height:60px;font-size:24px;line-height:60px;">' + getAvatar(c.name) + '</span>' +
        '<h5 class="mt-2">' + escapeHtml(c.name) + '</h5>' +
        '<div class="mt-2">' +
        '<span class="badge bg-dark me-1" style="font-family: monospace; font-size: 12px;">' + customerCode + '</span>' +
        '<span class="badge ' + typeBadgeClass + ' me-1">' + typeLabel + '</span>' +
        '<span class="badge" style="background:' + statusColor + ';">' + (c.status || 'Active') + '</span>' +
        '</div>' +
        '</div><hr>' +
        '<div class="row">' +
        '<div class="col-6"><small>Company</small><p class="fw-bold">' + escapeHtml(c.company) + '</p></div>' +
        '<div class="col-6"><small>Email</small><p class="fw-bold">' + escapeHtml(c.email) + '</p></div>' +
        '<div class="col-6"><small>Phone</small><p class="fw-bold">' + escapeHtml(c.phone) + '</p></div>' +
        '<div class="col-6"><small>Address</small><p class="fw-bold">' + (escapeHtml(c.address) || 'Not specified') + '</p></div>' +
        '<div class="col-6"><small>Total Orders</small><p class="fw-bold">' + (c.orders || 0) + '</p></div>' +
        '<div class="col-6"><small>Feedback</small><p class="fw-bold">' + starsHtml + ' (' + ratingValue + '/5)</p></div>' +
        '<div class="col-12"><small>Customer Since</small><p class="fw-bold">' + formatDisplayDate(c.dateAdded) + '</p></div>' +
        '</div>';

    new bootstrap.Modal(document.getElementById('viewCustomerModal')).show();
}

// ==================== EDIT / DELETE ====================

function openEditModal(id) {
    const c = customers.find(c => c.id === id);
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
    ['customerId', 'customerName', 'customerCompany', 'customerEmail', 'customerPhone', 'customerAddress'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.value = '';
            el.classList.remove('is-invalid-custom');
        }
    });
    document.getElementById('customerOrders').value   = '0';
    document.getElementById('customerFeedback').value = '5 ★';
    document.getElementById('customerType').value     = 'Regular';
    
    document.querySelectorAll('.invalid-feedback-custom').forEach(el => el.remove());
}

async function toggleCustomerStatus(id, currentStatus) {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
        await db.collection('customers').doc(id).update({ status: newStatus });
        showToast('Status changed to ' + newStatus, 'success');
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error: ' + error.message, 'danger');
    }
}

// ==================== FILTER & TABLE ====================

function filterCustomers() {
    const searchTerm = currentFilter.search.toLowerCase();
    return customers.filter(c => {
        const matchSearch = !searchTerm ||
            (c.name    && c.name.toLowerCase().includes(searchTerm)) ||
            (c.email   && c.email.toLowerCase().includes(searchTerm)) ||
            (c.company && c.company.toLowerCase().includes(searchTerm)) ||
            (c.phone   && c.phone.includes(searchTerm)) ||
            (c.customerCode && c.customerCode.toLowerCase().includes(searchTerm));
        
        const matchType   = !currentFilter.type   || c.type   === currentFilter.type;
        const matchStatus = !currentFilter.status || c.status === currentFilter.status;
        let matchRating   = true;
        if (currentFilter.rating) {
            matchRating = RATING_CONFIG.getRatingValue(c.feedback) === parseInt(currentFilter.rating);
        }
        return matchSearch && matchType && matchStatus && matchRating;
    });
}

function applyFilters() {
    currentFilter.search = document.getElementById('customerSearch')?.value || '';
    currentFilter.type   = document.getElementById('filterType')?.value    || '';
    currentFilter.rating = document.getElementById('filterRating')?.value  || '';
    currentFilter.status = document.getElementById('filterStatus')?.value  || '';
    renderFilteredCustomersTable();
}

function resetFilters() {
    currentFilter = { search: '', type: '', rating: '', status: '' };
    ['customerSearch', 'filterType', 'filterRating', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    renderFilteredCustomersTable();
}

function renderFilteredCustomersTable() {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    const list = filterCustomers();
    if (list.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="10" class="text-center text-muted py-4">No customers found.</td></tr>';
        return;
    }
    tableBody.innerHTML = '';
    list.forEach(c => {
        const ratingValue      = RATING_CONFIG.getRatingValue(c.feedback);
        const starsHtml        = RATING_CONFIG.getStarHtml(ratingValue);
        const typeLabel        = CUSTOMER_TYPE_CONFIG.getLabel(c.type);
        const statusBadgeClass = STATUS_CONFIG.getBadgeClass(c.status);
        const customerCode     = CUSTOMER_CODE_CONFIG.formatDisplay(c.customerCode);
        
        const row = document.createElement('tr');
        row.innerHTML =
            '<td><div class="d-flex align-items-center"><span class="customer-avatar me-2">' + getAvatar(c.name) + '</span><div><div class="fw-bold">' + escapeHtml(c.name || '—') + '</div><small class="text-muted">' + escapeHtml(typeLabel) + '</small></div></div></td>' +
            '<td>' + escapeHtml(c.company || '—') + '</td>' +
            '<td>' + escapeHtml(c.email || '—') + '</td>' +
            '<td>' + escapeHtml(c.phone || '—') + '</td>' +
            '<td style="max-width:150px;white-space:normal;">' + escapeHtml(c.address || 'Not specified') + '</td>' +
            '<td class="text-center"><span class="badge bg-primary bg-opacity-10 text-primary">' + (c.orders || 0) + ' orders</span></td>' +
            '<td class="text-center"><span class="feedback-badge">' + starsHtml + '</span></td>' +
            '<td class="text-center"><span class="badge ' + statusBadgeClass + ' status-badge" onclick="toggleCustomerStatus(\'' + c.id + '\',\'' + (c.status || 'Active') + '\')">' + (c.status || 'Active') + '</span></td>' +
            '<td class="text-center"><span class="badge bg-dark" style="font-family: monospace; font-size: 11px;">' + customerCode + '</span></td>' +
            '<td class="text-center"><div class="action-icons d-flex justify-content-center gap-2">' +
            '<i class="bi bi-eye action-icon icon-view" onclick="viewCustomer(\'' + c.id + '\')" title="View"></i>' +
            '<i class="bi bi-pencil action-icon icon-edit" onclick="openEditModal(\'' + c.id + '\')" title="Edit"></i>' +
            '<i class="bi bi-trash action-icon icon-delete" onclick="openDeleteModal(\'' + c.id + '\',\'' + escapeHtml(c.name) + '\')" title="Delete"></i>' +
            '</div></td>';
        tableBody.appendChild(row);
    });
}

// ==================== FEEDBACKS PAGE ====================

function loadFeedbacks() {
    const container = document.getElementById('feedbacksContainer');
    if (!container) return;
    const list = customers.filter(c => c.feedback);
    if (list.length === 0) {
        container.innerHTML = '<div class="text-center text-muted py-5"><i class="bi bi-chat-square-text fs-1"></i><p class="mt-2">No feedback available yet.</p></div>';
        return;
    }
    container.innerHTML = '';
    list.forEach(c => {
        const ratingValue = RATING_CONFIG.getRatingValue(c.feedback);
        const starsHtml   = RATING_CONFIG.getStarHtml(ratingValue);
        const typeLabel   = CUSTOMER_TYPE_CONFIG.getLabel(c.type);

        let cardClass = 'feedback-card';
        if      (c.type === 'VIP')       cardClass += ' vip-card';
        else if (c.type === 'Corporate') cardClass += ' corporate-card';
        else if (c.type === 'New')       cardClass += ' new-card';
        else                             cardClass += ' regular-card';

        const card = document.createElement('div');
        card.className = cardClass;
        card.innerHTML =
            '<div class="d-flex justify-content-between align-items-start mb-3">' +
            '<div class="d-flex align-items-center"><span class="customer-avatar me-3">' + getAvatar(c.name) + '</span>' +
            '<div><h6 class="fw-bold mb-0">' + escapeHtml(c.name) + '</h6>' +
            '<small class="text-muted"><i class="bi bi-building"></i> ' + escapeHtml(c.company) + '</small></div></div>' +
            '<div class="feedback-stars">' + starsHtml + '</div></div>' +
            '<div class="row">' +
            '<div class="col-md-6">' +
            '<div class="info-item"><i class="bi bi-envelope"></i><span><strong>Email:</strong> ' + escapeHtml(c.email) + '</span></div>' +
            '<div class="info-item"><i class="bi bi-telephone"></i><span><strong>Phone:</strong> ' + escapeHtml(c.phone) + '</span></div>' +
            '</div>' +
            '<div class="col-md-6">' +
            '<div class="info-item"><i class="bi bi-geo-alt"></i><span><strong>Address:</strong> ' + escapeHtml(c.address || 'Not specified') + '</span></div>' +
            '<div class="info-item"><i class="bi bi-bag-check"></i><span><strong>Orders:</strong> ' + (c.orders || 0) + '</span></div>' +
            '</div></div>' +
            '<div class="info-row"><div class="d-flex justify-content-between">' +
            '<small class="text-muted"><i class="bi bi-calendar"></i> Since: ' + formatDisplayDate(c.dateAdded) + '</small>' +
            '<span class="badge bg-secondary">' + escapeHtml(typeLabel) + '</span>' +
            '</div></div>';
        container.appendChild(card);
    });
}

// ==================== PAGE NAVIGATION ====================

function showPage(pageName) {
    document.querySelectorAll('.page-container').forEach(p => p.classList.remove('active-page'));
    const dashboard = document.getElementById('mainDashboard');
    if (pageName === 'home') {
        if (dashboard) dashboard.style.display = 'block';
    } else {
        if (dashboard) dashboard.style.display = 'none';
        const page = document.getElementById(pageName + 'Page');
        if (page) page.classList.add('active-page');
        if (pageName === 'feedbacks') loadFeedbacks();
        if (pageName === 'profiles')  renderFilteredCustomersTable();
    }
}

function openAddCustomerModal() {
    resetModalForm();
    new bootstrap.Modal(document.getElementById('addCustomerModal')).show();
}

// ==================== REPORT FUNCTIONS ====================

function selectReportType(type) {
    selectedReportType = type;
    ['reportTypeAll', 'reportTypeFeedback', 'reportTypeIndividual'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('selected');
    });
    const map = { all: 'reportTypeAll', feedback: 'reportTypeFeedback', individual: 'reportTypeIndividual' };
    const el  = document.getElementById(map[type]);
    if (el) el.classList.add('selected');
    const section = document.getElementById('customerSelectSection');
    if (section) section.style.display = type === 'individual' ? 'block' : 'none';
    if (type === 'individual') populateCustomerDropdown();
}

function populateCustomerDropdown() {
    const select = document.getElementById('individualCustomerSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- Select a customer --</option>';
    customers.forEach(c => {
        const code = c.customerCode ? ` [${c.customerCode}]` : '';
        select.innerHTML += `<option value="${c.id}">${escapeHtml(c.name)} (${escapeHtml(c.company)})${code}</option>`;
    });
}

function closePreview() {
    const preview = document.getElementById('reportPreviewContainer');
    if (preview) preview.style.display = 'none';
}

function generateSelectedReport() {
    const fromDate = document.getElementById('fromDate')?.value || '';
    const toDate   = document.getElementById('toDate')?.value   || '';
    if (selectedReportType === 'all') {
        generateAllCustomersReport(fromDate, toDate);
    } else if (selectedReportType === 'feedback') {
        generateFeedbackReport(fromDate, toDate);
    } else if (selectedReportType === 'individual') {
        const select = document.getElementById('individualCustomerSelect');
        if (!select || !select.value) { showToast('Please select a customer!', 'danger'); return; }
        const customer = customers.find(c => c.id === select.value);
        if (!customer) { showToast('Customer not found!', 'danger'); return; }
        generateIndividualReport(customer, fromDate, toDate);
    }
}

function fmtDate(d) {
    if (!d) return 'All Time';
    return formatDisplayDate(d);
}

function filterByDates(list, fromDate, toDate) {
    return list.filter(c => {
        if (fromDate && c.dateAdded < fromDate) return false;
        if (toDate   && c.dateAdded > toDate)   return false;
        return true;
    });
}

function drawReportHeader(doc, subtitle, fromDate, toDate) {
    var pageWidth = doc.internal.pageSize.width;
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('GRAFIX PRINT HUB', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(subtitle, 14, 30);
    doc.setFontSize(8);
    doc.setTextColor(192, 192, 192);
    doc.text('TIME PERIOD: ' + fmtDate(fromDate) + ' TO ' + fmtDate(toDate), pageWidth - 14, 20, { align: 'right' });
    doc.text('GENERATED: ' + new Date().toLocaleString(navigator.language || 'en-US'), pageWidth - 14, 28, { align: 'right' });
    doc.setTextColor(0, 0, 0);
}

function getRatingText(rating) {
    return rating + ' Stars - ' + RATING_CONFIG.getRatingLabel(rating);
}

// ==================== REPORT FUNCTIONS (YOUR EXISTING IMPLEMENTATIONS) ====================
// ==================== ALL CUSTOMERS REPORT ====================

function generateAllCustomersReport(fromDate, toDate) {
    var list = filterByDates(customers.slice(), fromDate, toDate);
    if (list.length === 0) { showToast('No customers found for this period!', 'danger'); return; }

    var totalOrders = list.reduce(function(s,c){ return s+(c.orders||0); }, 0);
    var avgOrders   = (totalOrders / list.length).toFixed(1);
    var avgRating   = (list.reduce(function(s,c){ return s + RATING_CONFIG.getRatingValue(c.feedback); }, 0) / list.length).toFixed(1);
    var vip  = list.filter(function(c){ return c.type==='VIP'; }).length;
    var corp = list.filter(function(c){ return c.type==='Corporate'; }).length;
    var reg  = list.filter(function(c){ return c.type==='Regular'||!c.type; }).length;
    var newC = list.filter(function(c){ return c.type==='New'; }).length;
    var s5   = list.filter(function(c){ return RATING_CONFIG.getRatingValue(c.feedback) === 5; }).length;
    var s4   = list.filter(function(c){ return RATING_CONFIG.getRatingValue(c.feedback) === 4; }).length;
    var s3   = list.filter(function(c){ return RATING_CONFIG.getRatingValue(c.feedback) === 3; }).length;
    var pct  = function(n){ return ((n/list.length)*100).toFixed(1); };

    var doc = new window.jspdf.jsPDF();
    var pageWidth = doc.internal.pageSize.width;

    // Pie Chart
    var canvas = document.createElement('canvas');
    canvas.width = 400; canvas.height = 400;
    var ctx = canvas.getContext('2d');
    var pieData   = [vip, corp, reg, newC];
    var pieLabels = ['VIP', 'Corporate', 'Regular', 'New'];
    var pieColors = ['#ffc107', '#0dcaf0', '#6c757d', '#198754'];
    var total     = vip + corp + reg + newC;
    if (total > 0) {
        var startAngle = -Math.PI / 2;
        for (var i = 0; i < pieData.length; i++) {
            var angle    = (pieData[i] / total) * Math.PI * 2;
            var endAngle = startAngle + angle;
            ctx.beginPath();
            ctx.fillStyle = pieColors[i];
            ctx.moveTo(200, 200);
            ctx.arc(200, 200, 150, startAngle, endAngle);
            ctx.fill();
            startAngle = endAngle;
        }
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        startAngle = -Math.PI / 2;
        for (var i = 0; i < pieData.length; i++) {
            if (pieData[i] > 0) {
                var midAngle = -Math.PI / 2 + (pieData.slice(0, i).reduce(function(a,b){ return a+b; }, 0) + pieData[i]/2) / total * Math.PI * 2;
                ctx.fillStyle = '#fff';
                ctx.fillText(pieLabels[i] + ' (' + ((pieData[i]/total)*100).toFixed(1) + '%)', 200 + Math.cos(midAngle)*100, 200 + Math.sin(midAngle)*100);
            }
        }
    }

    drawReportHeader(doc, 'SYSTEM GENERATED CUSTOMER ANALYSIS', fromDate, toDate);

    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('Business Performance Summary', 14, 58);
    doc.setFont(undefined, 'normal');

    var boxes = [
        { label: 'Total Customers', value: String(list.length),  x: 14,  color: [94,96,206]  },
        { label: 'Total Orders',    value: String(totalOrders),  x: 62,  color: [231,111,81] },
        { label: 'Avg Orders/Cust', value: String(avgOrders),    x: 110, color: [69,123,157] },
        { label: 'Avg Rating',      value: avgRating + ' Stars', x: 158, color: [42,157,143] }
    ];
    boxes.forEach(function(b) {
        doc.setFillColor(b.color[0], b.color[1], b.color[2]);
        doc.roundedRect(b.x, 63, 44, 22, 3, 3, 'F');
        doc.setTextColor(255,255,255);
        doc.setFontSize(14); doc.setFont(undefined, 'bold');
        doc.text(b.value, b.x + 22, 72, { align: 'center' });
        doc.setFontSize(7); doc.setFont(undefined, 'normal');
        doc.text(b.label, b.x + 22, 80, { align: 'center' });
    });
    doc.setTextColor(0,0,0);

    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 14, 95, 80, 80);
    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Customer Distribution', 100, 105);
    doc.setFont(undefined, 'normal'); doc.setFontSize(8);
    var distData = [['VIP',vip,pct(vip)+'%'],['Corporate',corp,pct(corp)+'%'],['Regular',reg,pct(reg)+'%'],['New',newC,pct(newC)+'%']];
    for (var i = 0; i < distData.length; i++) {
        doc.text(distData[i][0] + ': ' + distData[i][1] + ' (' + distData[i][2] + ')', 100, 112 + (i * 6));
    }

    var feedY = 190;
    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('Feedback Rating Distribution', 14, feedY);
    doc.setFont(undefined, 'normal');
    var ratingBoxes = [
        { label: '5 Stars', value: s5, x: 14,  bg: [255,243,205], fg: [133,100,4] },
        { label: '4 Stars', value: s4, x: 76,  bg: [209,236,241], fg: [12,84,96]  },
        { label: '3 Stars', value: s3, x: 138, bg: [226,227,229], fg: [56,61,65]  }
    ];
    ratingBoxes.forEach(function(b) {
        doc.setFillColor(b.bg[0], b.bg[1], b.bg[2]);
        doc.roundedRect(b.x, feedY+5, 56, 22, 3, 3, 'F');
        doc.setTextColor(b.fg[0], b.fg[1], b.fg[2]);
        doc.setFontSize(16); doc.setFont(undefined, 'bold');
        doc.text(String(b.value), b.x+28, feedY+15, { align: 'center' });
        doc.setFontSize(8); doc.setFont(undefined, 'normal');
        doc.text(b.label, b.x+28, feedY+22, { align: 'center' });
    });
    doc.setTextColor(0,0,0);

    var tableY = feedY + 40;
    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('Customer List', 14, tableY);
    doc.setFont(undefined, 'normal');

    doc.autoTable({
        head: [['Customer Code', 'Name', 'Company', 'Email', 'Phone', 'Orders', 'Rating', 'Type', 'Status']],
        body: list.map(function(c) {
            return [c.customerCode || 'N/A', c.name, c.company, c.email, c.phone, c.orders||0, getRatingText(RATING_CONFIG.getRatingValue(c.feedback)), c.type||'Regular', c.status||'Active'];
        }),
        startY: tableY + 5,
        theme: 'striped',
        headStyles: { fillColor: [26,26,46] },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text('Grafix Print Hub | CRM Report | Page ' + i + ' of ' + pageCount, pageWidth/2, 287, { align: 'center' });
    }

    doc.save('CRM_All_Customers_' + new Date().getTime() + '.pdf');
    showToast('Report downloaded successfully!', 'success');
}

// ==================== FEEDBACK REPORT ====================

function generateFeedbackReport(fromDate, toDate) {
    var list = filterByDates(customers.slice(), fromDate, toDate).filter(function(c){ return c.feedback; });
    if (list.length === 0) { showToast('No feedback found for this period!', 'danger'); return; }

    var avg = (list.reduce(function(s,c){ return s + RATING_CONFIG.getRatingValue(c.feedback); }, 0) / list.length).toFixed(1);
    var s5  = list.filter(function(c){ return RATING_CONFIG.getRatingValue(c.feedback) === 5; }).length;
    var s4  = list.filter(function(c){ return RATING_CONFIG.getRatingValue(c.feedback) === 4; }).length;
    var s3  = list.filter(function(c){ return RATING_CONFIG.getRatingValue(c.feedback) === 3; }).length;
    var s2  = list.filter(function(c){ return RATING_CONFIG.getRatingValue(c.feedback) === 2; }).length;
    var s1  = list.filter(function(c){ return RATING_CONFIG.getRatingValue(c.feedback) === 1; }).length;

    var doc = new window.jspdf.jsPDF();
    var pageWidth = doc.internal.pageSize.width;

    // Bar Chart
    var canvas = document.createElement('canvas');
    canvas.width = 500; canvas.height = 300;
    var ctx = canvas.getContext('2d');
    var barLabels = ['5 Stars','4 Stars','3 Stars','2 Stars','1 Star'];
    var barData   = [s5, s4, s3, s2, s1];
    var barColors = ['#ffc107','#0dcaf0','#6c757d','#fd7e14','#dc3545'];
    var maxValue  = Math.max.apply(null, barData);
    ctx.fillStyle = '#f8f9fa'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < barData.length; i++) {
        var barHeight = (barData[i] / (maxValue || 1)) * 180;
        var bx = 80 + (i * 75);
        ctx.fillStyle = barColors[i];
        ctx.fillRect(bx, 250 - barHeight, 60, barHeight);
        ctx.fillStyle = '#333'; ctx.font = '12px Arial'; ctx.textAlign = 'center';
        ctx.fillText(barLabels[i], bx + 30, 265);
        ctx.fillStyle = '#000'; ctx.font = 'bold 14px Arial';
        ctx.fillText(barData[i], bx + 30, 250 - barHeight - 5);
    }
    ctx.fillStyle = '#333'; ctx.font = 'bold 14px Arial'; ctx.textAlign = 'center';
    ctx.fillText('Rating Distribution', canvas.width/2, 30);

    drawReportHeader(doc, 'FEEDBACK ANALYSIS REPORT', fromDate, toDate);

    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('Overview', 14, 58); doc.setFont(undefined, 'normal');

    doc.setFillColor(94, 96, 206); doc.roundedRect(14, 63, 85, 25, 3, 3, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(18); doc.setFont(undefined, 'bold');
    doc.text(String(list.length), 56, 74, { align: 'center' });
    doc.setFontSize(8); doc.setFont(undefined, 'normal');
    doc.text('Total Feedbacks', 56, 82, { align: 'center' });

    doc.setFillColor(231, 111, 81); doc.roundedRect(105, 63, 85, 25, 3, 3, 'F');
    doc.setFontSize(18); doc.setFont(undefined, 'bold');
    doc.text(avg + ' Stars', 147, 74, { align: 'center' });
    doc.setFontSize(8); doc.setFont(undefined, 'normal');
    doc.text('Average Rating', 147, 82, { align: 'center' });
    doc.setTextColor(0,0,0);

    doc.addImage(canvas.toDataURL('image/png'), 'PNG', 14, 95, 180, 80);

    var ratingY = 190;
    doc.setFontSize(11); doc.setFont(undefined, 'bold');
    doc.text('Rating Summary', 14, ratingY);
    doc.setFont(undefined, 'normal'); doc.setFontSize(9);
    doc.text('5 Stars: ' + s5 + ' (' + ((s5/list.length)*100).toFixed(1) + '%)', 14, ratingY+8);
    doc.text('4 Stars: ' + s4 + ' (' + ((s4/list.length)*100).toFixed(1) + '%)', 14, ratingY+14);
    doc.text('3 Stars: ' + s3 + ' (' + ((s3/list.length)*100).toFixed(1) + '%)', 14, ratingY+20);
    doc.text('2 Stars: ' + s2 + ' (' + ((s2/list.length)*100).toFixed(1) + '%)', 14, ratingY+26);
    doc.text('1 Star:  ' + s1 + ' (' + ((s1/list.length)*100).toFixed(1) + '%)', 14, ratingY+32);

    var tableY = 230;
    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('Customer Feedback Details', 14, tableY);
    doc.setFont(undefined, 'normal');

    doc.autoTable({
        head: [['Customer Code', 'Customer', 'Company', 'Rating', 'Orders', 'Type', 'Since']],
        body: list.map(function(c) {
            return [c.customerCode || 'N/A', c.name, c.company, getRatingText(RATING_CONFIG.getRatingValue(c.feedback)), c.orders||0, c.type||'Regular', formatDisplayDate(c.dateAdded)];
        }),
        startY: tableY + 5,
        theme: 'striped',
        headStyles: { fillColor: [26,26,46] },
        styles: { fontSize: 8, cellPadding: 3 }
    });

    var pageCount = doc.internal.getNumberOfPages();
    for (var i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8); doc.setTextColor(150);
        doc.text('Grafix Print Hub | Feedback Report | Page ' + i + ' of ' + pageCount, pageWidth/2, 287, { align: 'center' });
    }

    doc.save('CRM_Feedback_Report_' + new Date().getTime() + '.pdf');
    showToast('Report downloaded successfully!', 'success');
}

// ==================== INDIVIDUAL REPORT ====================

function generateIndividualReport(customer, fromDate, toDate) {
    var ratingValue = RATING_CONFIG.getRatingValue(customer.feedback);
    var starsStr    = ratingValue + ' out of 5 Stars';
    var ratingText  = getRatingText(ratingValue);
    var customerCode = customer.customerCode || 'Not assigned';

    var doc = new window.jspdf.jsPDF();
    var pageWidth = doc.internal.pageSize.width;

    drawReportHeader(doc, 'CUSTOMER PROFILE REPORT', fromDate, toDate);

    doc.setFillColor(25, 93, 122);
    doc.circle(30, 65, 14, 'F');
    doc.setTextColor(255,255,255);
    doc.setFontSize(20); doc.setFont(undefined, 'bold');
    doc.text(getAvatar(customer.name), 30, 70, { align: 'center' });
    doc.setTextColor(0,0,0);

    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text(customer.name, 52, 58);
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.setTextColor(100,100,100);
    doc.text(customerCode, 52, 66);
    
    doc.setFontSize(10);
    doc.text(customer.company, 52, 74);

    var statusColor = customer.status === 'Inactive' ? [220,53,69] : [25,135,84];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(52, 79, 32, 8, 4, 4, 'F');
    doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont(undefined, 'bold');
    doc.text(customer.status||'Active', 68, 85, { align: 'center' });

    var typeColor     = customer.type === 'VIP' ? [255,193,7] : customer.type === 'Corporate' ? [13,202,240] : [108,117,125];
    var typeTextColor = customer.type === 'VIP' ? 0 : 255;
    doc.setFillColor(typeColor[0], typeColor[1], typeColor[2]);
    doc.roundedRect(90, 79, 32, 8, 4, 4, 'F');
    doc.setTextColor(typeTextColor, typeTextColor, typeTextColor);
    doc.text(customer.type||'Regular', 106, 85, { align: 'center' });
    doc.setTextColor(0,0,0);

    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('Contact Information', 14, 100);
    doc.setFont(undefined, 'normal');

    doc.autoTable({
        body: [
            ['Email',   customer.email,          'Phone', customer.phone],
            ['Address', customer.address||'N/A', 'Since', formatDisplayDate(customer.dateAdded)]
        ],
        startY: 105,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 4 },
        columnStyles: {
            0: { fontStyle: 'bold', fillColor: [240,240,240], cellWidth: 30 },
            1: { cellWidth: 70 },
            2: { fontStyle: 'bold', fillColor: [240,240,240], cellWidth: 30 },
            3: { cellWidth: 60 }
        }
    });

    var afterY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(13); doc.setFont(undefined, 'bold');
    doc.text('Performance Summary', 14, afterY);
    doc.setFont(undefined, 'normal');

    doc.setFillColor(232, 244, 255); doc.roundedRect(14, afterY+4, 85, 28, 3, 3, 'F');
    doc.setTextColor(13, 110, 253);
    doc.setFontSize(22); doc.setFont(undefined, 'bold');
    doc.text(String(customer.orders||0), 56, afterY+17, { align: 'center' });
    doc.setFontSize(9); doc.setFont(undefined, 'normal');
    doc.text('Total Orders', 56, afterY+26, { align: 'center' });

    doc.setFillColor(255, 249, 230); doc.roundedRect(105, afterY+4, 85, 28, 3, 3, 'F');
    doc.setTextColor(255, 193, 7);
    doc.setFontSize(16); doc.setFont(undefined, 'bold');
    doc.text(starsStr, 147, afterY+17, { align: 'center' });
    doc.setFontSize(9); doc.setTextColor(100,100,100); doc.setFont(undefined, 'normal');
    doc.text('Feedback Rating - ' + ratingText, 147, afterY+26, { align: 'center' });
    doc.setTextColor(0,0,0);

    doc.setFontSize(8); doc.setTextColor(150);
    doc.text('Grafix Print Hub | CRM Customer Profile | Confidential', pageWidth/2, 287, { align: 'center' });

    doc.save('CRM_' + customer.name.replace(/\s/g,'_') + '_' + new Date().getTime() + '.pdf');
    showToast('Report downloaded successfully!', 'success');
}

// ==================== HELPER FUNCTIONS ====================

function getStarsFromFeedback(feedback) {
    return RATING_CONFIG.getRatingValue(feedback) + ' Stars';
}

function getAvatar(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function escapeHtml(str) {
    if (!str) return str;
    return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const msg   = document.getElementById('toastMessage');
    if (!toast || !msg) return;
    msg.innerText = message;
    toast.className = `toast bg-${type} text-white`;
    new bootstrap.Toast(toast).show();
}

function setupEventListeners() {
    const saveBtn     = document.getElementById('saveCustomerBtn');
    const confirmBtn  = document.getElementById('confirmDeleteBtn');
    const addModal    = document.getElementById('addCustomerModal');
    const phoneInput  = document.getElementById('customerPhone');
    const emailInput  = document.getElementById('customerEmail');
    const ordersInput = document.getElementById('customerOrders');

    if (saveBtn)    saveBtn.addEventListener('click', saveCustomer);
    if (confirmBtn) confirmBtn.addEventListener('click', deleteCustomer);
    if (addModal)   addModal.addEventListener('hidden.bs.modal', resetModalForm);

    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            validatePhoneField();
        });
        phoneInput.addEventListener('blur', function() {
            if (phoneInput.value.trim() !== '') {
                validatePhoneField();
            }
        });
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            validateEmailField();
        });
        emailInput.addEventListener('blur', function() {
            if (emailInput.value.trim() !== '') {
                validateEmailField();
            }
        });
    }
    
    if (ordersInput) {
        ordersInput.addEventListener('input', function() {
            validateOrdersField();
        });
        ordersInput.addEventListener('blur', function() {
            validateOrdersField();
        });
    }
}

// ==================== WINDOW EXPORTS ====================

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
window.openSpecialNoticeModal = openSpecialNoticeModal;
window.sendSpecialNotice      = sendSpecialNotice;