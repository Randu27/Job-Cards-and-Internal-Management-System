// 1. Initialize Inventory (Try to load from localStorage, otherwise use defaults)
let inventory = JSON.parse(localStorage.getItem('grafixStock')) || [
    { name: "A4 Glossy Paper", qty: 500 },
    { name: "Cyan Ink", qty: 12 }
];

// 2. Load the table as soon as the page opens
document.addEventListener('DOMContentLoaded', renderTable);

function renderTable() {
    const tableBody = document.getElementById('stockTableBody');
    tableBody.innerHTML = ''; 

    inventory.forEach((item, index) => {
        const statusClass = item.qty > 50 ? 'bg-success' : 'bg-danger';
        const statusText = item.qty > 50 ? 'Healthy' : 'Low Stock';
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="fw-bold">${item.name}</td>
            <td>${item.qty}</td>
            <td><span class="badge ${statusClass}">${statusText}</span></td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger" onclick="deleteItem(${index})">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// 3. Main function to Add or Update stock
function updateStock() {
    const nameInput = document.getElementById('materialName');
    const qtyInput = document.getElementById('materialQty');
    const name = nameInput.value.trim();
    const qty = parseInt(qtyInput.value);

    if (!name || isNaN(qty)) {
        alert("Please enter a valid material and quantity.");
        return;
    }

    // Check if item already exists
    const itemIndex = inventory.findIndex(i => i.name.toLowerCase() === name.toLowerCase());

    if (itemIndex > -1) {
        // Update existing
        inventory[itemIndex].qty += qty;
        addLog(`Stock Increased: ${name} (+${qty})`, 'text-primary');
    } else {
        // Add new
        inventory.push({ name: name, qty: qty });
        addLog(`New Resource Added: ${name}`, 'text-success');
    }

    saveAndRefresh();
    
    // UI Cleanup
    nameInput.value = "";
    qtyInput.value = "1";
}

// 4. Delete functionality
function deleteItem(index) {
    if (confirm(`Are you sure you want to delete ${inventory[index].name}?`)) {
        addLog(`Removed: ${inventory[index].name}`, 'text-danger');
        inventory.splice(index, 1);
        saveAndRefresh();
    }
}

// 5. Helper: Save to LocalStorage and update UI
function saveAndRefresh() {
    localStorage.setItem('grafixStock', JSON.stringify(inventory));
    renderTable();
}

// 6. Helper: Add Activity Log entry
function addLog(message, textColor) {
    const log = document.getElementById('activityLog');
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (log.innerText.includes("No recent updates")) log.innerHTML = "";
    
    const entry = document.createElement('div');
    entry.className = `log-entry ${textColor}`;
    entry.innerHTML = `<strong>${time}</strong>: ${message}`;
    log.prepend(entry);
}

// 7. Search Filter
function filterStock() {
    const term = document.getElementById('stockSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#stockTableBody tr');
    
    rows.forEach(row => {
        const name = row.cells[0].innerText.toLowerCase();
        row.style.display = name.includes(term) ? '' : 'none';
    });
}