/* ================================================================
   resource.js — Grafix Print Hub | Resource Coordination
   Location: public/js/resource.js
   Depends on: firebase-config.js, firebase SDKs, emailjs, jsPDF
   ================================================================ */

const EMAILJS_SERVICE_ID  = "service_vegoayv";
const EMAILJS_TEMPLATE_ID = "template_9zt9uqj";
const EMAILJS_PUBLIC_KEY  = "4QLPsopzRof8LrR3S";

const STOCK_COLLECTION = "stock";
let stockDB;
let allDocs = [];
let emailAlertSentFor = new Set();

emailjs.init(EMAILJS_PUBLIC_KEY);

/* ================================================================
   UTILITIES
   ================================================================ */

/* ── Toast ── */
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast-msg toast-${type}`;
    const iconMap = {
        success: 'check-circle',
        warning: 'exclamation-triangle',
        danger:  'x-circle',
        info:    'info-circle'
    };
    toast.innerHTML = `<i class="bi bi-${iconMap[type] || 'info-circle'} me-2"></i>${message}`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

/* ── Loading Overlay ── */
function showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('show', show);
}

/* ── Status Badge ── */
function statusBadge(qty) {
    return qty > 50
        ? `<span class="badge bg-success">Healthy</span>`
        : `<span class="badge bg-danger">Low Stock</span>`;
}

/* ── Activity Log ── */
function addLog(message, textColor = 'text-dark') {
    const log = document.getElementById('activityLog');
    if (log.innerText.includes("No recent updates")) log.innerHTML = "";
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const entry = document.createElement('div');
    entry.className = `log-entry ${textColor}`;
    entry.innerHTML = `<strong>${time}</strong>: ${message}`;
    log.prepend(entry);
}

/* ================================================================
   LOW STOCK — BANNER + AUTO EMAIL
   ================================================================ */
function checkLowStock(docs) {
    const lowItems = docs.filter(d => d.data().qty <= 50);
    const banner   = document.getElementById('lowStockBanner');
    const list     = document.getElementById('lowStockList');

    if (lowItems.length > 0) {
        list.textContent = ' ' + lowItems.map(d => `${d.data().name} (${d.data().qty} left)`).join(', ');
        banner.classList.add('show');
    } else {
        banner.classList.remove('show');
    }

    // Only send email for newly low items (not already alerted)
    const newLowItems = lowItems.filter(d => !emailAlertSentFor.has(d.id));
    if (newLowItems.length > 0) {
        newLowItems.forEach(d => emailAlertSentFor.add(d.id));
        sendLowStockEmail(false, newLowItems);
    }
    // Clear alert flag once stock is back above 50
    docs.filter(d => d.data().qty > 50).forEach(d => emailAlertSentFor.delete(d.id));
}

async function sendLowStockEmail(manual = false, specificItems = null) {
    const lowItems = specificItems || allDocs.filter(d => d.data().qty <= 50);
    if (lowItems.length === 0) {
        if (manual) showToast('No low stock items found! All stock is healthy.', 'success');
        return;
    }
    const itemsList = lowItems.map(d => `• ${d.data().name}: ${d.data().qty} units remaining`).join('\n');
    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            low_stock_items: itemsList,
            date:  new Date().toLocaleString(),
            email: "noreply@grafixprinthub.com"
        });
        showToast(`Low stock alert sent for ${lowItems.length} item(s)!`, 'warning');
        addLog(`Email alert sent: ${lowItems.length} low stock item(s)`, 'text-warning');
    } catch (err) {
        console.error("EmailJS error:", err);
        showToast('Failed to send email. Check console for details.', 'danger');
        addLog('Email send failed – check console', 'text-danger');
    }
}

/* ================================================================
   CRUD OPERATIONS
   ================================================================ */

/* ── CREATE / UPDATE ── */
async function updateStock() {
    const nameInput = document.getElementById('materialName');
    const qtyInput  = document.getElementById('materialQty');
    const name = nameInput.value.trim();
    const qty  = parseInt(qtyInput.value);

    if (!name || isNaN(qty) || qty < 1) {
        alert("Please enter a valid material name and a positive quantity.");
        return;
    }
    showLoading(true);
    try {
        const snapshot = await stockDB.collection(STOCK_COLLECTION)
            .where("nameLower", "==", name.toLowerCase()).get();

        if (!snapshot.empty) {
            const docRef     = snapshot.docs[0].ref;
            const currentQty = snapshot.docs[0].data().qty;
            await docRef.update({
                qty: currentQty + qty,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            addLog(`Stock increased: ${name} (+${qty})`, 'text-primary');
            showToast(`${name} updated (+${qty})`, 'success');
        } else {
            await stockDB.collection(STOCK_COLLECTION).add({
                name,
                nameLower: name.toLowerCase(),
                qty,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            addLog(`New resource added: ${name} (${qty})`, 'text-success');
            showToast(`${name} added to inventory!`, 'success');
        }
        nameInput.value = "";
        qtyInput.value  = "1";
    } catch (err) {
        console.error("updateStock error:", err);
        alert("Failed to update stock: " + err.message);
    } finally {
        showLoading(false);
    }
}

/* ── READ / Render ── */
function renderTable(docs) {
    allDocs = docs;
    checkLowStock(docs);
    const tbody = document.getElementById('stockTableBody');
    tbody.innerHTML = '';

    if (docs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No stock items yet. Add one above!</td></tr>`;
        return;
    }

    docs.forEach(doc => {
        const { name, qty } = doc.data();
        const safeName = name.replace(/'/g, "\\'");
        const row = document.createElement('tr');
        row.dataset.id   = doc.id;
        row.dataset.name = name;
        row.innerHTML = `
            <td class="fw-semibold">${name}</td>
            <td>${qty}</td>
            <td>${statusBadge(qty)}</td>
            <td>
                <div class="action-btn-group">
                    <button class="btn btn-sm btn-outline-info"    title="View"
                            onclick="viewItem('${doc.id}')">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-warning" title="Edit"
                            onclick="openEdit('${doc.id}', '${safeName}', ${qty})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger"  title="Delete"
                            onclick="deleteItem('${doc.id}', '${safeName}')">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>`;
        tbody.appendChild(row);
    });
}

/* ── Real-time Listener ── */
function startRealtimeListener() {
    stockDB.collection(STOCK_COLLECTION).onSnapshot(
        snapshot => {
            renderTable(snapshot.docs);
            document.getElementById('syncStatus').innerHTML =
                `<i class="bi bi-cloud-check me-1"></i>Synced with Firebase`;
        },
        error => {
            console.error("Listener error:", error);
            document.getElementById('syncStatus').innerHTML =
                `<i class="bi bi-cloud-slash me-1"></i>Sync error`;
        }
    );
}

/* ── VIEW ── */
function viewItem(docId) {
    const doc = allDocs.find(d => d.id === docId);
    if (!doc) return;
    const { name, qty, updatedAt } = doc.data();
    document.getElementById('viewName').textContent    = name;
    document.getElementById('viewQty').textContent     = qty;
    document.getElementById('viewStatus').innerHTML    = statusBadge(qty);
    document.getElementById('viewDocId').textContent   = docId;
    document.getElementById('viewUpdated').textContent =
        updatedAt ? updatedAt.toDate().toLocaleString() : 'Not recorded';
    new bootstrap.Modal(document.getElementById('viewModal')).show();
}

/* ── EDIT ── */
function openEdit(docId, name, qty) {
    document.getElementById('editDocId').value = docId;
    document.getElementById('editName').value  = name;
    document.getElementById('editQty').value   = qty;
    new bootstrap.Modal(document.getElementById('editModal')).show();
}

async function saveEdit() {
    const docId   = document.getElementById('editDocId').value;
    const newName = document.getElementById('editName').value.trim();
    const newQty  = parseInt(document.getElementById('editQty').value);

    if (!newName || isNaN(newQty) || newQty < 0) {
        alert("Please enter a valid name and quantity.");
        return;
    }
    showLoading(true);
    try {
        await stockDB.collection(STOCK_COLLECTION).doc(docId).update({
            name:      newName,
            nameLower: newName.toLowerCase(),
            qty:       newQty,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        addLog(`Edited: ${newName} → qty ${newQty}`, 'text-warning');
        showToast(`${newName} updated successfully!`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
    } catch (err) {
        console.error("saveEdit error:", err);
        alert("Failed to save changes: " + err.message);
    } finally {
        showLoading(false);
    }
}

/* ── DELETE ── */
async function deleteItem(docId, name) {
    if (!confirm(`Remove "${name}" from inventory?`)) return;
    showLoading(true);
    try {
        await stockDB.collection(STOCK_COLLECTION).doc(docId).delete();
        addLog(`Removed: ${name}`, 'text-danger');
        showToast(`${name} removed from inventory`, 'danger');
    } catch (err) {
        console.error("deleteItem error:", err);
        alert("Failed to delete: " + err.message);
    } finally {
        showLoading(false);
    }
}

/* ── SEARCH ── */
function filterStock() {
    const term = document.getElementById('stockSearch').value.toLowerCase();
    document.querySelectorAll('#stockTableBody tr').forEach(row => {
        row.style.display = (row.dataset.name || "").toLowerCase().includes(term) ? '' : 'none';
    });
}

/* ================================================================
   PDF EXPORT — Enhanced Print Resource Record
   ================================================================ */
function exportPDF() {
    if (allDocs.length === 0) { alert("No stock data to export!"); return; }

    const { jsPDF } = window.jspdf;
    const doc   = new jsPDF();
    const pageW = doc.internal.pageSize.width;
    const pageH = doc.internal.pageSize.height;

    const C = {
        darkBg:     [44,  62,  80],
        yellow:     [255, 231, 133],
        white:      [255, 255, 255],
        lightGray:  [248, 249, 250],
        midGray:    [220, 220, 220],
        textDark:   [44,  62,  80],
        textMid:    [100, 116, 139],
        green:      [25,  135, 84],
        greenLight: [209, 231, 221],
        red:        [220, 53,  69],
        redLight:   [248, 215, 218],
        amber:      [133, 100, 4],
        amberLight: [255, 243, 205],
        blue:       [13,  110, 253],
        blueLight:  [207, 226, 255],
    };

    /* ── PAGE 1: Cover + Summary ── */
    doc.setFillColor(...C.darkBg);
    doc.rect(0, 0, pageW, 45, 'F');
    doc.setFillColor(...C.yellow);
    doc.rect(0, 45, pageW, 3, 'F');

    doc.setTextColor(...C.yellow);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Grafix Print Hub', 14, 18);

    doc.setTextColor(...C.white);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Print Resource Coordination Record', 14, 28);

    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageW - 14, 28, { align: 'right' });
    doc.text(`Ref: GPH-${Date.now().toString().slice(-6)}`,  pageW - 14, 35, { align: 'right' });

    const total         = allDocs.length;
    const healthy       = allDocs.filter(d => d.data().qty > 50).length;
    const low           = total - healthy;
    const totalUnits    = allDocs.reduce((s, d) => s + d.data().qty, 0);
    const criticalItems = allDocs.filter(d => d.data().qty <= 10);
    const avgQty        = total > 0 ? Math.round(totalUnits / total) : 0;
    const healthPct     = total > 0 ? Math.round((healthy / total) * 100) : 0;

    let y = 58;

    // Section: Inventory Summary
    doc.setFontSize(11); doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.textDark);
    doc.text('Inventory Summary', 14, y);
    y += 6;
    doc.setDrawColor(...C.midGray); doc.setLineWidth(0.3);
    doc.line(14, y, pageW - 14, y);
    y += 6;

    const cardW = (pageW - 28 - 9) / 4;
    [
        { label: 'Total Resources', value: total,                        color: C.blueLight,  text: C.blue  },
        { label: 'Healthy Stock',   value: healthy,                      color: C.greenLight, text: C.green },
        { label: 'Low Stock Items', value: low,                          color: C.redLight,   text: C.red   },
        { label: 'Total Units',     value: totalUnits.toLocaleString(),  color: C.amberLight, text: C.amber },
    ].forEach((card, i) => {
        const x = 14 + i * (cardW + 3);
        doc.setFillColor(...card.color);
        doc.roundedRect(x, y, cardW, 22, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
        doc.setTextColor(...card.text);
        doc.text(String(card.value), x + cardW / 2, y + 12, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
        doc.text(card.label, x + cardW / 2, y + 19, { align: 'center' });
    });
    y += 30;

    // Section: Executive Summary
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.setTextColor(...C.textDark);
    doc.text('Executive Summary', 14, y);
    y += 5;
    doc.line(14, y, pageW - 14, y);
    y += 5;
    doc.setFillColor(...C.lightGray);
    doc.roundedRect(14, y, pageW - 28, 30, 2, 2, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.setTextColor(...C.textDark);
    [
        `This report covers ${total} print resource(s) currently tracked in the Grafix Print Hub inventory system.`,
        `Of these, ${healthy} item(s) (${healthPct}%) are at healthy stock levels (above 50 units), while ${low} item(s) require`,
        `restocking attention. The total available unit count across all resources stands at ${totalUnits.toLocaleString()} units,`,
        `with an average of ${avgQty} units per resource. ${criticalItems.length > 0 ? `${criticalItems.length} item(s) are critically low (≤10 units) and need urgent action.` : 'No items are critically low at this time.'}`,
    ].forEach((line, i) => doc.text(line, 18, y + 7 + i * 6));
    y += 38;

    // Section: Stock Health Breakdown
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.setTextColor(...C.textDark);
    doc.text('Stock Health Breakdown', 14, y);
    y += 5;
    doc.line(14, y, pageW - 14, y);
    y += 6;

    doc.setFillColor(...C.midGray);
    doc.roundedRect(14, y, pageW - 28, 6, 2, 2, 'F');
    if (healthPct > 0) {
        doc.setFillColor(...C.green);
        doc.roundedRect(14, y, ((pageW - 28) * healthPct) / 100, 6, 2, 2, 'F');
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.setTextColor(...C.green);
    doc.text(`${healthPct}% Healthy`, 16, y + 4.5);
    doc.setTextColor(...C.red);
    doc.text(`${100 - healthPct}% Low`, pageW - 16, y + 4.5, { align: 'right' });
    y += 12;

    [
        { label: 'Critical (≤ 10 units)',     items: allDocs.filter(d => d.data().qty <= 10),                        bg: C.redLight,   text: C.red,   badge: 'CRITICAL' },
        { label: 'Low Stock (11 – 50 units)',  items: allDocs.filter(d => d.data().qty > 10 && d.data().qty <= 50),  bg: C.amberLight, text: C.amber, badge: 'LOW'      },
        { label: 'Healthy Stock (> 50 units)', items: allDocs.filter(d => d.data().qty > 50),                        bg: C.greenLight, text: C.green, badge: 'OK'       },
    ].forEach(cat => {
        if (cat.items.length === 0) return;
        const rowH = 8 + cat.items.length * 6;
        doc.setFillColor(...cat.bg);
        doc.roundedRect(14, y, pageW - 28, rowH, 2, 2, 'F');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
        doc.setTextColor(...cat.text);
        doc.text(`[${cat.badge}]  ${cat.label} — ${cat.items.length} item(s)`, 18, y + 6);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
        cat.items.forEach((d, i) => {
            const { name, qty } = d.data();
            doc.setTextColor(...C.textDark);
            doc.text(`• ${name}`, 22, y + 12 + i * 6);
            doc.text(`${qty} units`, pageW - 18, y + 12 + i * 6, { align: 'right' });
        });
        y += rowH + 4;
    });

    y += 2;
    if (y > pageH - 50) { doc.addPage(); y = 20; }

    // Section: Supervisor Recommendations
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.setTextColor(...C.textDark);
    doc.text('Supervisor Recommendations', 14, y);
    y += 5;
    doc.line(14, y, pageW - 14, y);
    y += 5;

    const recs = [];
    if (criticalItems.length > 0) recs.push(`URGENT: ${criticalItems.map(d => d.data().name).join(', ')} ${criticalItems.length === 1 ? 'is' : 'are'} critically low (≤10 units). Place an emergency restock order immediately.`);
    if (low > 0 && criticalItems.length < low) recs.push(`${low - criticalItems.length} item(s) are below the 50-unit threshold. Schedule a restock order within the next 3–5 business days.`);
    if (healthPct === 100) recs.push('All resources are at healthy levels. Continue monitoring weekly to maintain optimal stock.');
    if (avgQty < 50) recs.push(`Average stock per resource is ${avgQty} units, which is below the recommended threshold. Consider increasing minimum order quantities.`);
    recs.push('Review the full item table on the following page for individual stock details and last-updated timestamps.');
    recs.push('Set up automated purchase orders for items that regularly fall below 50 units to reduce manual intervention.');

    doc.setFillColor(255, 248, 230);
    doc.roundedRect(14, y, pageW - 28, 8 + recs.length * 9, 2, 2, 'F');
    doc.setFillColor(...C.amber);
    doc.rect(14, y, 3, 8 + recs.length * 9, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    recs.forEach((rec, i) => {
        const isCritical = rec.startsWith('URGENT');
        doc.setTextColor(isCritical ? C.red[0] : C.textDark[0], isCritical ? C.red[1] : C.textDark[1], isCritical ? C.red[2] : C.textDark[2]);
        doc.setFont('helvetica', isCritical ? 'bold' : 'normal');
        doc.text(doc.splitTextToSize(`${i + 1}. ${rec}`, pageW - 36), 20, y + 7 + i * 9);
    });

    /* ── PAGE 2: Full Item Table ── */
    doc.addPage();
    doc.setFillColor(...C.darkBg);
    doc.rect(0, 0, pageW, 20, 'F');
    doc.setFillColor(...C.yellow);
    doc.rect(0, 20, pageW, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.setTextColor(...C.yellow);
    doc.text('Grafix Print Hub', 14, 13);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.setTextColor(...C.white);
    doc.text('Full Resource Inventory — Detailed Record', pageW - 14, 13, { align: 'right' });

    doc.autoTable({
        startY: 28,
        head: [['#', 'Resource Name', 'Qty', 'Status', 'Last Updated', 'Flag']],
        body: allDocs.map((d, i) => {
            const { name, qty, updatedAt } = d.data();
            let statusLabel, urgency;
            if      (qty <= 10) { statusLabel = 'Critical';  urgency = '!!!'; }
            else if (qty <= 50) { statusLabel = 'Low Stock'; urgency = '!';   }
            else                { statusLabel = 'Healthy';   urgency = '';     }
            return [i + 1, name, qty, statusLabel, updatedAt ? updatedAt.toDate().toLocaleDateString() : 'N/A', urgency];
        }),
        headStyles: { fillColor: C.darkBg, textColor: C.yellow, fontStyle: 'bold', fontSize: 9, cellPadding: 4 },
        bodyStyles: { fontSize: 8.5, textColor: C.textDark, cellPadding: 3.5 },
        alternateRowStyles: { fillColor: C.lightGray },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'center' },
            5: { halign: 'center', cellWidth: 12 },
        },
        didParseCell: (data) => {
            if (data.section !== 'body') return;
            const status = data.row.raw[3];
            if (data.column.index === 3) {
                if (status === 'Critical')  { data.cell.styles.textColor = C.red;   data.cell.styles.fontStyle = 'bold'; }
                if (status === 'Low Stock') { data.cell.styles.textColor = C.amber; data.cell.styles.fontStyle = 'bold'; }
                if (status === 'Healthy')   { data.cell.styles.textColor = C.green; data.cell.styles.fontStyle = 'bold'; }
            }
            if (data.column.index === 5) {
                data.cell.styles.textColor = C.red;
                data.cell.styles.fontStyle = 'bold';
            }
        }
    });

    const tableEndY = doc.lastAutoTable.finalY + 8;
    doc.setFillColor(...C.lightGray);
    doc.roundedRect(14, tableEndY, pageW - 28, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    doc.setTextColor(...C.textMid);
    doc.text('Note: Stock levels marked "Critical" (≤10 units) or "Low Stock" (≤50 units) require restocking action.', 18, tableEndY + 5);
    doc.text('!!! = Critical  |  ! = Low  |  (blank) = Healthy. Threshold for healthy stock: > 50 units.',             18, tableEndY + 11);

    // Footer on every page
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(...C.darkBg);
        doc.rect(0, pageH - 12, pageW, 12, 'F');
        doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        doc.setTextColor(...C.yellow);
        doc.text('Grafix Print Hub — Confidential Print Resource Record', 14, pageH - 4.5);
        doc.setTextColor(180, 180, 180);
        doc.text(`Page ${i} of ${totalPages}`, pageW - 14, pageH - 4.5, { align: 'right' });
    }

    doc.save(`GrafixPrintHub_PrintRecord_${new Date().toISOString().slice(0, 10)}.pdf`);
    addLog('Print Resource Record downloaded', 'text-danger');
    showToast('Print record PDF downloaded!', 'success');
}

/* ================================================================
   INIT
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
    try {
        stockDB = firebase.firestore();
        startRealtimeListener();
    } catch (e) {
        console.error("Firebase init error:", e);
        document.getElementById('syncStatus').innerHTML =
            `<i class="bi bi-exclamation-triangle me-1"></i>Firebase not configured`;
        document.getElementById('stockTableBody').innerHTML =
            `<tr><td colspan="4" class="text-center text-danger py-3">
                Firebase config error – check firebase-config.js</td></tr>`;
    }
});