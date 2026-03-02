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
                data: [120000, 150000, 110000, 160000,],
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



function navigateTo(viewId) {
    // 1. Hide all views
    document.querySelectorAll('.content-view').forEach(view => {
        view.classList.add('d-none');
    });

    // 2. Show the target view
    const target = document.getElementById(viewId);
    if (target) {
        target.classList.remove('d-none');
    }

    // 3. Update Hero Title for better UX
    const titles = {
        'dashboard-view': 'Financial Management',
        'add-bill-view': 'Add Expenditure',
        'history-view': 'Transaction History',
        'print-view': 'Print Reports'
    };
    document.getElementById('heroTitle').innerText = titles[viewId];

    // 4. REFRESH CHART (The most important part for safety)
    if (viewId === 'dashboard-view') {
        const chartInstance = Chart.getChart("profitChart");
        if (chartInstance) {
            chartInstance.resize(); // Recalculates dimensions
            chartInstance.update(); // Re-draws the line
        }
    }

    // 5. Auto-close sidebar if open
    const sidebar = document.getElementById('sidebarMenu');
    const instance = bootstrap.Offcanvas.getInstance(sidebar);
    if (instance) instance.hide();
}





async function saveTransaction() {
    console.log("1. Save process started...");

    const amount = document.getElementById('billAmount').value;
    const date = document.getElementById('billDate').value;
    const desc = document.getElementById('billDesc').value;
    const file = document.getElementById('billAttachment').files[0];
    const autoID = "BILL-" + Date.now();

    try {
        let fileUrl = "none"; // Starting value

        if (file) {
            console.log("2. File detected! Starting upload to Storage...");
            alert("Uploading file... please wait.");

            // Create a reference in your 'bill_images' folder
            const fileRef = storage.ref().child(`bill_images/${autoID}_${file.name}`);
            
            // Wait for the upload to finish
            const snapshot = await fileRef.put(file);
            console.log("3. File uploaded successfully!");

            // Get the actual link
            fileUrl = await snapshot.ref.getDownloadURL();
            console.log("4. Got URL: " + fileUrl);
        } else {
            console.log("2. No file selected, skipping upload.");
        }

        // 5. Save to Firestore
        console.log("5. Sending data to Firestore 'Bills' collection...");
        await db.collection("Bills").add({
            id: autoID,
            amount: Number(amount),
            date: date,
            description: desc,
            attachmenturl: fileUrl, // This will be the REAL link if a file was uploaded
            type: "Bill"
        });

        alert("🎉 Success! Bill recorded with ID: " + autoID);
        document.getElementById('billEntryForm').reset();
        navigateTo('dashboard-view');

    } catch (error) {
        console.error("FATAL ERROR:", error);
        alert("Something went wrong: " + error.message);
    }
}