// Customer data array (synced with Firestore)
let customers = [];
let currentDeleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    setupEventListeners();
});

function initializePage() {
    loadCustomersFromFirestore();
}

// LOAD FROM FIRESTORE
function loadCustomersFromFirestore() {
    db.collection('customers').orderBy('dateAdded', 'desc').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        updateAll();
    }).catch((error) => {
        console.error('Error loading customers:', error);
        showToast('Error loading customers: ' + error.message);
    });
}

// UPDATE ALL UI
function updateAll() {
    updateStats();
    updateFunctionCards();
    renderRecentCustomersTable();
    renderAllCustomersTable();
    renderFeedbackTable();
    
    // Update heatmap number
    document.getElementById('totalHeatmap').innerText = customers.length;
}

function updateStats() {
    const totalCustomers = customers.length;
    const newFeedbacks = customers.filter(c => c.feedback && c.feedback.includes('5')).length;
    const avgRating = calculateAverageRating();
    
    document.getElementById('totalCustomers').innerText = totalCustomers;
    document.getElementById('newFeedbacks').innerText = newFeedbacks;
    document.getElementById('avgRatingValue').innerText = avgRating;
}

function calculateAverageRating() {
    if (customers.length === 0) return '0.0';
    let total = 0;
    customers.forEach(c => {
        if (c.feedback) {
            const rating = parseInt(c.feedback.charAt(0));
            total += rating;
        }
    });
    return (total / customers.length).toFixed(1);
}

function updateFunctionCards() {
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => c.type === 'New').length;
    const feedbacks = customers.filter(c => c.feedback).length;
    const avgRating = calculateAverageRating();
    
    document.getElementById('profileCountBadge').innerText = totalCustomers + ' Profiles';
    document.getElementById('profileCount').innerText = totalCustomers;
    document.getElementById('feedbackCountBadge').innerText = feedbacks + ' Feedbacks';
    document.getElementById('feedbackCount').innerText = feedbacks;
    document.getElementById('avgRating').innerHTML = avgRating + ' ★ avg';
}

function renderRecentCustomersTable() {
    const tableBody = document.getElementById('recentCustomersTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    const recentCustomers = customers.slice(0, 5);
    
    if (recentCustomers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No customers found</td></tr>';
        return;
    }
    
    recentCustomers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="customer-avatar">${getAvatar(c.name)}</div>
                    <div>
                        <div class="fw-semibold">${c.name}</div>
                        <small class="text-muted">${c.type || 'Regular'}</small>
                    </div>
                </div>
            </td>
            <td>${c.company}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td><span class="badge bg-secondary bg-opacity-10 text-secondary">${c.orders || 0}</span></td>
            <td><span class="rating-badge"><i class="bi bi-star-fill"></i> ${c.feedback || '5 ★'}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function renderAllCustomersTable() {
    const tableBody = document.getElementById('allCustomersTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No customers found</td></tr>';
        return;
    }
    
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="customer-avatar">${getAvatar(c.name)}</div>
                    <div class="fw-semibold">${c.name}</div>
                </div>
            </td>
            <td>${c.company}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>${c.orders || 0}</td>
            <td><span class="rating-badge"><i class="bi bi-star-fill"></i> ${c.feedback || '5 ★'}</span></td>
            <td>
                <button class="action-btn view" onclick="viewCustomer('${c.id}')" title="View"><i class="bi bi-eye"></i></button>
                <button class="action-btn edit" onclick="openEditModal('${c.id}')" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="action-btn delete" onclick="openDeleteModal('${c.id}', '${c.name}')" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function renderFeedbackTable() {
    const tableBody = document.getElementById('feedbackTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No feedback data available</td></tr>';
        return;
    }
    
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center gap-2">
                    <div class="customer-avatar">${getAvatar(c.name)}</div>
                    <div class="fw-semibold">${c.name}</div>
                </div>
            </td>
            <td>${c.company}</td>
            <td><span class="rating-badge"><i class="bi bi-star-fill"></i> ${c.feedback || '5 ★'}</span></td>
            <td>${c.orders || 0}</td>
            <td><span class="badge bg-light text-dark">${c.type || 'Regular'}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function getAvatar(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function setupEventListeners() {
    const saveBtn = document.getElementById('saveCustomerBtn');
    if (saveBtn) saveBtn.addEventListener('click', saveCustomer);
    
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', deleteCustomer);
    
    const addModal = document.getElementById('addCustomerModal');
    if (addModal) addModal.addEventListener('show.bs.modal', resetModalForm);
}

// CREATE & UPDATE
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
        showToast('Please fill all required fields!');
        return;
    }

    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address!');
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
            showToast(`Customer "${name}" updated successfully!`);
        } else {
            await db.collection('customers').add(customerData);
            showToast(`Customer "${name}" added successfully!`);
        }

        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();
        loadCustomersFromFirestore();

    } catch (error) {
        showToast('Error saving customer: ' + error.message);
    }
}

// VIEW
function viewCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    alert(`📋 CUSTOMER DETAILS\n\nName: ${customer.name}\nCompany: ${customer.company}\nEmail: ${customer.email}\nPhone: ${customer.phone}\nAddress: ${customer.address}\nType: ${customer.type}\nOrders: ${customer.orders}\nFeedback: ${customer.feedback}`);
}

// EDIT
function openEditModal(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    document.getElementById('addCustomerModalLabel').innerHTML = '<i class="bi bi-pencil-fill me-2"></i>Edit Customer';
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

// DELETE
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
        showToast('Customer deleted successfully!');
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('deleteModal'));
        modal.hide();
        loadCustomersFromFirestore();
    } catch (error) {
        showToast('Error deleting customer: ' + error.message);
    }
}

function resetModalForm() {
    document.getElementById('addCustomerModalLabel').innerHTML = '<i class="bi bi-person-plus-fill me-2"></i>Add New Customer';
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

function showToast(message) {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.innerText = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Reports
function generateReport(type) {
    const modal = bootstrap.Modal.getInstance(document.getElementById('reportsModal'));
    modal.hide();
    
    if (type === 'pdf') {
        showToast('PDF report generated! (Demo)');
    } else if (type === 'excel') {
        showToast('Excel report generated! (Demo)');
    }
}

// Make functions global
window.viewCustomer = viewCustomer;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.generateReport = generateReport;