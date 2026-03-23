// const allowedRole = 'order_manager';

// const storedRole = sessionStorage.getItem('userRole');

// if (!storedRole || storedRole !== allowedRole) {
//     window.location.href = '../../index.html';
// }

const views = ['dashboardView', 'createOrderView', 'viewOrdersView'];
const titles = {
    dashboardView: 'Order Management',
    createOrderView: 'Create New Order',
    viewOrdersView: 'Order History'
};

function showView(viewId) {
    views.forEach(id => {
        document.getElementById(id).style.display = 'none';
    });

    const target = document.getElementById(viewId);
    target.style.display = 'block';

    target.classList.remove('view-section');
    void target.offsetWidth;
    target.classList.add('view-section');

    document.getElementById('pageTitle').textContent = titles[viewId];
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (viewId === 'viewOrdersView') loadOrders();
}

// save company names for next time

function loadCompanies() {
    db.collection('orders').get()
        .then(snapshot => {
            const companies = new Set();
            snapshot.forEach(doc => {
                const name = doc.data().companyName;
                if (name) companies.add(name);
            });

            const datalist = document.getElementById('companySuggestions');
            datalist.innerHTML = '';
            companies.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                datalist.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading companies:', error);
        });
}


loadCompanies();


// Step Navigation

function goToStep2() {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    step1.classList.add('slide-out-left');
    setTimeout(() => {
        step1.style.display = 'none';
        step1.classList.remove('slide-out-left');
        step2.style.display = 'block';
        step2.classList.add('slide-in-right');
        setTimeout(() => step2.classList.remove('slide-in-right'), 400);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
}

function goToStep1() {
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');

    step2.classList.add('slide-out-right');
    setTimeout(() => {
        step2.style.display = 'none';
        step2.classList.remove('slide-out-right');
        step1.style.display = 'block';
        step1.classList.add('slide-in-left');
        setTimeout(() => step1.classList.remove('slide-in-left'), 400);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
}

// Leave Form Modal 
function confirmLeaveForm() {
    document.getElementById('leaveFormModal').style.display = 'flex';
}

function closeLeaveModal() {
    document.getElementById('leaveFormModal').style.display = 'none';
}

function leaveForm() {
    closeLeaveModal();
    showView('dashboardView');
}

// Validation Modal
function showValidationModal(message) {
    document.getElementById('validationMessage').textContent = message;
    document.getElementById('validationModal').style.display = 'flex';
}

function closeValidationModal() {
    document.getElementById('validationModal').style.display = 'none';
}

//Loading icon untill submite the order.............//

function setSubmitLoading(isLoading) {
    const btn = document.querySelector('.btn-submit');
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Saving...
        `;
    } else {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-check-circle me-1"></i> Submit`;
    }
}

// Submit Order
function submitOrder() {
    const customerName = document.getElementById('customerName').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();
    const emailAddress = document.getElementById('emailAddress').value.trim();
    const address = document.getElementById('address').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const amountPaid = document.getElementById('amountPaid').value.trim();
    const productHeight = document.getElementById('productHeight').value.trim() + ' ' + document.getElementById('productHeightUnit').value;
    const productWidth = document.getElementById('productWidth').value.trim() + ' ' + document.getElementById('productWidthUnit').value;
    const designDescription = document.getElementById('designDescription').value.trim();

    if (!customerName) { showValidationModal('Please enter the Customer Name.'); return; }
    if (!contactNumber) { showValidationModal('Please enter the Contact Number.'); return; }
    if (!emailAddress) { showValidationModal('Please enter the Email Address.'); return; }
    if (!address) { showValidationModal('Please enter the Address.'); return; }
    if (!companyName) { showValidationModal('Please enter the Company Name.'); return; }
    if (!paymentMethod) { showValidationModal('Please select a Payment Method.'); return; }
    if (!amountPaid) { showValidationModal('Please enter the Amount Paid.'); return; }
    if (!document.getElementById('productHeight').value.trim()) { showValidationModal('Please enter the Product Height.'); return; }
    if (!document.getElementById('productWidth').value.trim()) { showValidationModal('Please enter the Product Width.'); return; }
    if (!designDescription) { showValidationModal('Please enter the Design Description.'); return; }

    setSubmitLoading(true);

    const orderData = {
        customerName,
        contactNumber,
        emailAddress,
        address,
        companyName,
        paymentMethod,
        amountPaid,
        productHeight,
        productWidth,
        designDescription,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Handle sketch photo upload if provided
    const sketchFile = document.getElementById('sketchPhoto').files[0];

    if (sketchFile) {
        const storageRef = firebase.storage().ref();
        const fileRef = storageRef.child('sketches/' + Date.now() + '_' + sketchFile.name);

        fileRef.put(sketchFile)
            .then(snapshot => snapshot.ref.getDownloadURL())
            .then(downloadURL => {
                orderData.sketchPhotoURL = downloadURL;
                return db.collection('orders').add(orderData);
            })
            .then(() => {
                orderSuccess();
            })
            .catch(error => {
                setSubmitLoading(false);
                showValidationModal('Something went wrong. Please try again.');
                console.error('Firebase error:', error);
            });
    } else {
        db.collection('orders').add(orderData)
            .then(() => {
                orderSuccess();
            })
            .catch(error => {
                setSubmitLoading(false);
                showValidationModal('Something went wrong. Please try again.');
                console.error('Firestore error:', error);
            });
    }
}

function orderSuccess() {
    setSubmitLoading(false);
    ['customerName', 'contactNumber', 'emailAddress', 'address', 'companyName',
        'amountPaid', 'productHeight', 'productWidth', 'designDescription'].forEach(id => {
            document.getElementById(id).value = '';
        });
    document.getElementById('paymentMethod').selectedIndex = 0;
    document.getElementById('productHeightUnit').selectedIndex = 0;
    document.getElementById('productWidthUnit').selectedIndex = 0;
    document.getElementById('sketchPhoto').value = '';
    document.getElementById('currencyPrefix').style.display = 'none';
    loadCompanies();
    goToStep1();
    setTimeout(() => showSuccessModal(), 500);
}



// for now
// DEMO MODE: Logout function 
function confirmLogout() {
    document.getElementById('logoutModal').style.display = 'flex';
}

function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}

function logout() {
    sessionStorage.clear();
    window.location.href = '../../index.html';
}
//  END DEMO MODE 



// ..............................VIEW ORDERS................................................

let allOrders = [];

function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted py-5">
        <div class="spinner-border spinner-border-sm me-2"></div> Loading orders...
    </td></tr>`;

    // Set max date to today
    const dateInput = document.getElementById('dateFilter');
    if (dateInput) {
        dateInput.max = new Date().toISOString().split('T')[0];
    }

    db.collection('orders').orderBy('createdAt', 'asc').get()
        .then(snapshot => {
            allOrders = [];
            snapshot.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));
            renderOrdersTable([...allOrders].reverse());
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger py-4">
                Failed to load orders.</td></tr>`;
        });
}

// sort by calender...................// 
function filterByDate() {
    const selectedDate = document.getElementById('dateFilter').value;

    if (!selectedDate) {
        renderOrdersTable(allOrders);
        return;
    }

    const filtered = allOrders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = new Date(order.createdAt.seconds * 1000);
        const orderDateStr = orderDate.toISOString().split('T')[0];
        return orderDateStr === selectedDate;
    });

    renderOrdersTable(filtered);
}

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    if (!orders.length) {
        tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted py-5">
            <i class="bi bi-inbox fs-1 d-block mb-2 opacity-25"></i>No orders found</td></tr>`;
        return;
    }
    tbody.innerHTML = orders.map((order, index) => {
        const processBadge = getProcessBadge(order.orderProcess || 'Pending');
        const amountDisplay = order.amountPaid ? `Rs. ${parseFloat(order.amountPaid).toLocaleString()}` : '—';
        const orderNo = String(allOrders.findIndex(o => o.id === order.id) + 1).padStart(2, '0');
        return `<tr>
            <td class="ps-4 fw-semibold text-muted">${orderNo}</td>
            <td class="fw-semibold">${order.customerName || '—'}</td>
            <td>${order.contactNumber || '—'}</td>
            <td style="max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
                title="${order.address || ''}">${order.address || '—'}</td>
            <td>${order.companyName || '—'}</td>
            <td>${order.paymentMethod || '—'}</td>
            <td>${amountDisplay}</td>
            <td>${processBadge}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-light rounded-circle p-2" onclick="editOrder('${order.id}')">
                    <i class="bi bi-pencil text-primary"></i>
                </button>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-light rounded-circle p-2" onclick="viewOrderDetail('${order.id}')">
                    <i class="bi bi-eye text-success"></i>
                </button>
            </td>
            <td class="text-center pe-4">
                <button class="btn btn-sm btn-light rounded-circle p-2" onclick="confirmDeleteOrder('${order.id}', '${order.customerName || 'this order'}')">
                    <i class="bi bi-trash text-danger"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
}

function getProcessBadge(status) {
    const map = {
        'Ongoing': { bg: '#fff3cd', color: '#856404', icon: 'bi-hourglass-split' },
        'Finished': { bg: '#d1e7dd', color: '#0f5132', icon: 'bi-check-circle-fill' },
        'Pending': { bg: '#e2e3e5', color: '#41464b', icon: 'bi-clock' },
        'Cancelled': { bg: '#f8d7da', color: '#842029', icon: 'bi-x-circle-fill' },
    };
    const s = map[status] || map['Pending'];
    return `<span style="background:${s.bg};color:${s.color};padding:4px 12px;
        border-radius:20px;font-size:0.78rem;font-weight:600;display:inline-flex;
        align-items:center;gap:5px;">
        <i class="bi ${s.icon}"></i>${status}</span>`;
}

function filterOrders() {
    const q = document.getElementById('orderSearchInput').value.toLowerCase().trim();
    const filtered = allOrders.filter(o =>
        (o.customerName || '').toLowerCase().includes(q) ||
        (o.contactNumber || '').toLowerCase().includes(q) ||
        (o.companyName || '').toLowerCase().includes(q) ||
        (o.address || '').toLowerCase().includes(q)
    );
    renderOrdersTable(filtered);
}

function sortOrders(key) {
    const sorted = [...allOrders].sort((a, b) =>
        (a[key] || '').toString().toLowerCase().localeCompare((b[key] || '').toString().toLowerCase())
    );
    renderOrdersTable(sorted);
}

// ........Print Table only.............

function printOrderTable() {
    const tableHTML = document.getElementById('ordersTable').outerHTML;
    const printWindow = window.open('', '', 'width=1000,height=700');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Order Table - Grafix Print Hub</title>
            <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
                <style>
                    body { padding: 30px; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
                    h4 { margin-bottom: 20px; color: #22244a; }
                    table { border-collapse: collapse; width: 100%; }
                    thead { background: #f1f3fb; display: table-header-group; }
                    thead th { font-size: 0.84rem; font-weight: 700; padding: 12px 10px; color: #6c757d; }
                    tbody td { font-size: 0.88rem; padding: 10px; }
                    tr { page-break-inside: avoid; }
                    @media print { body { padding: 10px; } }
                </style>
        </head>
        <body>
            <h4>Order History — Grafix Print Hub</h4>
            ${tableHTML}
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}


// ........................... DELETE ............................//

let orderToDelete = null;

function confirmDeleteOrder(id, name) {
    orderToDelete = id;
    document.getElementById('deleteOrderName').textContent = name;
    document.getElementById('deleteModal').style.display = 'flex';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    orderToDelete = null;
}

function executeDeleteOrder() {
    if (!orderToDelete) return;
    db.collection('orders').doc(orderToDelete).delete()
        .then(() => { closeDeleteModal(); loadOrders(); })
        .catch(err => { console.error(err); alert('Failed to delete order.'); });
}

// ..........................................VIEW DETAIL.......................................................//

function viewOrderDetail(id) {
    const order = allOrders.find(o => o.id === id);
    if (!order) return;
    document.getElementById('detailName').textContent = order.customerName || '—';
    document.getElementById('detailContact').textContent = order.contactNumber || '—';
    document.getElementById('detailEmail').textContent = order.emailAddress || '—';
    document.getElementById('detailAddress').textContent = order.address || '—';
    document.getElementById('detailCompany').textContent = order.companyName || '—';
    document.getElementById('detailPayment').textContent = order.paymentMethod || '—';
    document.getElementById('detailAmount').textContent = order.amountPaid
        ? `Rs. ${parseFloat(order.amountPaid).toLocaleString()}` : '—';
    document.getElementById('detailSize').textContent = (order.productHeight && order.productWidth)
        ? `${order.productHeight} × ${order.productWidth}` : '—';
    document.getElementById('detailDescription').textContent = order.designDescription || '—';
    document.getElementById('detailProcess').innerHTML = getProcessBadge(order.orderProcess || 'Pending');
    const imgEl = document.getElementById('detailSketchImg');
    if (order.sketchPhotoURL) { imgEl.src = order.sketchPhotoURL; imgEl.style.display = 'block'; }
    else { imgEl.style.display = 'none'; }
    document.getElementById('viewDetailModal').style.display = 'flex';
}

function closeViewDetailModal() {
    document.getElementById('viewDetailModal').style.display = 'none';
}

// ─── EDIT (wire up later) ───────────────────────────────────────
function editOrder(id) {
    alert('Edit order: ' + id);
}


// success orders//

function showSuccessModal() {
    document.getElementById('successModal').style.display = 'flex';
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    showView('dashboardView');
}