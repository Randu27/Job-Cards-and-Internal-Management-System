// ===============================
// HR - Add Employee Page
// ===============================

// Shared popup helper (used by both pages)
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
  const timer = setTimeout(() => overlay.remove(), 4000);
  document.getElementById("hrPopupClose").addEventListener("click", () => { clearTimeout(timer); overlay.remove(); });
}

document.addEventListener("DOMContentLoaded", function () {

  // ================================================
  // ADD PAGE — only runs if addEmployeeForm exists
  // ================================================
  if (document.getElementById("addEmployeeForm")) {

  // =========================
  // Get Elements
  // =========================
  const form        = document.getElementById("addEmployeeForm");
  const empName     = document.getElementById("empName");
  const empId       = document.getElementById("empId");
  const empStatus   = document.getElementById("empStatus");
  const empDept     = document.getElementById("empDepartment");
  const empJoinDate = document.getElementById("empJoinDate");
  const empNic      = document.getElementById("empNic");
  const empAddress  = document.getElementById("empAddress");
  const empEmail    = document.getElementById("empEmail");
  const empContact  = document.getElementById("empContact");
  const empRemarks  = document.getElementById("empRemarks");
  const empImage    = document.getElementById("empImage");
  const imagePreview = document.getElementById("imagePreview");

  // =========================
  // Image Preview
  // =========================
  if (empImage && imagePreview) {
    empImage.addEventListener("change", function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          imagePreview.src = e.target.result;
          imagePreview.style.display = "block";
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.style.display = "none";
      }
    });
  }

  // =========================
  // Field-level Validators
  // =========================

  // Name: letters, spaces, dots, hyphens only — min 2 chars
  function isValidName(val) {
    return /^[a-zA-Z\s.\-']{2,}$/.test(val.trim());
  }

  // Employee ID: alphanumeric, 3–15 chars
  function isValidEmpId(val) {
    return /^[a-zA-Z0-9\-_]{3,15}$/.test(val.trim());
  }

  // Sri Lankan NIC:
  //   Old format: 9 digits + V or X  (e.g. 901234567V)
  //   New format: 12 digits           (e.g. 200012345678)
  function isValidNIC(val) {
    const nic = val.trim().toUpperCase();
    return /^[0-9]{9}[VX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
  }

  // Sri Lankan phone: 07X-XXXXXXX or +94X formats
  function isValidContact(val) {
    const cleaned = val.trim().replace(/[\s\-]/g, "");
    return /^(0[1-9][0-9]{7,8}|\+94[1-9][0-9]{8})$/.test(cleaned);
  }

  // Email
  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  // Date joined: must not be in the future
  function isValidDate(val) {
    if (!val) return false;
    const chosen = new Date(val);
    const today  = new Date();
    today.setHours(23, 59, 59, 999);
    return chosen <= today;
  }

  // Address: min 5 chars
  function isValidAddress(val) {
    return val.trim().length >= 5;
  }

  // =========================
  // Validate All Fields
  // =========================
  function getValidationError() {

    // Employee Name
    if (!empName.value.trim())
      return { field: empName, msg: "Please enter the <strong>Employee Name</strong>." };
    if (!isValidName(empName.value))
      return { field: empName, msg: "<strong>Employee Name</strong> should only contain letters, spaces, dots, or hyphens (min 2 characters)." };

    // Employee ID
    if (!empId.value.trim())
      return { field: empId, msg: "Please enter the <strong>Employee ID</strong>." };
    if (!isValidEmpId(empId.value))
      return { field: empId, msg: "<strong>Employee ID</strong> must be 3–15 alphanumeric characters (letters, numbers, - or _)." };

    // Status
    if (!empStatus.value)
      return { field: empStatus, msg: "Please select an <strong>Employment Status</strong>." };

    // Department
    if (!empDept.value)
      return { field: empDept, msg: "Please select a <strong>Department</strong>." };

    // Date Joined
    if (!empJoinDate.value)
      return { field: empJoinDate, msg: "Please select the <strong>Date Joined</strong>." };
    if (!isValidDate(empJoinDate.value))
      return { field: empJoinDate, msg: "<strong>Date Joined</strong> cannot be a future date." };

    // NIC
    if (!empNic.value.trim())
      return { field: empNic, msg: "Please enter the <strong>NIC</strong> number." };
    if (!isValidNIC(empNic.value))
      return { field: empNic, msg: "<strong>NIC</strong> must be in old format (9 digits + V/X, e.g. <em>901234567V</em>) or new format (12 digits, e.g. <em>200012345678</em>)." };

    // Address
    if (!empAddress.value.trim())
      return { field: empAddress, msg: "Please enter the <strong>Address</strong>." };
    if (!isValidAddress(empAddress.value))
      return { field: empAddress, msg: "<strong>Address</strong> must be at least 5 characters long." };

    // Email
    if (!empEmail.value.trim())
      return { field: empEmail, msg: "Please enter the <strong>Email</strong> address." };
    if (!isValidEmail(empEmail.value))
      return { field: empEmail, msg: "Please enter a <strong>valid Email</strong> address (e.g. <em>name@example.com</em>)." };

    // Contact
    if (!empContact.value.trim())
      return { field: empContact, msg: "Please enter the <strong>Contact Number</strong>." };
    if (!isValidContact(empContact.value))
      return { field: empContact, msg: "<strong>Contact Number</strong> must be a valid Sri Lankan number (e.g. <em>0771234567</em> or <em>+94771234567</em>)." };

    return null;
  }

  // Highlight the problem field
  function highlightField(field) {
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");
    field.focus();
    field.addEventListener("input", () => field.classList.remove("is-invalid"), { once: true });
  }

  function markValid(field) {
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
  }

  function markInvalid(field) {
    field.classList.remove("is-valid");
    field.classList.add("is-invalid");
  }

  // =========================
  // Real-time blur validation
  // =========================
  empName.addEventListener("blur", () => {
    empName.value.trim() && isValidName(empName.value) ? markValid(empName) : markInvalid(empName);
  });

  empId.addEventListener("blur", () => {
    empId.value.trim() && isValidEmpId(empId.value) ? markValid(empId) : markInvalid(empId);
  });

  empStatus.addEventListener("change", () => {
    empStatus.value ? markValid(empStatus) : markInvalid(empStatus);
  });

  empDept.addEventListener("change", () => {
    empDept.value ? markValid(empDept) : markInvalid(empDept);
  });

  empJoinDate.addEventListener("blur", () => {
    isValidDate(empJoinDate.value) ? markValid(empJoinDate) : markInvalid(empJoinDate);
  });

  empNic.addEventListener("blur", () => {
    isValidNIC(empNic.value) ? markValid(empNic) : markInvalid(empNic);
  });

  empAddress.addEventListener("blur", () => {
    isValidAddress(empAddress.value) ? markValid(empAddress) : markInvalid(empAddress);
  });

  empEmail.addEventListener("blur", () => {
    isValidEmail(empEmail.value) ? markValid(empEmail) : markInvalid(empEmail);
  });

  empContact.addEventListener("blur", () => {
    isValidContact(empContact.value) ? markValid(empContact) : markInvalid(empContact);
  });

  // =========================
  // Firebase Error Messages
  // =========================
  function getFirebaseError(code) {
    const map = {
      "permission-denied":      "You don't have permission to add employees. Please contact your admin.",
      "already-exists":         "An employee with this ID already exists. Please use a unique Employee ID.",
      "unavailable":            "Service is currently unavailable. Please check your internet connection.",
      "storage/unauthorized":   "You are not authorized to upload images.",
      "storage/canceled":       "Image upload was cancelled. Please try again.",
      "storage/unknown":        "An unknown error occurred during image upload.",
    };
    return map[code] || `An unexpected error occurred (${code || "unknown"}). Please try again.`;
  }

  // =========================
  // Form Submit
  // =========================
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    form.classList.remove("was-validated");

    // Client-side validation
    const validationError = getValidationError();
    if (validationError) {
      highlightField(validationError.field);
      showPopup("error", "Missing Information", validationError.msg);
      return;
    }

    // Show loading state on button
    const submitBtn = form.querySelector(".add-btn");
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Saving...`;

    try {
      let imageUrl = "";

      // Upload image if selected
      const file = empImage.files[0];
      if (file) {
        try {
          const storageRef = firebase.storage().ref("employees/" + empId.value.trim());
          await storageRef.put(file);
          imageUrl = await storageRef.getDownloadURL();
        } catch (imgErr) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          showPopup("error", "Image Upload Failed", getFirebaseError(imgErr.code));
          return;
        }
      }

      // Check if employee ID already exists
      const existing = await firebase.firestore().collection("employees").doc(empId.value.trim()).get();
      if (existing.exists) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        highlightField(empId);
        showPopup("error", "Duplicate Employee ID", "An employee with ID <strong>" + empId.value.trim() + "</strong> already exists. Please use a different ID.");
        return;
      }

      // Save to Firestore
      await firebase.firestore().collection("employees").doc(empId.value.trim()).set({
        name:       empName.value.trim(),
        status:     empStatus.value,
        department: empDept.value,
        joinDate:   empJoinDate.value,
        nic:        empNic.value.trim(),
        address:    empAddress.value.trim(),
        email:      empEmail.value.trim(),
        contact:    empContact.value.trim(),
        remarks:    empRemarks.value.trim(),
        image:      imageUrl,
        createdAt:  firebase.firestore.FieldValue.serverTimestamp()
      });

      // Success — capture name before reset clears the form
      const addedName = empName.value.trim();
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      form.reset();
      if (imagePreview) imagePreview.style.display = "none";
      form.classList.remove("was-validated");

      showPopup("success", "Employee Added!", `<strong>${addedName}</strong> has been successfully added to the system.`);

    } catch (error) {
      console.error(error);
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      showPopup("error", "Something Went Wrong", getFirebaseError(error.code));
    }
  });

  } // end ADD PAGE

  // ================================================================
  //  Employee Mnagement
  // ================================================================
  let allEmployees   = [];
  let currentEmpId   = null;
  let currentEmpData = {};
  let currentMode    = 'view'; // 'view' | 'edit'

  // ================================================================
  //  POPUP NOTIFICATION
  // ================================================================
  function showPopup(type, title, msg) {
    document.querySelectorAll('.hr-popup-overlay').forEach(el => el.remove());
    const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';
    const wrap = document.createElement('div');
    wrap.className = 'hr-popup-overlay';
    wrap.innerHTML = `
      <div class="hr-popup ${type}">
        <div class="hr-popup-icon"><i class="bi ${icon}"></i></div>
        <div class="hr-popup-body">
          <div class="hr-popup-title">${title}</div>
          <p class="hr-popup-msg">${msg}</p>
        </div>
        <button class="hr-popup-close" onclick="this.closest('.hr-popup-overlay').remove()">✕</button>
      </div>`;
    document.body.appendChild(wrap);
    setTimeout(() => wrap.remove(), 3800);
  }

  // ================================================================
  //  LOAD ALL EMPLOYEES
  // ================================================================
  async function loadEmployees() {
    try {
      const snapshot = await firebase.firestore().collection('employees').get();
      allEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderList(allEmployees);
    } catch (e) {
      console.error(e);
      document.getElementById('listLoading').innerHTML = `
        <i class="bi bi-wifi-off" style="font-size:2rem;color:#94a3b8;"></i>
        <p style="font-size:0.85rem;color:#94a3b8;margin-top:0.75rem;">Failed to load employees.</p>`;
    }
  }

  // ================================================================
  //  RENDER LIST
  // ================================================================
  function renderList(employees) {
    const list = document.getElementById('empList');

    // Stats
    document.getElementById('statTotal').textContent = employees.length;
    document.getElementById('statFT').textContent = employees.filter(e => e.status === 'FullTime').length;
    document.getElementById('statPT').textContent = employees.filter(e => e.status === 'PartTime').length;

    if (employees.length === 0) {
      list.innerHTML = `
        <div class="list-state">
          <i class="bi bi-person-slash"></i>
          <p style="font-size:0.85rem;">No employees match your filters.</p>
        </div>`;
      return;
    }

    list.innerHTML = employees.map(emp => {
      const initials = emp.name ? emp.name.charAt(0).toUpperCase() : '?';
      const isFT = emp.status === 'FullTime';
      const ptClass = !isFT ? 'pt-card' : '';
      const badge = isFT
        ? `<span class="row-badge ft">Full Time</span>`
        : `<span class="row-badge pt">Part Time</span>`;
      const avatar = emp.image
        ? `<img src="${emp.image}" alt="${emp.name}">`
        : initials;

      return `
        <div class="emp-row-card ${ptClass} ${currentEmpId === emp.id ? 'active' : ''}"
             data-id="${emp.id}" onclick="selectEmployee('${emp.id}')">
          <div class="row-avatar">${avatar}</div>
          <div class="row-info">
            <div class="row-name">${emp.name || '—'}</div>
            <div class="row-meta">
              <span>${emp.id}</span>
              <span>·</span>
              <span>${emp.department || '—'}</span>
            </div>
            ${badge}
          </div>
          <i class="bi bi-chevron-right row-chevron"></i>
        </div>`;
    }).join('');
  }

  // ================================================================
  //  FILTER
  // ================================================================
  function applyFilters() {
    const q     = document.getElementById('listSearch').value.toLowerCase();
    const dept  = document.getElementById('listDeptFilter').value;
    const status= document.getElementById('listStatusFilter').value;

    const filtered = allEmployees.filter(emp => {
      const matchQ = !q ||
        (emp.name && emp.name.toLowerCase().includes(q)) ||
        (emp.id   && emp.id.toLowerCase().includes(q)) ||
        (emp.department && emp.department.toLowerCase().includes(q));
      const matchD = !dept   || emp.department === dept;
      const matchS = !status || emp.status === status;
      return matchQ && matchD && matchS;
    });
    renderList(filtered);
  }

  document.getElementById('listSearch').addEventListener('input', applyFilters);
  document.getElementById('listDeptFilter').addEventListener('change', applyFilters);
  document.getElementById('listStatusFilter').addEventListener('change', applyFilters);

  // ================================================================
  //  SELECT EMPLOYEE
  // ================================================================
  function selectEmployee(id) {
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;

    currentEmpId   = id;
    currentEmpData = { ...emp };
    currentMode    = 'view';

    // Highlight list row
    document.querySelectorAll('.emp-row-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.emp-row-card[data-id="${id}"]`);
    if (card) card.classList.add('active');

    // Show detail card
    document.getElementById('detailEmpty').style.display = 'none';
    const dc = document.getElementById('detailCard');
    dc.style.display = 'flex';
    // Re-trigger animation
    dc.style.animation = 'none';
    void dc.offsetHeight;
    dc.style.animation = '';

    // Populate header
    populateHeader(emp, id);
    // Render view mode content
    renderViewMode(emp, id);
    // Ensure UI is in view mode
    setModeUI('view');
  }

  // ================================================================
  //  POPULATE HEADER
  // ================================================================
  function populateHeader(emp, id) {
    const initials = emp.name ? emp.name.charAt(0).toUpperCase() : '?';
    const avatarEl = document.getElementById('detailAvatar');
    avatarEl.innerHTML = emp.image
      ? `<img src="${emp.image}" alt="${emp.name}">`
      : initials;

    document.getElementById('detailName').textContent = emp.name || '—';
    document.getElementById('detailId').textContent   = `ID: ${id}`;
    document.getElementById('detailDept').textContent = emp.department || '—';

    const isFT = emp.status === 'FullTime';
    document.getElementById('detailStatusBadge').innerHTML = isFT
      ? `<span style="background:rgba(220,252,231,0.25);color:#4ade80;padding:2px 10px;border-radius:99px;font-size:0.72rem;font-weight:700;">● Full Time</span>`
      : `<span style="background:rgba(241,245,249,0.25);color:#cbd5e1;padding:2px 10px;border-radius:99px;font-size:0.72rem;font-weight:700;">● Part Time</span>`;
  }

  // ================================================================
  //  RENDER VIEW MODE
  // ================================================================
  function renderViewMode(emp, id) {
    const isFT = emp.status === 'FullTime';
    const statusHtml = `<span class="status-pill ${isFT ? 'ft' : 'pt'}">
      <span class="dot"></span>${isFT ? 'Full Time' : 'Part Time'}</span>`;

    const v  = (val) => val
      ? `<div class="info-field-value">${val}</div>`
      : `<div class="info-field-value empty">Not provided</div>`;
    const vt = (val) => val
      ? `<div class="info-field-value teal-border">${val}</div>`
      : `<div class="info-field-value teal-border empty">Not provided</div>`;

    document.getElementById('detailContent').innerHTML = `
      <div class="info-sections">
        <!-- Left: Personal -->
        <div>
          <div class="info-section-title violet">
            <span class="dot"></span> Personal Information
          </div>
          <div class="info-field">
            <div class="info-field-label">Full Name</div>
            ${v(emp.name)}
          </div>
          <div class="info-field">
            <div class="info-field-label">Employee ID</div>
            ${v(id)}
          </div>
          <div class="info-field">
            <div class="info-field-label">Status</div>
            <div class="info-field-value" style="background:transparent;border:none;padding:2px 0;">${statusHtml}</div>
          </div>
          <div class="info-field">
            <div class="info-field-label">Department</div>
            ${v(emp.department)}
          </div>
          <div class="info-field">
            <div class="info-field-label">Date Joined</div>
            ${v(emp.joinDate)}
          </div>
          <div class="info-field">
            <div class="info-field-label">NIC</div>
            ${v(emp.nic)}
          </div>
          <div class="info-field">
            <div class="info-field-label">Address</div>
            ${v(emp.address)}
          </div>
        </div>
        <!-- Right: Contact -->
        <div>
          <div class="info-section-title teal">
            <span class="dot"></span> Contact & Details
          </div>
          <div class="info-field">
            <div class="info-field-label">Email</div>
            ${vt(emp.email)}
          </div>
          <div class="info-field">
            <div class="info-field-label">Contact Number</div>
            ${vt(emp.contact)}
          </div>
          <div class="info-field">
            <div class="info-field-label">Remarks</div>
            ${vt(emp.remarks)}
          </div>
        </div>
      </div>`;
  }

  // ================================================================
  //  RENDER EDIT MODE
  // ================================================================
  function renderEditMode(emp, id) {
    document.getElementById('detailContent').innerHTML = `
      <div class="edit-section-title violet" style="margin-bottom:1rem;">
        <span class="dot" style="width:6px;height:6px;border-radius:50%;background:#7c3aed;display:inline-block;"></span>
        Personal Information
      </div>
      <div class="edit-grid" style="margin-bottom:1.5rem;">
        <div>
          <label class="edit-field-label">Full Name</label>
          <input id="eN" class="edit-input" value="${emp.name || ''}" placeholder="Employee Name">
        </div>
        <div>
          <label class="edit-field-label">Employee ID</label>
          <input class="edit-input" value="${id}" readonly>
        </div>
        <div>
          <label class="edit-field-label">Status</label>
          <select id="eSt" class="edit-select">
            <option value="">Select Status</option>
            <option value="FullTime"  ${emp.status === 'FullTime'  ? 'selected' : ''}>Full Time</option>
            <option value="PartTime"  ${emp.status === 'PartTime'  ? 'selected' : ''}>Part Time</option>
          </select>
        </div>
        <div>
          <label class="edit-field-label">Department</label>
          <select id="eDp" class="edit-select">
            <option value="">Select Department</option>
            <option value="front office" ${(emp.department||'').toLowerCase() === 'front office' ? 'selected' : ''}>Front Office</option>
            <option value="Workshop"     ${emp.department === 'Workshop' ? 'selected' : ''}>Workshop</option>
          </select>
        </div>
        <div>
          <label class="edit-field-label">Date Joined</label>
          <input id="eJD" type="date" class="edit-input" value="${emp.joinDate || ''}">
        </div>
        <div>
          <label class="edit-field-label">NIC</label>
          <input id="eNIC" class="edit-input" value="${emp.nic || ''}" placeholder="NIC Number">
        </div>
        <div class="full-row">
          <label class="edit-field-label">Address</label>
          <input id="eAd" class="edit-input" value="${emp.address || ''}" placeholder="Address">
        </div>
      </div>

      <div class="edit-section-title teal" style="margin-bottom:1rem;">
        <span class="dot" style="width:6px;height:6px;border-radius:50%;background:#0d9488;display:inline-block;"></span>
        Contact & Details
      </div>
      <div class="edit-grid">
        <div>
          <label class="edit-field-label teal">Email</label>
          <input id="eEm" type="email" class="edit-input" value="${emp.email || ''}" placeholder="Email address">
        </div>
        <div>
          <label class="edit-field-label teal">Contact Number</label>
          <input id="eCt" class="edit-input" value="${emp.contact || ''}" placeholder="Contact number">
        </div>
        <div class="full-row">
          <label class="edit-field-label teal">Remarks</label>
          <textarea id="eRm" class="edit-textarea" placeholder="Any additional remarks…">${emp.remarks || ''}</textarea>
        </div>
      </div>`;
  }

  // ================================================================
  //  SWITCH MODE
  // ================================================================
  function switchMode(mode) {
    currentMode = mode;
    setModeUI(mode);
    if (mode === 'view') {
      renderViewMode(currentEmpData, currentEmpId);
    } else {
      renderEditMode(currentEmpData, currentEmpId);
    }
  }

  function setModeUI(mode) {
    document.getElementById('btnViewMode').classList.toggle('active', mode === 'view');
    document.getElementById('btnEditMode').classList.toggle('active', mode === 'edit');
    document.getElementById('footerCancelBtn').style.display = mode === 'edit' ? '' : 'none';
    document.getElementById('footerSaveBtn').style.display   = mode === 'edit' ? '' : 'none';
  }

  // ================================================================
  //  VALIDATION
  // ================================================================
  function isValidName(v)    { return /^[a-zA-Z\s.\-']{2,}$/.test(v.trim()); }
  function isValidNIC(v)     { const n = v.trim().toUpperCase(); return /^[0-9]{9}[VX]$/.test(n) || /^[0-9]{12}$/.test(n); }
  function isValidEmail(v)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  function isValidContact(v) { const c = v.trim().replace(/[\s\-]/g,''); return /^(0[1-9][0-9]{7,8}|\+94[1-9][0-9]{8})$/.test(c); }
  function isValidDate(v)    { return v && new Date(v) <= new Date(); }

  function validateEdit() {
    const name    = document.getElementById('eN').value;
    const status  = document.getElementById('eSt').value;
    const dept    = document.getElementById('eDp').value;
    const joinDate= document.getElementById('eJD').value;
    const nic     = document.getElementById('eNIC').value;
    const address = document.getElementById('eAd').value;
    const email   = document.getElementById('eEm').value;
    const contact = document.getElementById('eCt').value;

    if (!name.trim())          return { id:'eN',  msg:'Please enter the Employee Name.' };
    if (!isValidName(name))    return { id:'eN',  msg:'Name should contain only letters, spaces, dots, or hyphens.' };
    if (!status)               return { id:'eSt', msg:'Please select a Status.' };
    if (!dept)                 return { id:'eDp', msg:'Please select a Department.' };
    if (!joinDate)             return { id:'eJD', msg:'Please select the Date Joined.' };
    if (!isValidDate(joinDate))return { id:'eJD', msg:'Date Joined cannot be a future date.' };
    if (!nic.trim())           return { id:'eNIC',msg:'Please enter the NIC number.' };
    if (!isValidNIC(nic))      return { id:'eNIC',msg:'NIC must be in valid Sri Lankan format.' };
    if (!address.trim())       return { id:'eAd', msg:'Please enter the Address.' };
    if (address.trim().length < 5) return { id:'eAd', msg:'Address must be at least 5 characters.' };
    if (!email.trim())         return { id:'eEm', msg:'Please enter the Email address.' };
    if (!isValidEmail(email))  return { id:'eEm', msg:'Please enter a valid Email address.' };
    if (!contact.trim())       return { id:'eCt', msg:'Please enter the Contact Number.' };
    if (!isValidContact(contact)) return { id:'eCt', msg:'Contact must be a valid Sri Lankan number.' };
    return null;
  }

  // ================================================================
  //  SAVE (UPDATE)
  // ================================================================
  async function saveEmployee() {
    if (!currentEmpId) return;
    const err = validateEdit();
    if (err) {
      const el = document.getElementById(err.id);
      if (el) {
        el.classList.add('is-invalid');
        el.focus();
        el.addEventListener('input', () => el.classList.remove('is-invalid'), { once: true });
      }
      showPopup('error', 'Invalid Input', err.msg);
      return;
    }

    const saveBtn = document.getElementById('footerSaveBtn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = `<span class="spin"></span> Saving…`;

    const updated = {
      name:       document.getElementById('eN').value.trim(),
      status:     document.getElementById('eSt').value,
      department: document.getElementById('eDp').value,
      joinDate:   document.getElementById('eJD').value,
      nic:        document.getElementById('eNIC').value.trim(),
      address:    document.getElementById('eAd').value.trim(),
      email:      document.getElementById('eEm').value.trim(),
      contact:    document.getElementById('eCt').value.trim(),
      remarks:    document.getElementById('eRm').value.trim(),
      updatedAt:  firebase.firestore.FieldValue.serverTimestamp()
    };

    try {
      await firebase.firestore().collection('employees').doc(currentEmpId).update(updated);

      // Update local state
      currentEmpData = { ...updated, id: currentEmpId };
      const idx = allEmployees.findIndex(e => e.id === currentEmpId);
      if (idx !== -1) allEmployees[idx] = { ...currentEmpData };

      // Refresh UI
      switchMode('view');
      populateHeader(currentEmpData, currentEmpId);
      applyFilters(); // re-render list

      showPopup('success', 'Saved', `${updated.name}'s details have been updated.`);
    } catch (e) {
      console.error(e);
      showPopup('error', 'Save Failed', 'Could not save changes. Please try again.');
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i class="bi bi-check-lg"></i> Save Changes`;
    }
  }

  // ================================================================
  //  DELETE
  // ================================================================
  function openDeleteModal() {
    if (!currentEmpId) return;
    document.getElementById('delModalName').textContent = currentEmpData.name || 'this employee';
    document.getElementById('deleteModal').style.display = 'flex';
  }
  function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
  }

  async function confirmDelete() {
    if (!currentEmpId) return;
    const btn = document.getElementById('confirmDelBtn');
    btn.disabled = true;
    btn.innerHTML = `<span class="spin"></span> Deleting…`;

    try {
      const deletedName = currentEmpData.name || 'Employee';
      await firebase.firestore().collection('employees').doc(currentEmpId).delete();

      // Remove from local array
      allEmployees = allEmployees.filter(e => e.id !== currentEmpId);
      currentEmpId   = null;
      currentEmpData = {};

      closeDeleteModal();
      applyFilters();

      // Hide detail card, show empty
      document.getElementById('detailCard').style.display = 'none';
      document.getElementById('detailEmpty').style.display = 'flex';

      showPopup('success', 'Deleted', `${deletedName} has been removed from the system.`);
    } catch (e) {
      console.error(e);
      showPopup('error', 'Delete Failed', 'Could not delete the employee. Please try again.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<i class="bi bi-trash3"></i> Delete`;
    }
  }

  // Close delete modal on backdrop click
  document.getElementById('deleteModal').addEventListener('click', function(e) {
    if (e.target === this) closeDeleteModal();
  });

  // ================================================================
  //  INIT
  // ================================================================
  loadEmployees();
  // ================================================
  // PRINT PAGE — only runs if reportArea exists
  // ================================================
  if (document.getElementById("reportArea")) {

    const reportArea     = document.getElementById("reportArea");
    const printLoading   = document.getElementById("printLoading");
    const printEmpty     = document.getElementById("printEmpty");
    const reportThead    = document.getElementById("reportThead");
    const reportTbody    = document.getElementById("reportTbody");
    const deptFilter     = document.getElementById("printDeptFilter");
    const statusFilter   = document.getElementById("printStatusFilter");
    const colToggles     = document.getElementById("colToggles");
    const printBtn       = document.getElementById("printBtn");
    const exportCsvBtn   = document.getElementById("exportCsvBtn");
    const reportDate     = document.getElementById("reportDate");

    let allEmployees = [];

    // Column definitions
    const COLUMNS = [
      { key: "id",         label: "Employee ID",  on: true },
      { key: "name",       label: "Name",         on: true },
      { key: "department", label: "Department",   on: true },
      { key: "status",     label: "Status",       on: true },
      { key: "joinDate",   label: "Date Joined",  on: true },
      { key: "nic",        label: "NIC",          on: true },
      { key: "contact",    label: "Contact",      on: true },
      { key: "email",      label: "Email",        on: true },
      { key: "address",    label: "Address",      on: false },
      { key: "remarks",    label: "Remarks",      on: false },
    ];

    // Build column toggle pills
    COLUMNS.forEach((col, i) => {
      const lbl = document.createElement("label");
      lbl.className = `print-col-toggle ${col.on ? "on" : ""}`;
      lbl.innerHTML = `<input type="checkbox" ${col.on ? "checked" : ""}> ${col.label}`;
      lbl.querySelector("input").addEventListener("change", function () {
        COLUMNS[i].on = this.checked;
        lbl.classList.toggle("on", this.checked);
        renderTable(getFiltered());
      });
      colToggles.appendChild(lbl);
    });

    // Get active columns
    function activeCols() { return COLUMNS.filter(c => c.on); }

    // Get filtered employees
    function getFiltered() {
      const dept = deptFilter.value.toLowerCase();
      const stat = statusFilter.value.toLowerCase();
      return allEmployees.filter(emp => {
        const matchDept = !dept || (emp.department || "").toLowerCase() === dept;
        const matchStat = !stat || (emp.status || "").toLowerCase() === stat;
        return matchDept && matchStat;
      });
    }

    // Update summary counts
    function updateSummary(employees) {
      const fullTime   = employees.filter(e => (e.status || "").toLowerCase() === "fulltime").length;
      const partTime   = employees.length - fullTime;
      const depts      = new Set(employees.map(e => e.department).filter(Boolean)).size;
      
      document.getElementById("pTotal").textContent    = employees.length;
      document.getElementById("pFullTime").textContent = fullTime;
      document.getElementById("pPartTime").textContent = partTime;
      document.getElementById("pDepts").textContent    = depts;
    }

    // Format status for display
    function formatStatus(status) {
      if (!status) return "—";
      if (status.toLowerCase() === "fulltime") return "Full Time";
      if (status.toLowerCase() === "parttime") return "Part Time";
      return status;
    }

    // Render table
    function renderTable(employees) {
      const cols = activeCols();

      // Header
      reportThead.innerHTML = `<tr>${cols.map(c => `<th>${c.label}</th>`).join("")}</tr>`;

      // Body
      if (employees.length === 0) {
        reportTbody.innerHTML = "";
        printEmpty.style.display = "block";
      } else {
        printEmpty.style.display = "none";
        reportTbody.innerHTML = employees.map((emp) => `
          <tr>
            ${cols.map(c => {
              if (c.key === "status") {
                const isFullTime = (emp.status || "").toLowerCase() === "fulltime";
                return `<td><span class="report-status-badge ${isFullTime ? "active" : "inactive"}">${formatStatus(emp.status)}</span></td>`;
              }
              return `<td>${emp[c.key] || "—"}</td>`;
            }).join("")}
          </tr>
        `).join("");
      }

      updateSummary(employees);
    }

    // Load from Firestore
    async function loadPrintData() {
      printLoading.style.display = "block";
      reportArea.style.display   = "none";

      try {
        const snapshot = await firebase.firestore().collection("employees").orderBy("name").get();
        allEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        printLoading.style.display = "none";
        reportArea.style.display   = "block";

        // Set print date
        reportDate.textContent = "Generated: " + new Date().toLocaleString("en-GB", {
          day: "2-digit", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit"
        });

        renderTable(getFiltered());

      } catch (err) {
        console.error(err);
        printLoading.style.display = "none";
        reportArea.style.display   = "block";
        printEmpty.style.display   = "block";
        printEmpty.querySelector("h5").textContent = "Failed to load data";
      }
    }

    // Filter change events
    deptFilter.addEventListener("change",   () => renderTable(getFiltered()));
    statusFilter.addEventListener("change", () => renderTable(getFiltered()));

    // Print
    printBtn.addEventListener("click", () => {
      // Update date before printing
      reportDate.textContent = "Generated: " + new Date().toLocaleString("en-GB", {
        day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      });
      window.print();
    });

    // Export CSV
    exportCsvBtn.addEventListener("click", () => {
      const cols = activeCols();
      const employees = getFiltered();
      const header = cols.map(c => `"${c.label}"`).join(",");
      const rows   = employees.map(emp =>
        cols.map(c => `"${(emp[c.key] || "").toString().replace(/"/g, '""')}"`).join(",")
      );
      const csv  = [header, ...rows].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `employees_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    loadPrintData();

  } // end PRINT PAGE

}); // end DOMContentLoaded