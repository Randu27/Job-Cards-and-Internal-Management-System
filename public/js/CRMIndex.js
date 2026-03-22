let customers = [];

document.addEventListener('DOMContentLoaded', function() {
    loadCustomers();
});

function loadCustomers() {
    const db = firebase.firestore();
    db.collection('customers').orderBy('dateAdded', 'desc').get().then((snapshot) => {
        customers = [];
        snapshot.forEach(doc => {
            customers.push({ id: doc.id, ...doc.data() });
        });
        updateDashboard();
    }).catch((error) => {
        console.error('Error loading customers:', error);
        document.getElementById('recentCustomersTable').innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error loading data</td></tr>';
    });
}

function updateDashboard() {
    const totalCustomers = customers.length;
    const fiveStarFeedbacks = customers.filter(c => c.feedback && c.feedback.includes('5')).length;
    const newCustomers = customers.filter(c => c.type === 'New').length;
    const avgRating = calculateAverageRating();
    
    document.getElementById('totalCustomers').innerText = totalCustomers;
    document.getElementById('newFeedbacks').innerText = fiveStarFeedbacks;
    document.getElementById('profileCount').innerText = totalCustomers + ' profiles';
    document.getElementById('newProfileCount').innerText = newCustomers + ' new';
    document.getElementById('feedbackCount').innerText = customers.length + ' feedbacks';
    document.getElementById('avgRating').innerHTML = avgRating + ' ★ avg';
    
    renderRecentCustomers();
}

function calculateAverageRating() {
    if (customers.length === 0) return '0.0';
    let total = 0;
    customers.forEach(c => {
        if (c.feedback) {
            const rating = parseInt(c.feedback.charAt(0));
            total += rating;
        }
    });
    return (total / customers.length).toFixed(1);
}

function renderRecentCustomers() {
    const tableBody = document.getElementById('recentCustomersTable');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    const recentCustomers = customers.slice(0, 5);
    
    if (recentCustomers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No customers found</td></tr>';
        return;
    }
    
    recentCustomers.forEach(c => {
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
        `;
        tableBody.appendChild(row);
    });
}

function getAvatar(name) {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}