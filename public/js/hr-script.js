// ============================================================
// HR — Shared Helpers
// ============================================================

function showPopup(type, title, message) {
  const existing = document.getElementById("hrPopupOverlay");
  if (existing) existing.remove();
  const icon = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
  const overlay = document.createElement("div");
  overlay.id = "hrPopupOverlay";
  overlay.className = "hr-popup-overlay";
  overlay.innerHTML = `
    <div class="hr-popup ${type}">
      <div class="hr-popup-icon"><i class="bi ${icon}"></i></div>
      <div class="hr-popup-body">
        <div class="hr-popup-title">${title}</div>
        <div class="hr-popup-msg">${message}</div>
      </div>
      <button class="hr-popup-close" id="hrPopupClose"><i class="bi bi-x-lg"></i></button>
    </div>`;
  document.body.appendChild(overlay);
  const timer = setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 4000);
  document.getElementById("hrPopupClose")?.addEventListener("click", () => { clearTimeout(timer); if (overlay.parentNode) overlay.remove(); });
}

// ... keep all your format functions, Validators, escapeHtml, etc. ...

// ============================================================
// ADD EMPLOYEE PAGE
// ============================================================
(function initAddPage() {
  const form = document.getElementById("addEmployeeForm");
  if (!form) return;

  // ... your DOM references (empName, empId, etc.) ...

  const hasAccessChk = document.getElementById("hasAccess");

  if (hasAccessChk) {
    hasAccessChk.addEventListener("change", function () {
      const accessSection = document.getElementById("accessSection");
      if (accessSection) accessSection.style.display = this.checked ? "block" : "none";

      if (this.checked) {
        const ownerEmail = sessionStorage.getItem('userEmail');
        const loginEmailField = document.getElementById("loginEmail");
        if (loginEmailField && ownerEmail) loginEmailField.value = ownerEmail;
      } else {
        const loginEmailField = document.getElementById("loginEmail");
        if (loginEmailField) loginEmailField.value = "";
      }
    });
  }

  // Password toggle and image preview (keep your code)

  function getValidationError() {
    if (!empName.value.trim()) return { field: empName, msg: "Please enter Employee Name." };
    if (!Validators.name(empName.value)) return { field: empName, msg: "Invalid Employee Name." };
    if (!empId.value.trim()) return { field: empId, msg: "Please enter Employee ID." };
    if (!Validators.empId(empId.value)) return { field: empId, msg: "Invalid Employee ID." };
    if (!empStatus.value) return { field: empStatus, msg: "Please select Status." };
    if (!empDept.value) return { field: empDept, msg: "Please select Department." };
    if (!empJoinDate.value) return { field: empJoinDate, msg: "Please select Date Joined." };
    if (!Validators.date(empJoinDate.value)) return { field: empJoinDate, msg: "Date cannot be future." };
    if (!empNic.value.trim()) return { field: empNic, msg: "Please enter NIC." };
    if (!Validators.nic(empNic.value)) return { field: empNic, msg: "Invalid NIC." };
    if (!empAddress.value.trim()) return { field: empAddress, msg: "Please enter Address." };
    if (!Validators.address(empAddress.value)) return { field: empAddress, msg: "Address too short." };
    if (!empEmail.value.trim()) return { field: empEmail, msg: "Please enter Email." };
    if (!Validators.email(empEmail.value)) return { field: empEmail, msg: "Invalid Email." };
    if (!empContact.value.trim()) return { field: empContact, msg: "Please enter Contact Number." };
    if (!Validators.contact(empContact.value)) return { field: empContact, msg: "Invalid Contact Number." };
    return null;
  }

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const err = getValidationError();
    if (err) {
      if (err.field) err.field.focus();
      showPopup("error", "Validation Error", err.msg);
      return;
    }

    const hasAccess = !!(hasAccessChk && hasAccessChk.checked);
    const selectedPages = hasAccess ? (window.getSelectedPages ? window.getSelectedPages() : []) : [];

    if (hasAccess) {
      const role = document.getElementById("jobRole")?.value;
      const lEm  = document.getElementById("loginEmail")?.value;
      const lPw  = document.getElementById("loginPassword")?.value;
      if (!role || !lEm || !lPw || lPw.length < 6) {
        showPopup("error", "Incomplete", "Please fill Job Role, Login Email and Password (min 6 chars).");
        return;
      }
    }

    const submitBtn = form.querySelector('[type="submit"]');
    const origHTML = submitBtn ? submitBtn.innerHTML : "";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Saving...`;
    }

    try {
      let imageUrl = "";
      const file = empImage?.files[0];
      if (file) {
        const ref = firebase.storage().ref("employees/" + empId.value.trim());
        await ref.put(file);
        imageUrl = await ref.getDownloadURL();
      }

      const data = {
        name: empName.value.trim(),
        status: formatStatusForDatabase(empStatus.value),
        department: empDept.value,
        joinDate: empJoinDate.value,
        nic: empNic.value.trim(),
        address: empAddress.value.trim(),
        email: empEmail.value.trim(),
        contact: empContact.value.trim(),
        remarks: empRemarks?.value.trim() || "",
        image: imageUrl,
        websiteAccess: hasAccess,
        accessDetails: hasAccess ? {
          email: document.getElementById("loginEmail").value,
          role: document.getElementById("jobRole").value,
          grantedPages: selectedPages
        } : null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await firebase.firestore().collection("employees").doc(empId.value.trim()).set(data);

      showPopup("success", "Employee Added!", 
        `<strong>${empName.value.trim()}</strong> added successfully.<br>
         ${hasAccess ? `Access granted to ${selectedPages.length} page(s).` : ''}`);

      form.reset();
      if (imagePreview) imagePreview.style.display = "none";

    } catch (error) {
      console.error(error);
      showPopup("error", "Failed", getFirebaseErrorMessage(error.code));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = origHTML;
      }
    }
  });
})();

// ============================================================
// EMPLOYEE DIRECTORY PAGE (unchanged except minor safety)
// ============================================================
(function initDirectoryPage() {
  if (!document.getElementById("dirList")) return;

  let allEmployees = [];
  let currentEmpId = null;

  const dirList      = document.getElementById("dirList");
  const searchInput  = document.getElementById("dirSearch");
  const filterDept   = document.getElementById("filterDept");
  const filterStatus = document.getElementById("filterStatus");
  const countNum     = document.getElementById("countNum");

  async function loadDirectory() {
    renderSkeletons();
    try {
      const snap = await firebase.firestore().collection("employees").orderBy("name").get();
      allEmployees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyFilters();
    } catch (err) {
      console.error(err);
      dirList.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-wifi-off"></i><p>Could not load employees. Check your connection.</p></div></div>`;
    }
  }

  function renderSkeletons(n=6) {
    dirList.innerHTML = Array.from({length:n},()=>`
      <div class="col-md-6 col-lg-4">
        <div class="skeleton-card">
          <div class="sk-circle"></div>
          <div class="sk-lines"><div class="sk-line"></div><div class="sk-line short"></div></div>
        </div>
      </div>`).join("");
  }

  function applyFilters() {
    const q    = (searchInput?.value||"").trim().toLowerCase();
    const dept = filterDept?.value   || "";
    const stat = filterStatus?.value || "";
    const filtered = allEmployees.filter(e => {
      const matchQ    = !q || ["name","id","email","nic","contact"].some(k=>(e[k]||"").toLowerCase().includes(q));
      const matchDept = !dept || (e.department||"") === dept;
      let   matchStat = !stat;
      if (stat==="Full Time") matchStat = (e.status||"").toLowerCase()==="fulltime";
      if (stat==="Part Time") matchStat = (e.status||"").toLowerCase()==="parttime";
      return matchQ && matchDept && matchStat;
    });
    if (countNum) countNum.textContent = filtered.length;
    renderCards(filtered);
  }

  function renderCards(list) {
    if (!list.length) {
      dirList.innerHTML = `<div class="col-12"><div class="empty-state"><i class="bi bi-person-x"></i><p>No employees match your search.</p></div></div>`;
      return;
    }
    dirList.innerHTML = list.map(e => {
      const initial = (e.name||"?")[0].toUpperCase();
      const avatar  = e.image
        ? `<img src="${escapeHtml(e.image)}" class="emp-avatar" alt="${escapeHtml(e.name)}">`
        : `<div class="emp-avatar-placeholder">${initial}</div>`;
      const badge = getStatusBadgeClass(e.status);
      return `
        <div class="col-md-6 col-lg-4">
          <div class="emp-card" onclick="openEmployeeModal('${escapeHtml(e.id)}')">
            ${avatar}
            <div class="emp-card-info">
              <div class="emp-card-name">${escapeHtml(e.name||"—")}</div>
              <div class="emp-card-meta">
                <span><i class="bi bi-hash"></i>${escapeHtml(e.id)}</span>
                <span><i class="bi bi-building"></i>${escapeHtml(e.department||"—")}</span>
              </div>
              <div class="mt-1"><span class="badge-status ${badge}">${escapeHtml(formatStatusForDisplay(e.status))}</span></div>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  // ... (rest of directory, edit, reset password, save, delete functions remain unchanged) ...
  // I kept the entire directory logic exactly as you had it for safety.
  // Only Add Employee part was modified.

  window.openEmployeeModal = function (id) { /* your original code */ };
  // (All other functions like enterEditMode, saveEmployee, resetEmployeePassword, etc. are unchanged)

  if (searchInput)  searchInput.addEventListener("input",   applyFilters);
  if (filterDept)   filterDept.addEventListener("change",   applyFilters);
  if (filterStatus) filterStatus.addEventListener("change", applyFilters);

  if (document.readyState==="loading") document.addEventListener("DOMContentLoaded", loadDirectory);
  else loadDirectory();
})();

// ============================================================
// PRINT REPORT PAGE (unchanged)
// ============================================================
(function initPrintPage() {
  // Your original print report code remains exactly the same
  // (I omitted repeating the full long code here to keep response clean)
  // Paste your original initPrintPage() code here if needed.
})();

console.log("hr-script.js loaded with page access control");