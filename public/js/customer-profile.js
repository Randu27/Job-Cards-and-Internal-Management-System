let customers = [];
let currentDeleteId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
    setupEventListeners();
});

function loadCustomers() {
    db.collection('customers').orderBy('dateAdded', 'desc').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        renderCustomersTable();
    }).catch((error) => {
        console.error('Error loading customers:', error);
        showToast('Error loading customers: ' + error.message);
    });
}

function renderCustomersTable() {
    const tableBody = document.getElementById('customersTableBody');
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
                <button class="btn btn-sm btn-outline-info view-customer me-1" data-id="${c.id}" title="View"><i class="bi bi-eye"></i></button>
                <button class="btn btn-sm btn-outline-primary edit-customer me-1" data-id="${c.id}" title="Edit"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger delete-customer" data-id="${c.id}" data-name="${c.name}" title="Delete"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
    
    // Attach events
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
    document.getElementById('saveCustomerBtn').addEventListener('click', saveCustomer);
    document.getElementById('confirmDeleteBtn').addEventListener('click', deleteCustomer);
    document.getElementById('addCustomerModal').addEventListener('show.bs.modal', resetModalForm);
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
        showToast('Please fill all required fields!');
        return;
    }

    const customerData = {
        name, company, email, phone,
        address: address || 'Not specified',
        orders, type, feedback,
        dateAdded: new Date().toISOString().split('T')[0]
    };

    try {
        if (id) {
            await db.collection('customers').doc(id).update(customerData);
            showToast(`Customer "${name}" updated!`);
        } else {
            await db.collection('customers').add(customerData);
            showToast(`Customer "${name}" added!`);
        }
        bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
        loadCustomers();
    } catch (error) {
        showToast('Error: ' + error.message);
    }
}

function viewCustomer(id) {
    const customer = customers.find(c => c.id === id);
    if (customer) {
        alert(`📋 CUSTOMER DETAILS\n\nName: ${customer.name}\nCompany: ${customer.company}\nEmail: ${customer.email}\nPhone: ${customer.phone}\nAddress: ${customer.address}\nType: ${customer.type}\nOrders: ${customer.orders}\nFeedback: ${customer.feedback}`);
    }
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
        showToast('Customer deleted!');
        bootstrap.Modal.getInstance(document.getElementById('deleteModal')).hide();
        loadCustomers();
    } catch (error) {
        showToast('Error: ' + error.message);
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

function showToast(message) {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.innerText = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}