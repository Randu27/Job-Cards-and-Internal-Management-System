let customers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
});

function loadCustomers() {
    db.collection('customers').orderBy('dateAdded', 'desc').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        renderPreviewTable();
    }).catch((error) => {
        console.error('Error loading customers:', error);
    });
}

function renderPreviewTable() {
    const tableBody = document.getElementById('previewTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No customers found</td></tr>';
        return;
    }
    
    customers.slice(0, 10).forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><div class="fw-bold">${c.name}</div><small class="text-muted">${c.type || 'Regular'}</small></td>
            <td>${c.company}</td>
            <td><span class="badge bg-primary bg-opacity-10 text-primary">${c.orders || 0}</span></td>
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function generateReport(type) {
    if (type === 'pdf') {
        showToast('PDF report generated! (Demo)');
    } else if (type === 'excel') {
        showToast('Excel report generated! (Demo)');
    }
}

function showToast(message) {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    toastMessage.innerText = message;
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

window.generateReport = generateReport;