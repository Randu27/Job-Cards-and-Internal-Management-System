document.addEventListener('DOMContentLoaded', function() {
    // 1. Set the Date Range Text
    const dateRangeElement = document.getElementById('dateRangeText');
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    dateRangeElement.innerText = `Showing data from: ${thirtyDaysAgo.toLocaleDateString(undefined, options)} to ${today.toLocaleDateString(undefined, options)}`;

    // 2. Initialize the Live Chart
    const ctx = document.getElementById('profitChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Income (LKR)',
                data: [120000, 150000, 110000, 160000],
                borderColor: '#18bc9c',
                backgroundColor: 'rgba(24, 188, 156, 0.1)',
                fill: true,
                tension: 0.4
            }, {
                label: 'Outgoings (LKR)',
                data: [40000, 60000, 35000, 50000],
                borderColor: '#e74a3b',
                backgroundColor: 'rgba(231, 74, 59, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
});