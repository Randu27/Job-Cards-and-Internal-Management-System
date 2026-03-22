let customers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadFeedback();
});

function loadFeedback() {
    const db = firebase.firestore();
    const tableBody = document.getElementById('feedbackTableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center py-4">Loading feedback...<\/td><\/tr>';
    
    db.collection('customers').orderBy('dateAdded', 'desc').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        renderFeedbackTable();
    }).catch((error) => {
        console.error('Error loading feedback:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error loading data<\/td><\/tr>';
    });
}

function renderFeedbackTable() {
    const tableBody = document.getElementById('feedbackTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    if (customers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No feedback data available<\/td><\/tr>';
        return;
    }
    
    customers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <div class="customer-avatar me-2">${getAvatar(c.name)}</div>
                    <div class="fw-bold">${c.name || '—'}</div>
                </div>
            </td>
            <td>${c.company || '—'}</td>
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td>
            <td><span class="badge bg-primary bg-opacity-10 text-primary">${c.orders || 0} orders</span></td>
            <td><span class="badge bg-secondary">${c.type || 'Regular'}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function getAvatar(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}