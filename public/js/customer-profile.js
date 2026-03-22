// Wait for Firebase to load first
let db = null;
let customers = [];
let currentDeleteId = null;

// Wait for DOM and Firebase to be ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        document.getElementById('customersTableBody').innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Firebase not loaded. Please check your internet connection.<td></tr>';
        return;
    }
    
    // Check if Firestore is available
    if (!firebase.firestore) {
        document.getElementById('customersTableBody').innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Firestore not available. Please check your Firebase configuration.<td></tr>';
        return;
    }
    
    // Initialize Firestore
    db = firebase.firestore();
    
    // Check if db is ready
    if (!db) {
        document.getElementById('customersTableBody').innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Database connection failed. Please check your configuration.<td></tr>';
        return;
    }
    
    // Load customers
    loadCustomers();
    setupEventListeners();
});

function loadCustomers() {
    const tableBody = document.getElementById('customersTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><br>Loading customers...<td></tr>';
    
    db.collection('customers').orderBy('dateAdded', 'desc').get()
        .then((snapshot) => {
            customers = [];
            snapshot.forEach(doc => {
                customers.push({ id: doc.id, ...doc.data() });
            });
            renderCustomersTable();
        })
        .catch((error) => {
            console.error('Error loading customers:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error loading customers: ' + error.message + '<td></tr>';
        });
}

function renderCustomersTable() {
    const tableBody = document.getElementById('customersTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No customers found. Click "ADD CUSTOMER" to add one.<td></tr>';
        return;
    }
    
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="customer-avatar me-2">${getAvatar(c.name)}</div>
                    <div>
                        <div class="fw-bold">${c.name || '—'}</div>
                        <small class="text-muted">${c.type || 'Regular'}</small>
                    </div>
                </div>
            </td>
            <td>${c.company || '—'}</td>
            <td>${c.email || '—'}</td>
            <td>${c.phone || '—'}</td>
            <td><span class="badge bg-primary bg-opacity-10 text-primary">${c.orders || 0} orders</span></td>
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td>
            <td>
                <button class="btn btn-sm btn-info text-white view-customer me-1" data-id="${c.id}" style="background-color: #0dcaf0; border: none;">
                    <i class="bi bi-eye me-1"></i>View
                </button>
                <button class="btn btn-sm btn-warning edit-customer me-1" data-id="${c.id}" style="color: #000;">
                    <i class="bi bi-pencil me-1"></i>Edit
                </button>
                <button class="btn btn-sm btn-danger delete-customer" data-id="${c.id}" data-name="${c.name}">
                    <i class="bi bi-trash me-1"></i>Delete
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Attach event listeners
    document.querySelectorAll('.view-customer').forEach(btn => {
        btn.addEventListener('click', () => viewCustomer(btn.getAttribute('data-id')));
    });
    document.querySelectorAll('.edit-customer').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-id')));
    });
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
    if (saveBtn) saveBtn.addEventListener('click', saveCustomer);
    
    const confirmBtn = document.getElementById('confirmDeleteBtn');
    if (confirmBtn) confirmBtn.addEventListener('click', deleteCustomer);
    
    const modal = document.getElementById('addCustomerModal');
    if (modal) {
        modal.addEventListener('show.bs.modal', resetModalForm);
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
        loadCustomers();
        
    } catch (error) {
        console.error('Error saving customer:', error);
        showToast('Error saving customer: ' + error.message, 'danger');
    }
}

function viewCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    alert(`📋 CUSTOMER DETAILS\n\nName: ${customer.name}\nCompany: ${customer.company}\nEmail: ${customer.email}\nPhone: ${customer.phone}\nAddress: ${customer.address || 'N/A'}\nType: ${customer.type || 'Regular'}\nOrders: ${customer.orders || 0}\nFeedback: ${customer.feedback || '5 ★'}`);
}

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

function openDeleteModal(id, name) {
    currentDeleteId = id;
    document.getElementById('deleteCustomerName').innerHTML = name;
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
        loadCustomers();
    } catch (error) {
        console.error('Error deleting customer:', error);
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

function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.innerText = message;
    toast.className = `toast align-items-center text-white bg-${type === 'danger' ? 'danger' : 'success'} border-0`;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}