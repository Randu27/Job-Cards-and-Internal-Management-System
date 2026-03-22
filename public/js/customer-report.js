let customers = [];
let db = null;

document.addEventListener('DOMContentLoaded', function() {
    // Check if Firebase is available
    if (typeof firebase === 'undefined') {
        document.getElementById('previewTableBody').innerHTML = '<tr><td colspan="7" class="text-center text-danger">Firebase not loaded. Please check your internet connection.</td></tr>';
        return;
    }
    
    db = firebase.firestore();
    loadCustomers();
});

function loadCustomers() {
    const tableBody = document.getElementById('previewTableBody');
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div><br>Loading customers...</td></tr>';
    
    db.collection('customers').orderBy('dateAdded', 'desc').get()
        .then((snapshot) => {
            customers = [];
            snapshot.forEach(doc => {
                customers.push({ id: doc.id, ...doc.data() });
            });
            renderPreviewTable();
            updateStats();
        })
        .catch((error) => {
            console.error('Error loading customers:', error);
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Error loading data: ' + error.message + '</td></tr>';
        });
}

function renderPreviewTable() {
    const tableBody = document.getElementById('previewTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    const recentCustomers = customers.slice(0, 10);
    
    if (recentCustomers.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">No customers found</td></tr>';
        return;
    }
    
    recentCustomers.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${c.name || '—'}</strong><br><small class="text-muted">${c.type || 'Regular'}</small></td>
            <td>${c.company || '—'}</td>
            <td>${c.email || '—'}</td>
            <td>${c.phone || '—'}</td>
            <td><span class="badge bg-primary bg-opacity-10 text-primary">${c.orders || 0}</span></td>
            <td><span class="feedback-badge"><i class="bi bi-star-fill text-warning"></i> ${c.feedback || '5 ★'}</span></td>
            <td><span class="badge bg-secondary">${c.type || 'Regular'}</span></td>
        `;
        tableBody.appendChild(row);
    });
}

function updateStats() {
    const totalCustomers = customers.length;
    let totalRating = 0;
    let totalOrders = 0;
    let vipCount = 0;
    
    customers.forEach(c => {
        if (c.feedback) {
            const rating = parseInt(c.feedback.charAt(0));
            totalRating += rating;
        }
        totalOrders += (c.orders || 0);
        if (c.type === 'VIP') vipCount++;
    });
    
    const avgRating = totalCustomers > 0 ? (totalRating / totalCustomers).toFixed(1) : '0.0';
    
    document.getElementById('totalCountStat').innerText = totalCustomers;
    document.getElementById('avgRatingStat').innerText = avgRating;
    document.getElementById('totalOrdersStat').innerText = totalOrders;
    document.getElementById('vipCountStat').innerText = vipCount;
}

// Generate PDF Report
function generatePDF() {
    showToast('PDF report is being generated...', 'info');
    
    // Create a printable HTML content
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Customer Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #1a2c3e; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                th { background-color: #1a2c3e; color: white; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
            </style>
        </head>
        <body>
            <h1>Customer Report - Grafix Print Hub</h1>
            <p>Generated on: ${new Date().toLocaleString()}</p>
            
            <div class="summary">
                <strong>Summary:</strong><br>
                Total Customers: ${customers.length}<br>
                Total Orders: ${document.getElementById('totalOrdersStat').innerText}<br>
                Average Rating: ${document.getElementById('avgRatingStat').innerText}<br>
                VIP Customers: ${document.getElementById('vipCountStat').innerText}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Customer Name</th>
                        <th>Company</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Orders</th>
                        <th>Feedback</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(c => `
                        <tr>
                            <td>${c.name || '—'}</td>
                            <td>${c.company || '—'}</td>
                            <td>${c.email || '—'}</td>
                            <td>${c.phone || '—'}</td>
                            <td>${c.orders || 0}</td>
                            <td>${c.feedback || '5 ★'}</td>
                            <td>${c.type || 'Regular'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="footer">
                &copy; Grafix Print Hub - CRM System
            </div>
        </body>
        </html>
    `;
    
    // Open print window for PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    setTimeout(() => {
        showToast('PDF report generated successfully!', 'success');
    }, 1000);
}

// Generate Excel Report (CSV format)
function generateExcel() {
    showToast('Excel report is being generated...', 'info');
    
    // Create CSV content
    const headers = ['Customer Name', 'Company', 'Email', 'Phone', 'Orders', 'Feedback', 'Customer Type', 'Address', 'Date Added'];
    const rows = customers.map(c => [
        c.name || '',
        c.company || '',
        c.email || '',
        c.phone || '',
        c.orders || 0,
        c.feedback || '5 ★',
        c.type || 'Regular',
        c.address || '',
        c.dateAdded || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `customer_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
        showToast('Excel report downloaded successfully!', 'success');
    }, 500);
}

// Print Report
function printReport() {
    showToast('Preparing print view...', 'info');
    
    // Create printable HTML
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Customer Report - Grafix Print Hub</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1a2c3e; border-bottom: 2px solid #d4af37; }
                h2 { color: #2c5f6e; margin-top: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #1a2c3e; color: white; }
                .header { text-align: center; margin-bottom: 30px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
                .stats { display: flex; justify-content: space-between; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px; }
                .stat-box { text-align: center; flex: 1; }
                .stat-number { font-size: 24px; font-weight: bold; color: #1a2c3e; }
                .stat-label { font-size: 12px; color: #666; }
                @media print {
                    body { margin: 0; padding: 15px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Grafix Print Hub</h1>
                <h2>Customer Report</h2>
                <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="stats">
                <div class="stat-box">
                    <div class="stat-number">${customers.length}</div>
                    <div class="stat-label">Total Customers</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${document.getElementById('totalOrdersStat').innerText}</div>
                    <div class="stat-label">Total Orders</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${document.getElementById('avgRatingStat').innerText}</div>
                    <div class="stat-label">Average Rating</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">${document.getElementById('vipCountStat').innerText}</div>
                    <div class="stat-label">VIP Customers</div>
                </div>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Customer</th>
                        <th>Company</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Orders</th>
                        <th>Rating</th>
                        <th>Type</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers.map(c => `
                        <tr>
                            <td>${c.name || '—'}</td>
                            <td>${c.company || '—'}</td>
                            <td>${c.email || '—'}</td>
                            <td>${c.phone || '—'}</td>
                            <td>${c.orders || 0}</td>
                            <td>${c.feedback || '5 ★'}</td>
                            <td>${c.type || 'Regular'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="footer">
                <p>&copy; Grafix Print Hub - Customer Relationship Management System</p>
                <p>This report was generated automatically by the CRM system.</p>
            </div>
        </body>
        </html>
    `;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    
    setTimeout(() => {
        showToast('Print report opened!', 'success');
    }, 500);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('successToast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toastMessage.innerText = message;
    const colorClass = type === 'danger' ? 'bg-danger' : (type === 'info' ? 'bg-info' : 'bg-success');
    toast.className = `toast align-items-center text-white ${colorClass} border-0`;
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Make functions available globally
window.generatePDF = generatePDF;
window.generateExcel = generateExcel;
window.printReport = printReport;