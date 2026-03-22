let customers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
});

function loadCustomers() {
    const db = firebase.firestore();
    const tableBody = document.getElementById('previewTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4">Loading...<\/td><\/tr>';
    
    db.collection('customers').orderBy('dateAdded', 'desc').limit(10).get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        renderPreviewTable();
    }).catch((error) => {
        console.error('Error loading customers:', error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Error loading data<\/td><\/tr>';
    });
}

function renderPreviewTable() {
    const tableBody = document.getElementById('previewTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No customers found<\/td><\/tr>';
        return;
    }
    
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="fw-bold">${c.name || '—'}</div>
                <small class="text-muted">${c.type || 'Regular'}</small>
            </td>
            <td>${c.company || '—'}</td>
            <td><span class="badge bg-primary bg-opacity-10 text-primary">${c.orders || 0}</span></td>
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function generateReport(type) {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (type === 'pdf') {
        toastMessage.innerText = 'PDF report generated! (Demo)';
    } else if (type === 'excel') {
        toastMessage.innerText = 'Excel report generated! (Demo)';
    }
    
    toast.className = 'toast align-items-center text-white bg-success border-0 show';
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function showToast(message) {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.innerText = message;
    toast.className = 'toast align-items-center text-white bg-success border-0 show';
    setTimeout(() => toast.classList.remove('show'), 3000);
}

window.generateReport = generateReport;