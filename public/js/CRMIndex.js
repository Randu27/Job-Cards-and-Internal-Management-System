// Customer data array (synced with Firestore)
let customers = [];

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the page
    initializePage();
    
    // Set up event listeners
    setupEventListeners();
});

function initializePage() {
    // Set the Date Range Text
    setDateRange();
    
    // Load customers from Firestore
    loadCustomersFromFirestore();
}

function setDateRange() {
    const dateRangeElement = document.getElementById('dateRangeText');
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    dateRangeElement.innerText = `Showing data from: ${thirtyDaysAgo.toLocaleDateString(undefined, options)} to ${today.toLocaleDateString(undefined, options)}`;
}

// LOAD FROM FIRESTORE
function loadCustomersFromFirestore() {
    db.collection('customers').get().then((snapshot) => {
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

function updateStats() {
    // Calculate stats
    const totalCustomers = customers.length;
    const newFeedbacks = customers.filter(c => c.feedback && c.feedback.includes('5')).length;
    const promotionsSent = 156; // Static for now
    
    // Animate the numbers
    animateValue(document.getElementById('totalCustomers'), 0, totalCustomers, 1000);
    animateValue(document.getElementById('newFeedbacks'), 0, newFeedbacks, 1000);
    document.getElementById('promotionsSent').innerText = promotionsSent;
}

function animateValue(element, start, end, duration) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        element.innerText = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.innerText = end;
        }
    };
    window.requestAnimationFrame(step);
}

function renderCustomersTable() {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = ''; // Clear existing rows
    
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.id = `customer-${c.id}`;
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
            <td><span class="badge bg-primary bg-opacity-10 text-primary">${c.orders} orders</span></td>
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function getAvatar(name) {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

function setupEventListeners() {
    // Save customer button (CREATE operation only)
    const saveBtn = document.getElementById('saveCustomerBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveCustomer);
    }
    
    // Reset modal when opened
    const addModal = document.getElementById('addCustomerModal');
    if (addModal) {
        addModal.addEventListener('show.bs.modal', function() {
            resetModalForm();
        });
    }
}

// CREATE operation - Add new customer and SAVE TO FIRESTORE
async function saveCustomer() {
    // Get form values
    const name = document.getElementById('customerName').value.trim();
    const company = document.getElementById('customerCompany').value.trim();
    const email = document.getElementById('customerEmail').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const address = document.getElementById('customerAddress').value.trim();
    const orders = parseInt(document.getElementById('customerOrders').value) || 0;
    const type = document.getElementById('customerType').value;
    const feedback = document.getElementById('customerFeedback').value;
    const notes = document.getElementById('customerNotes').value.trim();

    // Validate required fields
    if (!name || !company || !email || !phone) {
        showToast('Please fill all required fields!', 'danger');
        return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
        showToast('Please enter a valid email address!', 'danger');
        return;
    }

    // Create new customer object
    const newCustomer = {
        name: name,
        company: company,
        email: email,
        phone: phone,
        address: address || 'Not specified',
        orders: orders,
        type: type,
        feedback: feedback,
        notes: notes || 'No notes',
        avatar: getAvatar(name),
        dateAdded: new Date().toISOString().split('T')[0]
    };

    try {
        // Save to Firestore
        await db.collection('customers').add(newCustomer);

        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('addCustomerModal'));
        modal.hide();

        // Show success message
        showToast(`Customer "${name}" added successfully!`, 'success');

        // Reload customers from Firestore
        loadCustomersFromFirestore();

    } catch (error) {
        showToast('Error saving customer: ' + error.message, 'danger');
    }
}

function resetModalForm() {
    // Reset form fields
    document.getElementById('customerName').value = '';
    document.getElementById('customerCompany').value = '';
    document.getElementById('customerEmail').value = '';
    document.getElementById('customerPhone').value = '';
    document.getElementById('customerAddress').value = '';
    document.getElementById('customerOrders').value = '0';
    document.getElementById('customerType').value = 'Regular';
    document.getElementById('customerFeedback').value = '5 ★';
    document.getElementById('customerNotes').value = '';
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    // Set message
    toastMessage.innerText = message;
    
    // Set color based on type
    toast.className = `toast align-items-center text-white bg-${type} border-0`;
    
    // Show toast
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}