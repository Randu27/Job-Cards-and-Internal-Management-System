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

// LOAD FROM FIRESTORE (READ Operation)
function loadCustomersFromFirestore() {
    db.collection('customers').orderBy('dateAdded', 'desc').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        updateStats();
        renderCustomersTable();
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

// RENDER TABLE
function renderCustomersTable() {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted py-4">
                    <i class="bi bi-inbox fs-1 d-block mb-2"></i>
                    No customers found. Click "ADD CUSTOMER" to add one.
                </td>
            </tr>
        `;
        return;
    }
    
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="customer-avatar me-2">${getAvatar(c.name)}</div>
                    <div>
                        <div class="fw-bold">${c.name}</div>
                        <small class="text-muted">${c.type || 'Regular'}</small>
                    </div>
                </div>
            </td>
            <td>${c.company}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td><span class="badge bg-primary bg-opacity-10 text-primary">${c.orders || 0} orders</span></td>
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td>
            <td>
                <button class="btn btn-sm btn-outline-primary edit-customer me-1" data-id="${c.id}" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger delete-customer" data-id="${c.id}" data-name="${c.name}" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Attach edit events
    document.querySelectorAll('.edit-customer').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-id')));
    });
    
    // Attach delete events
    document.querySelectorAll('.delete-customer').forEach(btn => {
        btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-id'), btn.getAttribute('data-name')));
    });
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
        addModal.addEventListener('show.bs.modal', resetModalForm);
    }
}

// CREATE Operation
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
        loadCustomersFromFirestore();

    } catch (error) {
        showToast('Error saving customer: ' + error.message, 'danger');
    }
}

// READ Operation (View) - already handled by table display

// UPDATE Operation Helper
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

// DELETE Operation Helper
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

function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.innerText = message;
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}