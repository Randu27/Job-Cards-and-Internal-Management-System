const allowedRole = 'order_manager';

const storedRole = sessionStorage.getItem('userRole');

if (!storedRole || storedRole !== allowedRole) {
    window.location.href = '../../index.html';
}

const views = ['dashboardView', 'createOrderView', 'viewOrdersView'];
const titles = {
    dashboardView: 'Order Management',
    createOrderView: 'Create New Order',
    viewOrdersView: 'View Orders'
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
}

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

// Submit Order
function submitOrder() {
    const customerName = document.getElementById('customerName').value.trim();
    const contactNumber = document.getElementById('contactNumber').value.trim();
    const emailAddress = document.getElementById('emailAddress').value.trim();
    const address = document.getElementById('address').value.trim();
    const companyName = document.getElementById('companyName').value.trim();
    const paymentMethod = document.getElementById('paymentMethod').value;
    const amountPaid = document.getElementById('amountPaid').value.trim();
    const productHeight = document.getElementById('productHeight').value.trim();
    const productWidth = document.getElementById('productWidth').value.trim();
    const designDescription = document.getElementById('designDescription').value.trim();

    if (!customerName) { showValidationModal('Please enter the Customer Name.'); return; }
    if (!contactNumber) { showValidationModal('Please enter the Contact Number.'); return; }
    if (!emailAddress) { showValidationModal('Please enter the Email Address.'); return; }
    if (!address) { showValidationModal('Please enter the Address.'); return; }
    if (!companyName) { showValidationModal('Please enter the Company Name.'); return; }
    if (!paymentMethod) { showValidationModal('Please select a Payment Method.'); return; }
    if (!amountPaid) { showValidationModal('Please enter the Amount Paid.'); return; }
    if (!productHeight) { showValidationModal('Please enter the Product Height.'); return; }
    if (!productWidth) { showValidationModal('Please enter the Product Width.'); return; }
    if (!designDescription) { showValidationModal('Please enter the Design Description.'); return; }

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
                showValidationModal('Something went wrong. Please try again.');
                console.error('Firebase error:', error);
            });
    } else {
        db.collection('orders').add(orderData)
            .then(() => {
                orderSuccess();
            })
            .catch(error => {
                showValidationModal('Something went wrong. Please try again.');
                console.error('Firestore error:', error);
            });
    }
}

function orderSuccess() {
    // Clear all fields
    ['customerName', 'contactNumber', 'emailAddress', 'address', 'companyName',
        'amountPaid', 'productHeight', 'productWidth', 'designDescription'].forEach(id => {
            document.getElementById(id).value = '';
        });
    document.getElementById('paymentMethod').selectedIndex = 0;
    document.getElementById('sketchPhoto').value = '';

    // Reset currency prefix
    document.getElementById('currencyPrefix').style.display = 'none';

    // Go back to step 1 then dashboard
    goToStep1();
    setTimeout(() => showView('dashboardView'), 500);
}