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

    const searchInput = document.getElementById("employeeSearch");
    const searchBtn = document.getElementById("searchBtn");
    const form = document.getElementById("employeeForm");
    const empName = document.getElementById("empName");
    const empId = document.getElementById("empId");
    const empStatus = document.getElementById("empStatus");
    const empDept = document.getElementById("empDepartment");
    const empJoinDate = document.getElementById("empJoinDate");
    const empNic = document.getElementById("empNic");
    const empAddress = document.getElementById("empAddress");
    const empEmail = document.getElementById("empEmail");
    const empContact = document.getElementById("empContact");
    const empRemarks = document.getElementById("empRemarks");
    const editBtn = document.getElementById("editBtn");
    const updateBtn = document.getElementById("updateBtn");
    const deleteBtn = document.getElementById("deleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

    let currentEmployeeId = null;
    let currentData = {};

    function showViewMode(data, id) {
      const displayData = {
        empName: data.name || "—",
        empId: id,
        empStatus: data.status === "FullTime" ? "Full Time" : data.status === "PartTime" ? "Part Time" : data.status || "—",
        empDepartment: data.department || "—",
        empJoinDate: data.joinDate || "—",
        empNic: data.nic || "—",
        empAddress: data.address || "—",
        empEmail: data.email || "—",
        empContact: data.contact || "—",
        empRemarks: data.remarks || "—",
      };

      form.querySelectorAll("input, select, textarea").forEach(el => el.style.display = "none");
      form.querySelectorAll(".form-label").forEach(el => el.style.display = "none");

      const oldPanel = document.getElementById("empInfoPanel");
      if (oldPanel) oldPanel.remove();

      const panel = document.createElement("div");
      panel.id = "empInfoPanel";
      panel.style.cssText = "margin-bottom: 1rem;";

      const row = document.createElement("div");
      row.className = "row g-3";

      const leftFields = ["empName", "empId", "empStatus", "empDepartment", "empJoinDate", "empNic", "empAddress"];
      const rightFields = ["empEmail", "empContact", "empRemarks"];

      [leftFields, rightFields].forEach(group => {
        const col = document.createElement("div");
        col.className = "col-md-6";
        group.forEach(key => {
          const labels = {
            empName: "Employee Name", empId: "Employee ID", empStatus: "Status",
            empDepartment: "Department", empJoinDate: "Date Joined", empNic: "NIC",
            empAddress: "Address", empEmail: "Email", empContact: "Contact Number",
            empRemarks: "Remarks"
          };
          const item = document.createElement("div");
          item.className = "mb-3";
          item.innerHTML = `
            <strong>${labels[key]}:</strong><br>
            <span>${displayData[key]}</span>
          `;
          col.appendChild(item);
        });
        row.appendChild(col);
      });

      panel.appendChild(row);
      const btnRow = form.querySelector(".d-flex.gap-2");
      form.insertBefore(panel, btnRow);
      form.style.display = "block";
      updateBtn.disabled = true;
      editBtn.disabled = false;
    }

    function showEditMode() {
      const oldPanel = document.getElementById("empInfoPanel");
      if (oldPanel) oldPanel.remove();

      form.querySelectorAll("input, select, textarea").forEach(el => el.style.display = "");
      form.querySelectorAll(".form-label").forEach(el => el.style.display = "");

      empName.value = currentData.name || "";
      empId.value = currentEmployeeId;
      empStatus.value = currentData.status || "";
      empJoinDate.value = currentData.joinDate || "";
      empNic.value = currentData.nic || "";
      empAddress.value = currentData.address || "";
      empEmail.value = currentData.email || "";
      empContact.value = currentData.contact || "";
      empRemarks.value = currentData.remarks || "";
      
      for (let opt of empDept.options) {
        if (opt.value === (currentData.department || "")) {
          empDept.value = opt.value;
          break;
        }
      }

      [empName, empStatus, empJoinDate, empNic, empAddress, empEmail, empContact, empRemarks].forEach(f => {
        if (f) f.readOnly = false;
      });
      empDept.disabled = false;
      empId.readOnly = true;
      updateBtn.disabled = false;
      editBtn.disabled = true;
    }

    function populateForm(data, id) {
      currentData = data;
      currentEmployeeId = id;
      showViewMode(data, id);
    }

    async function searchEmployee() {
      const id = searchInput.value.trim();
      if (!id) {
        showPopup("error", "No ID Entered", "Please enter an Employee ID to search.");
        return;
      }

      searchBtn.disabled = true;
      searchBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Searching...`;

      try {
        const doc = await firebase.firestore().collection("employees").doc(id).get();
        searchBtn.disabled = false;
        searchBtn.innerHTML = "Search";

        if (!doc.exists) {
          form.style.display = "none";
          currentEmployeeId = null;
          showPopup("error", "Not Found", `No employee found with ID ${id}.`);
          return;
        }
        currentEmployeeId = id;
        populateForm(doc.data(), id);
        showPopup("success", "Employee Found", `Loaded details for ${doc.data().name}.`);

      } catch (err) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = "Search";
        console.error(err);
        showPopup("error", "Search Failed", "Could not connect to the database.");
      }
    }

    searchBtn.addEventListener("click", searchEmployee);
    searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchEmployee(); });

    editBtn.addEventListener("click", () => {
      if (!currentEmployeeId) {
        showPopup("error", "No Employee Loaded", "Please search for an employee first.");
        return;
      }
      showEditMode();
      showPopup("success", "Edit Mode Enabled", "Fields are now editable. Click Update to save changes.");
    });

    function isValidNameU(v) { return /^[a-zA-Z\s.\-']{2,}$/.test(v.trim()); }
    function isValidNICU(v) { const n = v.trim().toUpperCase(); return /^[0-9]{9}[VX]$/.test(n) || /^[0-9]{12}$/.test(n); }
    function isValidEmailU(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
    function isValidContactU(v) { const c = v.trim().replace(/[\s\-]/g, ""); return /^(0[1-9][0-9]{7,8}|\+94[1-9][0-9]{8})$/.test(c); }
    function isValidAddressU(v) { return v.trim().length >= 5; }
    function isValidDateU(v) { return v && new Date(v) <= new Date(); }

    function getUpdateValidationError() {
      if (!empName.value.trim()) return { field: empName, msg: "Please enter the Employee Name." };
      if (!isValidNameU(empName.value)) return { field: empName, msg: "Employee Name should contain only letters, spaces, dots, or hyphens." };
      if (!empStatus.value.trim()) return { field: empStatus, msg: "Please select a Status." };
      if (!empDept.value) return { field: empDept, msg: "Please select a Department." };
      if (!empJoinDate.value) return { field: empJoinDate, msg: "Please select the Date Joined." };
      if (!isValidDateU(empJoinDate.value)) return { field: empJoinDate, msg: "Date Joined cannot be a future date." };
      if (!empNic.value.trim()) return { field: empNic, msg: "Please enter the NIC number." };
      if (!isValidNICU(empNic.value)) return { field: empNic, msg: "NIC must be in valid format." };
      if (!empAddress.value.trim()) return { field: empAddress, msg: "Please enter the Address." };
      if (!isValidAddressU(empAddress.value)) return { field: empAddress, msg: "Address must be at least 5 characters." };
      if (!empEmail.value.trim()) return { field: empEmail, msg: "Please enter the Email address." };
      if (!isValidEmailU(empEmail.value)) return { field: empEmail, msg: "Please enter a valid Email address." };
      if (!empContact.value.trim()) return { field: empContact, msg: "Please enter the Contact Number." };
      if (!isValidContactU(empContact.value)) return { field: empContact, msg: "Contact Number must be a valid Sri Lankan number." };
      return null;
    }

    function highlightFieldU(field) {
      field.classList.add("is-invalid");
      field.classList.remove("is-valid");
      field.focus();
      field.addEventListener("input", () => field.classList.remove("is-invalid"), { once: true });
    }

    updateBtn.addEventListener("click", async () => {
      if (!currentEmployeeId) return;
      const err = getUpdateValidationError();
      if (err) {
        highlightFieldU(err.field);
        showPopup("error", "Invalid Input", err.msg);
        return;
      }

      updateBtn.disabled = true;
      updateBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Updating...`;

      try {
        await firebase.firestore().collection("employees").doc(currentEmployeeId).update({
          name: empName.value.trim(),
          status: empStatus.value,
          department: empDept.value,
          joinDate: empJoinDate.value,
          nic: empNic.value.trim(),
          address: empAddress.value.trim(),
          email: empEmail.value.trim(),
          contact: empContact.value.trim(),
          remarks: empRemarks.value.trim(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        updateBtn.innerHTML = "Update";
        currentData = {
          name: empName.value.trim(), status: empStatus.value,
          department: empDept.value, joinDate: empJoinDate.value,
          nic: empNic.value.trim(), address: empAddress.value.trim(),
          email: empEmail.value.trim(), contact: empContact.value.trim(),
          remarks: empRemarks.value.trim()
        };
        showViewMode(currentData, currentEmployeeId);
        showPopup("success", "Updated Successfully", `${empName.value.trim()}'s details have been saved.`);

      } catch (error) {
        console.error(error);
        updateBtn.disabled = false;
        updateBtn.innerHTML = "Update";
        showPopup("error", "Update Failed", "Could not save changes. Please try again.");
      }
    });

    deleteBtn.addEventListener("click", () => {
      if (!currentEmployeeId) {
        showPopup("error", "No Employee Loaded", "Please search for an employee first.");
        return;
      }
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
        showPopup("success", "Employee Deleted", `${deletedName} has been removed from the system.`);

      } catch (error) {
        console.error(error);
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = "Delete";
        showPopup("error", "Delete Failed", "Could not delete the employee. Please try again.");
      }
    });
  }

  // ================================================
  // VIEW PAGE — Employee Records Grid View
  // ================================================
  if (document.getElementById("employeeGrid")) {

    const employeeGrid = document.getElementById("employeeGrid");
    const viewLoading = document.getElementById("viewLoading");
    const viewEmpty = document.getElementById("viewEmpty");
    const searchInput = document.getElementById("viewSearchInput");
    const deptFilter = document.getElementById("deptFilter");
    const statusFilter = document.getElementById("statusFilter");
    const totalCountSpan = document.getElementById("totalCount");
    const activeCountSpan = document.getElementById("activeCount");
    const inactiveCountSpan = document.getElementById("inactiveCount");

    let allEmployees = [];

    function renderEmployees(employees) {
      if (employees.length === 0) {
        employeeGrid.style.display = "none";
        viewEmpty.style.display = "block";
        return;
      }

      employeeGrid.style.display = "grid";
      viewEmpty.style.display = "none";

      employeeGrid.innerHTML = employees.map(emp => `
        <div class="emp-card ${emp.status === 'PartTime' ? 'inactive-card' : ''}" data-id="${emp.id}">
          <div class="emp-card-header">
            <div class="emp-avatar">
              ${emp.image ? `<img src="${emp.image}" alt="${emp.name}">` : (emp.name ? emp.name.charAt(0).toUpperCase() : "?")}
            </div>
            <div>
              <h3 class="emp-card-name">${emp.name || "—"}</h3>
              <div class="emp-card-id">ID: ${emp.id}</div>
            </div>
            <span class="emp-status-badge ${emp.status === 'FullTime' ? 'active' : 'inactive'}">${emp.status === 'FullTime' ? 'Full Time' : emp.status === 'PartTime' ? 'Part Time' : emp.status || "—"}</span>
          </div>
          <div class="emp-card-body">
            <div class="emp-card-row"><i class="bi bi-building"></i><span>${emp.department || "—"}</span></div>
            <div class="emp-card-row"><i class="bi bi-calendar3"></i><span>Joined: ${emp.joinDate || "—"}</span></div>
            <div class="emp-card-row"><i class="bi bi-envelope"></i><span>${emp.email || "—"}</span></div>
            <div class="emp-card-row"><i class="bi bi-telephone"></i><span>${emp.contact || "—"}</span></div>
          </div>
          <div class="emp-card-footer">
            <button class="emp-view-btn" data-id="${emp.id}">View Details</button>
          </div>
        </div>
      `).join("");

      document.querySelectorAll(".emp-view-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          showEmployeeDetails(btn.getAttribute("data-id"));
        });
      });

      document.querySelectorAll(".emp-card").forEach(card => {
        card.addEventListener("click", () => {
          showEmployeeDetails(card.getAttribute("data-id"));
        });
      });
    }

    function updateStats(employees) {
      totalCountSpan.textContent = employees.length;
      activeCountSpan.textContent = employees.filter(e => e.status === "FullTime").length;
      inactiveCountSpan.textContent = employees.filter(e => e.status === "PartTime").length;
    }

    function getFilteredEmployees() {
      const searchTerm = searchInput.value.toLowerCase();
      const dept = deptFilter.value;
      const status = statusFilter.value;

      return allEmployees.filter(emp => {
        const matchesSearch = !searchTerm ||
          (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
          (emp.id && emp.id.toLowerCase().includes(searchTerm)) ||
          (emp.department && emp.department.toLowerCase().includes(searchTerm));
        const matchesDept = !dept || emp.department === dept;
        const matchesStatus = !status || emp.status === status;
        return matchesSearch && matchesDept && matchesStatus;
      });
    }

    function applyFilters() {
      const filtered = getFilteredEmployees();
      renderEmployees(filtered);
      updateStats(filtered);
    }

    function showEmployeeDetails(empId) {
      const employee = allEmployees.find(e => e.id === empId);
      if (!employee) return;

      const modalBody = document.getElementById("detailModalBody");
      modalBody.innerHTML = `
        <div class="p-4">
          <div class="text-center mb-4">
            <div class="emp-avatar mx-auto" style="width: 100px; height: 100px; font-size: 2rem;">
              ${employee.image ? `<img src="${employee.image}" alt="${employee.name}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : (employee.name ? employee.name.charAt(0).toUpperCase() : "?")}
            </div>
            <h3 class="mt-3 mb-1">${employee.name || "—"}</h3>
            <span class="emp-status-badge ${employee.status === 'FullTime' ? 'active' : 'inactive'}">${employee.status === 'FullTime' ? 'Full Time' : employee.status === 'PartTime' ? 'Part Time' : employee.status || "—"}</span>
          </div>
          <div class="row g-3">
            <div class="col-md-6">
              <div class="mb-2"><strong>Employee ID:</strong> ${employee.id || "—"}</div>
              <div class="mb-2"><strong>Department:</strong> ${employee.department || "—"}</div>
              <div class="mb-2"><strong>Date Joined:</strong> ${employee.joinDate || "—"}</div>
              <div class="mb-2"><strong>NIC:</strong> ${employee.nic || "—"}</div>
            </div>
            <div class="col-md-6">
              <div class="mb-2"><strong>Email:</strong> ${employee.email || "—"}</div>
              <div class="mb-2"><strong>Contact:</strong> ${employee.contact || "—"}</div>
              <div class="mb-2"><strong>Address:</strong> ${employee.address || "—"}</div>
              <div class="mb-2"><strong>Remarks:</strong> ${employee.remarks || "—"}</div>
            </div>
          </div>
        </div>
      `;
      new bootstrap.Modal(document.getElementById("detailModal")).show();
    }

    async function loadEmployees() {
      try {
        viewLoading.style.display = "flex";
        employeeGrid.style.display = "none";
        viewEmpty.style.display = "none";

        const snapshot = await firebase.firestore().collection("employees").get();
        allEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        viewLoading.style.display = "none";

        if (allEmployees.length === 0) {
          viewEmpty.style.display = "block";
        } else {
          applyFilters();
        }
      } catch (error) {
        console.error("Error loading employees:", error);
        viewLoading.style.display = "none";
        viewEmpty.style.display = "block";
        const emptyTitle = viewEmpty.querySelector("h5");
        if (emptyTitle) emptyTitle.textContent = "Failed to load data";
      }
    }

    if (searchInput) searchInput.addEventListener("input", applyFilters);
    if (deptFilter) deptFilter.addEventListener("change", applyFilters);
    if (statusFilter) statusFilter.addEventListener("change", applyFilters);

    loadEmployees();
  }

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