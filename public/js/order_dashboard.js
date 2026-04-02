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

//..................... Company autocomplete .........................//

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
        .catch(error => console.error('Error loading companies:', error));
}

loadCompanies();

// ................ Step Navigation ........................//

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

// ................. Leave Form Modal //

function confirmLeaveForm() {
    document.getElementById('leaveFormModal').style.display = 'flex';
}
function closeLeaveModal() {
    document.getElementById('leaveFormModal').style.display = 'none';
}

// leave conformation in both edit and new add form..//

function leaveForm() {
    closeLeaveModal();
    if (editingOrderId) {
        editingOrderId = null;
        resetFormToCreateMode();
        clearFormFields();
        showView('viewOrdersView');
    } else {
        showView('dashboardView');
    }
}

// ............. Validation Modal ...............//

function showValidationModal(message) {
    document.getElementById('validationMessage').textContent = message;
    document.getElementById('validationModal').style.display = 'flex';
}
function closeValidationModal() {
    document.getElementById('validationModal').style.display = 'none';
}

//...............Submit loading state .....................//

function setSubmitLoading(isLoading) {
    const btn = document.querySelector('.btn-submit');
    if (!btn) return;
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Saving...`;
    } else {
        btn.disabled = false;
        btn.innerHTML = `<i class="bi bi-check-circle me-1"></i> Submit`;
    }
}

// ...................................... Submit Order .......................................//

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
        customerName, contactNumber, emailAddress, address, companyName,
        paymentMethod, amountPaid, productHeight, productWidth, designDescription,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

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
            .then(() => orderSuccess())
            .catch(error => {
                setSubmitLoading(false);
                showValidationModal('Something went wrong. Please try again.');
                console.error('Firebase error:', error);
            });
    } else {
        db.collection('orders').add(orderData)
            .then(() => orderSuccess())
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

// ................ Logout .............................//

function confirmLogout() {
    document.getElementById('logoutConfirmModal').style.display = 'flex';
}
function closeLogoutModal() {
    document.getElementById('logoutConfirmModal').style.display = 'none';
}
function logout() {
    sessionStorage.clear();
    window.location.href = '../../index.html';
}

// ....................... View Orders ..........................//

let allOrders = [];

function loadOrders() {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = `<tr><td colspan="11" class="text-center text-muted py-5">
        <div class="spinner-border spinner-border-sm me-2"></div> Loading orders...
    </td></tr>`;

    const dateInput = document.getElementById('dateFilter');
    if (dateInput) dateInput.max = new Date().toISOString().split('T')[0];

    db.collection('orders').orderBy('createdAt', 'asc').get()
        .then(snapshot => {
            allOrders = [];
            snapshot.forEach(doc => allOrders.push({ id: doc.id, ...doc.data() }));
            renderOrdersTable([...allOrders].reverse());
        })
        .catch(err => {
            console.error(err);
            tbody.innerHTML = `<tr><td colspan="11" class="text-center text-danger py-4">Failed to load orders.</td></tr>`;
        });
}

function filterByDate() {
    const selectedDate = document.getElementById('dateFilter').value;
    if (!selectedDate) { renderOrdersTable(allOrders); return; }
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
    tbody.innerHTML = orders.map((order) => {
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
                <button class="btn btn-sm btn-light rounded-circle p-2" onclick="confirmDeleteOrder('${order.id}', '${(order.customerName || 'this order').replace(/'/g, "\\'")}')">
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

// .............................. Print Table ................................//

function printOrderTable() {
    const tableHTML = document.getElementById('ordersTable').outerHTML;
    const printWindow = window.open('', '', 'width=1000,height=700');
    printWindow.document.write(`
        <!DOCTYPE html><html>
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
        </body></html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
}

// .................... Delete..............................//

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

// ....................View Detail .......................................//

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
    const imgWrapper = document.getElementById('sketchImgWrapper');
    if (order.sketchPhotoURL) {
        imgEl.src = order.sketchPhotoURL;
        imgEl.style.display = 'block';
        imgWrapper.style.display = 'block';
    } else {
        imgEl.style.display = 'none';
        imgWrapper.style.display = 'none';
    }

    document.getElementById('viewDetailModal').style.display = 'flex';
}

function closeViewDetailModal() {
    document.getElementById('viewDetailModal').style.display = 'none';
}



// ................... Edit Order .............................//

let editingOrderId = null;
let justFinishedEdit = false;

function editOrder(id) {
    const order = allOrders.find(o => o.id === id);
    if (!order) return;

    editingOrderId = id;

    // ── Step 1 fields ──
    document.getElementById('customerName').value = order.customerName || '';
    document.getElementById('contactNumber').value = order.contactNumber || '';
    document.getElementById('emailAddress').value = order.emailAddress || '';
    document.getElementById('address').value = order.address || '';
    document.getElementById('companyName').value = order.companyName || '';
    document.getElementById('paymentMethod').value = order.paymentMethod || '';
    document.getElementById('amountPaid').value = order.amountPaid || '';

    if (order.amountPaid) {
        document.getElementById('currencyPrefix').style.display = 'flex';
    }

    // ── Step 2 fields ──
    // Values are stored as "12 cm" — split into number + unit
    if (order.productHeight) {
        const parts = order.productHeight.split(' ');
        document.getElementById('productHeight').value = parts[0] || '';
        document.getElementById('productHeightUnit').value = parts[1] || 'cm';
    }
    if (order.productWidth) {
        const parts = order.productWidth.split(' ');
        document.getElementById('productWidth').value = parts[0] || '';
        document.getElementById('productWidthUnit').value = parts[1] || 'cm';
    }

    document.getElementById('designDescription').value = order.designDescription || '';
    document.getElementById('sketchPhoto').value = ''; // file inputs can't be pre-filled

    // ── Show Order Process dropdown ──
    document.getElementById('orderProcessWrapper').style.display = 'block';
    document.getElementById('orderProcessSelect').value = order.orderProcess || 'Pending';

    // ── Swap Submit → Save Changes ──
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerHTML = `<i class="bi bi-floppy-fill me-1"></i> Save Changes`;
    submitBtn.onclick = saveEditedOrder;

    // ── Navigate to the form ──
    document.getElementById('pageTitle').textContent = 'Edit Order';
    showView('createOrderView');
    goToStep1();
}

function saveEditedOrder() {
    const customerName = document.getElementById('customerName').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();
    const emailAddress = document.getElementById('emailAddress').value.trim();
    const address = document.getElementById('address').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const amountPaid = document.getElementById('amountPaid').value.trim();
    const productHeight = document.getElementById('productHeight').value.trim()
        + ' ' + document.getElementById('productHeightUnit').value;
    const productWidth = document.getElementById('productWidth').value.trim()
        + ' ' + document.getElementById('productWidthUnit').value;
    const designDescription = document.getElementById('designDescription').value.trim();
    const orderProcess = document.getElementById('orderProcessSelect').value;

    if (!customerName) { showValidationModal('Please enter the Customer Name.'); return; }
    if (!contactNumber) { showValidationModal('Please enter the Contact Number.'); return; }
    if (!emailAddress) { showValidationModal('Please enter the Email Address.'); return; }
    if (!address) { showValidationModal('Please enter the Address.'); return; }
    if (!companyName) { showValidationModal('Please enter the Company Name.'); return; }
    if (!paymentMethod) { showValidationModal('Please select a Payment Method.'); return; }
    if (!amountPaid) { showValidationModal('Please enter the Amount Paid.'); return; }
    if (!document.getElementById('productHeight').value.trim()) {
        showValidationModal('Please enter the Product Height.'); return;
    }
    if (!document.getElementById('productWidth').value.trim()) {
        showValidationModal('Please enter the Product Width.'); return;
    }
    if (!designDescription) { showValidationModal('Please enter the Design Description.'); return; }

    setSubmitLoading(true);

    const updatedData = {
        customerName, contactNumber, emailAddress, address, companyName,
        paymentMethod, amountPaid, productHeight, productWidth,
        designDescription, orderProcess
    };

    const sketchFile = document.getElementById('sketchPhoto').files[0];

    const doUpdate = (extraData = {}) => {
        db.collection('orders').doc(editingOrderId)
            .update({ ...updatedData, ...extraData })
            .then(() => editSuccess())
            .catch(err => {
                setSubmitLoading(false);
                showValidationModal('Something went wrong. Please try again.');
                console.error('Firestore update error:', err);
            });
    };

    if (sketchFile) {
        const fileRef = firebase.storage().ref()
            .child('sketches/' + Date.now() + '_' + sketchFile.name);
        fileRef.put(sketchFile)
            .then(snap => snap.ref.getDownloadURL())
            .then(url => doUpdate({ sketchPhotoURL: url }))
            .catch(err => {
                setSubmitLoading(false);
                showValidationModal('Image upload failed. Please try again.');
                console.error(err);
            });
    } else {
        doUpdate(); // no new image — existing sketchPhotoURL stays untouched in Firestore
    }
}

function editSuccess() {
    setSubmitLoading(false);
    justFinishedEdit = true;
    editingOrderId = null;
    resetFormToCreateMode();
    clearFormFields();
    goToStep1();
    setTimeout(() => {
        document.getElementById('successModal').querySelector('h5').textContent = 'Order Updated!';
        document.getElementById('successModal').querySelector('p').textContent = 'Changes have been saved successfully.';
        showSuccessModal();
    }, 450);
}

function resetFormToCreateMode() {
    const submitBtn = document.querySelector('.btn-submit');
    submitBtn.innerHTML = `<i class="bi bi-check-circle me-1"></i> Submit`;
    submitBtn.onclick = submitOrder;
    document.getElementById('orderProcessWrapper').style.display = 'none';
    document.getElementById('pageTitle').textContent = 'Create New Order';
}

function clearFormFields() {
    ['customerName', 'contactNumber', 'emailAddress', 'address', 'companyName',
        'amountPaid', 'productHeight', 'productWidth', 'designDescription'].forEach(id => {
            document.getElementById(id).value = '';
        });
    document.getElementById('paymentMethod').selectedIndex = 0;
    document.getElementById('productHeightUnit').selectedIndex = 0;
    document.getElementById('productWidthUnit').selectedIndex = 0;
    document.getElementById('sketchPhoto').value = '';
    document.getElementById('currencyPrefix').style.display = 'none';
}
// ........................ Success Modal ......................................//

function showSuccessModal() {
    document.getElementById('successModal').style.display = 'flex';
}
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';

    // Reset modal text back to default for next create-order use
    document.getElementById('successModal').querySelector('h5').textContent = 'Order Added Successfully!';
    document.getElementById('successModal').querySelector('p').textContent = 'The new order has been saved.';

    // After edit → go to View Orders; after create → go to Dashboard
    if (justFinishedEdit) {
        justFinishedEdit = false;
        showView('viewOrdersView');  // edit → back to table
    } else {
        showView('dashboardView');   // create → back to dashboard
    }
}


//................... View single order print section ...............//


function fetchImageAsBase64(url) {
    return fetch(url)
        .then(res => {
            if (!res.ok) throw new Error('Image fetch failed: ' + res.status);
            return res.blob();
        })
        .then(blob => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);   // "data:image/...;base64,..."
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        }));
}

/**
 * Return { w, h } natural pixel dimensions of a base64 image.
 */
function getImageNaturalSize(base64DataUrl) {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 800, h: 600 });   // safe fallback
        img.src = base64DataUrl;
    });
}

/**
 * Main export function — called by the "Download PDF" button.
 */
async function exportOrderToPDF() {

    // ................... Guard: jsPDF must be loaded ...................//

    if (!window.jspdf) {
        alert('PDF library not loaded yet. Please try again in a moment.');
        return;
    }
    const { jsPDF } = window.jspdf;

    // ...................... Collect data from the open modal ....................//
    const getText = id => (document.getElementById(id)?.textContent || '').trim();

    const data = {
        name: getText('detailName'),
        contact: getText('detailContact'),
        email: getText('detailEmail'),
        company: getText('detailCompany'),
        address: getText('detailAddress'),
        payment: getText('detailPayment'),
        amount: getText('detailAmount'),
        size: getText('detailSize'),
        process: getText('detailProcess'),   // plain text (badge stripped)
        description: getText('detailDescription'),
    };

    // ..............Pre-fetch sketch image (if any)

    const imgEl = document.getElementById('detailSketchImg');
    const hasImage = imgEl && imgEl.style.display !== 'none'
        && imgEl.src && !imgEl.src.endsWith(window.location.href);

    let sketchBase64 = null;
    let sketchSize = { w: 1, h: 1 };

    if (hasImage) {
        // Show loading state on button while fetching
        const btn = document.getElementById('pdfBtn');
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Preparing PDF…`;

        try {
            sketchBase64 = await fetchImageAsBase64(imgEl.src);
            sketchSize = await getImageNaturalSize(sketchBase64);
        } catch (err) {
            console.warn('Sketch image could not be loaded for PDF:', err);
            sketchBase64 = null;   // continue without image — don't block PDF
        }

        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }

    //....................PDF constants & helpers .........................//

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    const PW = 210, PH = 297;   // A4 dimensions
    const ML = 16, MR = 16;     // left / right margin
    const CW = PW - ML - MR;    // usable content width

    // ......................Palette...........................//

    const C = {
        purple: [79, 70, 229],   // indigo-600
        purpleLight: [238, 242, 255],   // indigo-50
        purpleMid: [199, 210, 254],   // indigo-200
        green: [5, 150, 105],   // emerald-600
        greenLight: [209, 250, 229],   // emerald-100
        dark: [17, 24, 39],   // gray-900
        mid: [75, 85, 99],   // gray-600
        muted: [156, 163, 175],   // gray-400
        light: [243, 244, 246],   // gray-100
        white: [255, 255, 255],
        amber: [217, 119, 6],   // amber-600
        amberLight: [254, 243, 199],   // amber-50
        red: [185, 28, 28],
        redLight: [254, 226, 226],
    };

    // Helpers to set colors quickly
    const fill = (rgb) => doc.setFillColor(...rgb);
    const stroke = (rgb) => doc.setDrawColor(...rgb);
    const text = (rgb) => doc.setTextColor(...rgb);

    // Draw a filled rounded rectangle
    function roundRect(x, y, w, h, r, colorRgb) {
        fill(colorRgb);
        doc.roundedRect(x, y, w, h, r, r, 'F');
    }

    // Write a label + value pair inside a card tile

    function drawTile(x, y, w, h, label, value) {
        roundRect(x, y, w, h, 3, C.light);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        text(C.muted);
        doc.text(label.toUpperCase(), x + 4, y + 6);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        text(C.dark);
        // Truncate long values gracefully
        const lines = doc.splitTextToSize(value || '—', w - 8);
        doc.text(lines[0] || '—', x + 4, y + 13);   // show first line only in tile
    }

    let y = 0;   // running Y cursor

    // ........................Header band ..............................//

    fill(C.purple);
    doc.rect(0, 0, PW, 32, 'F');

    // Decorative circle top-right
    fill([99, 102, 241]);   // slightly lighter indigo
    doc.circle(PW - 10, -8, 24, 'F');
    fill([129, 140, 248]);
    doc.circle(PW - 28, 6, 10, 'F');

    // Company name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    text(C.white);
    doc.text('Grafix Print Hub', ML, 14);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    text([199, 210, 254]);   // indigo-200
    doc.text('Order Detail Report', ML, 21);

    // Date — right aligned
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    doc.setFontSize(8);
    text(C.white);
    doc.text(dateStr, PW - MR, 21, { align: 'right' });

    // Green accent line
    fill(C.green);
    doc.rect(0, 32, PW, 2.5, 'F');

    y = 44;


    // ...................."Customer & Order Information" section title ...................//
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    text(C.dark);
    doc.text('Customer & Order Information', ML, y);

    // Purple underline accent
    fill(C.purple);
    doc.rect(ML, y + 2, 52, 1.2, 'F');

    y += 10;

    // ................... Two-column info tiles ..................//
    const TILE_H = 18;
    const TILE_GAP = 4;
    const HALF_W = (CW - TILE_GAP) / 2;

    const leftCol = ML;
    const rightCol = ML + HALF_W + TILE_GAP;

    const tileData = [
        ['Customer Name', data.name],
        ['Contact No', data.contact],
        ['Email Address', data.email],
        ['Company', data.company],
        ['Payment Method', data.payment],
        ['Amount Paid', data.amount],
        ['Product Size', data.size],
        ['Order Process', data.process],
    ];

    tileData.forEach(([label, value], i) => {
        const col = i % 2 === 0 ? leftCol : rightCol;
        const row = Math.floor(i / 2);
        const ty = y + row * (TILE_H + TILE_GAP);
        drawTile(col, ty, HALF_W, TILE_H, label, value);
    });

    y += Math.ceil(tileData.length / 2) * (TILE_H + TILE_GAP) + 4;


    // .................... Address — full width tile ..............//
    const addrLines = doc.splitTextToSize(data.address || '—', CW - 8);
    const addrTileH = Math.max(18, addrLines.length * 5 + 10);
    roundRect(ML, y, CW, addrTileH, 3, C.light);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    text(C.muted);
    doc.text('ADDRESS', ML + 4, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    text(C.dark);
    doc.text(addrLines, ML + 4, y + 13);

    y += addrTileH + 6;

    // ............... Design Description — full width..................//
    const descLines = doc.splitTextToSize(data.description || '—', CW - 10);
    const descTileH = descLines.length * 5.2 + 16;

    // Slightly tinted background for description
    roundRect(ML, y, CW, descTileH, 4, C.purpleLight);

    // Left accent bar
    fill(C.purple);
    doc.roundedRect(ML, y, 3, descTileH, 1.5, 1.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    text(C.muted);
    doc.text('DESIGN DESCRIPTION', ML + 7, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    text(C.dark);
    doc.text(descLines, ML + 7, y + 13);

    y += descTileH + 8;

    //..................... Sketch / Original Design image ...................//

    if (sketchBase64) {

        // Check if we need a new page
        const MIN_IMG_SPACE = 40;
        if (y + MIN_IMG_SPACE > PH - 20) {
            doc.addPage();
            y = 20;
        }

        // Section title
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        text(C.dark);
        doc.text('Original Design / Sketch', ML, y);

        fill(C.green);
        doc.rect(ML, y + 2, 42, 1.2, 'F');

        y += 10;

        // Scale image: max width = CW, max height = 85mm
        const MAX_W = CW;
        const MAX_H = 85;
        const ratio = sketchSize.h / sketchSize.w;
        let imgW = MAX_W;
        let imgH = imgW * ratio;
        if (imgH > MAX_H) { imgH = MAX_H; imgW = imgH / ratio; }

        // Overflow to new page if needed
        if (y + imgH + 4 > PH - 20) { doc.addPage(); y = 20; }

        // Shadow / border tile behind image
        roundRect(ML - 2, y - 2, imgW + 4, imgH + 4, 4, C.purpleMid);

        // Detect PNG vs JPEG from data URL header
        const fmt = sketchBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
        doc.addImage(sketchBase64, fmt, ML, y, imgW, imgH);

        y += imgH + 10;
    }

    //  Footer band 

    // If content is near the bottom, footer is fixed to page bottom//
    fill(C.purple);
    doc.rect(0, PH - 12, PW, 12, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    text(C.white);
    doc.text('© Grafix Print Hub — Confidential Order Record', ML, PH - 4);
    text([199, 210, 254]);
    doc.text(`Generated: ${now.toLocaleString('en-GB')}`, PW - MR, PH - 4, { align: 'right' });

    // .... browser opens native "Save As" dialog ...//

    const safeName = (data.name || 'Order').replace(/[^a-z0-9_\- ]/gi, '_').replace(/\s+/g, '_');
    doc.save(`GrafixPrintHub_${safeName}_Order.pdf`);
}