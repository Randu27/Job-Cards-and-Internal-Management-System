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


  // ================================================
  // UPDATE PAGE — only runs if employeeForm exists
  // ================================================
  if (document.getElementById("employeeForm")) {

  const searchInput      = document.getElementById("employeeSearch");
  const searchBtn        = document.getElementById("searchBtn");
  const form             = document.getElementById("employeeForm");
  const empName          = document.getElementById("empName");
  const empId            = document.getElementById("empId");
  const empStatus        = document.getElementById("empStatus");
  const empDept          = document.getElementById("empDepartment");
  const empJoinDate      = document.getElementById("empJoinDate");
  const empNic           = document.getElementById("empNic");
  const empAddress       = document.getElementById("empAddress");
  const empEmail         = document.getElementById("empEmail");
  const empContact       = document.getElementById("empContact");
  const empRemarks       = document.getElementById("empRemarks");
  const editBtn          = document.getElementById("editBtn");
  const updateBtn        = document.getElementById("updateBtn");
  const deleteBtn        = document.getElementById("deleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  let currentEmployeeId = null;
  let currentData = {};

  // Field definitions: [elementId, label]
  const fields = [
    ["empName",       "Employee Name"],
    ["empId",         "Employee ID"],
    ["empStatus",     "Status"],
    ["empDepartment", "Department"],
    ["empJoinDate",   "Date Joined"],
    ["empNic",        "NIC"],
    ["empAddress",    "Address"],
    ["empEmail",      "Email"],
    ["empContact",    "Contact Number"],
    ["empRemarks",    "Remarks"],
  ];

  // Show as styled info display (view mode)
  function showViewMode(data, id) {
    const displayData = {
      empName:       data.name       || "—",
      empId:         id,
      empStatus:     data.status     || "—",
      empDepartment: data.department || "—",
      empJoinDate:   data.joinDate   || "—",
      empNic:        data.nic        || "—",
      empAddress:    data.address    || "—",
      empEmail:      data.email      || "—",
      empContact:    data.contact    || "—",
      empRemarks:    data.remarks    || "—",
    };

    // Hide the actual form inputs, show info panel
    form.querySelectorAll("input, select, textarea").forEach(el => el.style.display = "none");
    form.querySelectorAll(".form-label").forEach(el => el.style.display = "none");
    form.querySelectorAll(".mb-2").forEach(el => el.style.marginBottom = "0");

    // Remove old info panel if any
    const oldPanel = document.getElementById("empInfoPanel");
    if (oldPanel) oldPanel.remove();

    // Build info panel
    const panel = document.createElement("div");
    panel.id = "empInfoPanel";
    panel.style.cssText = "margin-bottom: 1rem;";

    // Split into two columns matching the form layout
    const leftFields  = ["empName","empId","empStatus","empDepartment","empJoinDate","empNic","empAddress"];
    const rightFields = ["empEmail","empContact","empRemarks"];

    const row = document.createElement("div");
    row.className = "row g-3";

    [leftFields, rightFields].forEach(group => {
      const col = document.createElement("div");
      col.className = "col-md-6";

      group.forEach(key => {
        const label = fields.find(f => f[0] === key)?.[1] || key;
        const value = displayData[key];
        const item = document.createElement("div");
        item.className = "emp-info-item";
        item.innerHTML = `
          <span class="emp-info-label">${label}</span>
          <span class="emp-info-value">${value}</span>
        `;
        col.appendChild(item);
      });

      row.appendChild(col);
    });

    panel.appendChild(row);

    // Insert panel before the button row
    const btnRow = form.querySelector(".d-flex.gap-2");
    form.insertBefore(panel, btnRow);

    form.style.display = "block";
    updateBtn.disabled = true;
  }

  // Switch to edit mode — restore inputs
  function showEditMode() {
    const oldPanel = document.getElementById("empInfoPanel");
    if (oldPanel) oldPanel.remove();

    // Restore inputs and labels
    form.querySelectorAll("input, select, textarea").forEach(el => el.style.display = "");
    form.querySelectorAll(".form-label").forEach(el => el.style.display = "");
    form.querySelectorAll(".mb-2").forEach(el => el.style.marginBottom = "");

    // Re-populate values from currentData
    empName.value     = currentData.name       || "";
    empId.value       = currentEmployeeId;
    empStatus.value   = currentData.status     || "";
    empJoinDate.value = currentData.joinDate   || "";
    empNic.value      = currentData.nic        || "";
    empAddress.value  = currentData.address    || "";
    empEmail.value    = currentData.email      || "";
    empContact.value  = currentData.contact    || "";
    empRemarks.value  = currentData.remarks    || "";
    for (let opt of empDept.options) {
      if (opt.value.toLowerCase() === (currentData.department || "").toLowerCase()) {
        empDept.value = opt.value; break;
      }
    }

    // Make all fields editable
    [empName, empStatus, empJoinDate, empNic, empAddress, empEmail, empContact, empRemarks].forEach(f => {
      if (f) f.readOnly = false;
    });
    empDept.disabled = false;
    empId.readOnly = true; // ID never editable
    updateBtn.disabled = false;
  }

  // Populate: store data and show view mode
  function populateForm(data, id) {
    currentData = data;
    currentEmployeeId = id;
    showViewMode(data, id);
    form.querySelectorAll(".is-valid, .is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));
  }

  // Search
  async function searchEmployee() {
    const id = searchInput.value.trim();
    if (!id) { showPopup("error", "No ID Entered", "Please enter an <strong>Employee ID</strong> to search."); return; }

    searchBtn.disabled = true;
    searchBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Searching...`;

    try {
      const doc = await firebase.firestore().collection("employees").doc(id).get();
      searchBtn.disabled = false;
      searchBtn.innerHTML = "Search";

      if (!doc.exists) {
        form.style.display = "none";
        currentEmployeeId = null;
        showPopup("error", "Not Found", `No employee found with ID <strong>${id}</strong>. Please check and try again.`);
        return;
      }
      currentEmployeeId = id;
      populateForm(doc.data(), id);
      showPopup("success", "Employee Found", `Loaded details for <strong>${doc.data().name}</strong>.`);

    } catch (err) {
      searchBtn.disabled = false;
      searchBtn.innerHTML = "Search";
      console.error(err);
      showPopup("error", "Search Failed", "Could not connect to the database. Please check your internet connection.");
    }
  }

  searchBtn.addEventListener("click", searchEmployee);
  searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchEmployee(); });

  // Edit — switch to input mode
  editBtn.addEventListener("click", () => {
    if (!currentEmployeeId) { showPopup("error", "No Employee Loaded", "Please search for an employee first."); return; }
    showEditMode();
    showPopup("success", "Edit Mode Enabled", "Fields are now editable. Click <strong>Update</strong> to save changes.");
  });

  // Validators (shared rules)
  function isValidNameU(v)    { return /^[a-zA-Z\s.\-']{2,}$/.test(v.trim()); }
  function isValidNICU(v)     { const n = v.trim().toUpperCase(); return /^[0-9]{9}[VX]$/.test(n) || /^[0-9]{12}$/.test(n); }
  function isValidEmailU(v)   { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
  function isValidContactU(v) { const c = v.trim().replace(/[\s\-]/g, ""); return /^(0[1-9][0-9]{7,8}|\+94[1-9][0-9]{8})$/.test(c); }
  function isValidAddressU(v) { return v.trim().length >= 5; }
  function isValidDateU(v)    { return v && new Date(v) <= new Date(); }

  function getUpdateValidationError() {
    if (!empName.value.trim())              return { field: empName,     msg: "Please enter the <strong>Employee Name</strong>." };
    if (!isValidNameU(empName.value))       return { field: empName,     msg: "<strong>Employee Name</strong> should only contain letters, spaces, dots, or hyphens." };
    if (!empStatus.value.trim())            return { field: empStatus,   msg: "Please enter the <strong>Status</strong>." };
    if (!empDept.value)                     return { field: empDept,     msg: "Please select a <strong>Department</strong>." };
    if (!empJoinDate.value)                 return { field: empJoinDate, msg: "Please select the <strong>Date Joined</strong>." };
    if (!isValidDateU(empJoinDate.value))   return { field: empJoinDate, msg: "<strong>Date Joined</strong> cannot be a future date." };
    if (!empNic.value.trim())               return { field: empNic,      msg: "Please enter the <strong>NIC</strong> number." };
    if (!isValidNICU(empNic.value))         return { field: empNic,      msg: "<strong>NIC</strong> must be old format (e.g. <em>901234567V</em>) or new format (e.g. <em>200012345678</em>)." };
    if (!empAddress.value.trim())           return { field: empAddress,  msg: "Please enter the <strong>Address</strong>." };
    if (!isValidAddressU(empAddress.value)) return { field: empAddress,  msg: "<strong>Address</strong> must be at least 5 characters." };
    if (!empEmail.value.trim())             return { field: empEmail,    msg: "Please enter the <strong>Email</strong> address." };
    if (!isValidEmailU(empEmail.value))     return { field: empEmail,    msg: "Please enter a <strong>valid Email</strong> (e.g. <em>name@example.com</em>)." };
    if (!empContact.value.trim())           return { field: empContact,  msg: "Please enter the <strong>Contact Number</strong>." };
    if (!isValidContactU(empContact.value)) return { field: empContact,  msg: "<strong>Contact Number</strong> must be a valid Sri Lankan number (e.g. <em>0771234567</em>)." };
    return null;
  }

  function highlightFieldU(field) {
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");
    field.focus();
    field.addEventListener("input", () => field.classList.remove("is-invalid"), { once: true });
  }

  // Update
  updateBtn.addEventListener("click", async () => {
    if (!currentEmployeeId) return;
    const err = getUpdateValidationError();
    if (err) { highlightFieldU(err.field); showPopup("error", "Invalid Input", err.msg); return; }

    updateBtn.disabled = true;
    updateBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Updating...`;

    try {
      const updatedName = empName.value.trim();
      await firebase.firestore().collection("employees").doc(currentEmployeeId).update({
        name:       updatedName,
        status:     empStatus.value.trim(),
        department: empDept.value,
        joinDate:   empJoinDate.value,
        nic:        empNic.value.trim(),
        address:    empAddress.value.trim(),
        email:      empEmail.value.trim(),
        contact:    empContact.value.trim(),
        remarks:    empRemarks.value.trim(),
        updatedAt:  firebase.firestore.FieldValue.serverTimestamp()
      });
      updateBtn.innerHTML = "Update";
      // Refresh stored data and switch back to view mode
      currentData = {
        name: empName.value.trim(), status: empStatus.value.trim(),
        department: empDept.value,  joinDate: empJoinDate.value,
        nic: empNic.value.trim(),   address: empAddress.value.trim(),
        email: empEmail.value.trim(), contact: empContact.value.trim(),
        remarks: empRemarks.value.trim()
      };
      showViewMode(currentData, currentEmployeeId);
      showPopup("success", "Updated Successfully", `<strong>${updatedName}</strong>'s details have been saved.`);

    } catch (error) {
      console.error(error);
      updateBtn.disabled = false;
      updateBtn.innerHTML = "Update";
      showPopup("error", "Update Failed", "Could not save changes. Please try again.");
    }
  });

  // Delete — confirm modal
  deleteBtn.addEventListener("click", () => {
    if (!currentEmployeeId) { showPopup("error", "No Employee Loaded", "Please search for an employee first."); return; }
    new bootstrap.Modal(document.getElementById("deleteModal")).show();
  });

  confirmDeleteBtn.addEventListener("click", async () => {
    if (!currentEmployeeId) return;
    bootstrap.Modal.getInstance(document.getElementById("deleteModal")).hide();
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Deleting...`;

    try {
      const deletedName = empName.value.trim();
      await firebase.firestore().collection("employees").doc(currentEmployeeId).delete();
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = "Delete";
      form.style.display = "none";
      searchInput.value = "";
      currentEmployeeId = null;
      showPopup("success", "Employee Deleted", `<strong>${deletedName}</strong> has been removed from the system.`);

    } catch (error) {
      console.error(error);
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.innerHTML = "Delete";
      showPopup("error", "Delete Failed", "Could not delete the employee. Please try again.");
    }
  });

  } // end UPDATE PAGE

}); // end DOMContentLoaded