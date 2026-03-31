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
        // Global variables
    let employees = [];          // store all employees from Firestore
    let filteredEmployees = [];
    let currentEditId = null;
    let currentEmployeeData = null;
    let detailModal = null;

    // DOM elements
    const loadingDiv = document.getElementById('viewLoading');
    const emptyDiv = document.getElementById('viewEmpty');
    const gridContainer = document.getElementById('employeeGrid');
    const searchInput = document.getElementById('viewSearchInput');
    const deptFilter = document.getElementById('deptFilter');
    const statusFilter = document.getElementById('statusFilter');
    const totalSpan = document.getElementById('totalCount');
    const activeSpan = document.getElementById('activeCount');
    const inactiveSpan = document.getElementById('inactiveCount');

    // Helper: get reference to Firestore collection
    function getEmployeesCollection() {
      if (!window.db) {
        console.error("Firestore not initialized, check firebase-config.js");
        return null;
      }
      return window.db.collection("employees");
    }

    // Load employees from Firestore (collection "employees")
    async function loadEmployees() {
      if (!window.db) {
        console.warn("Waiting for Firebase...");
        setTimeout(() => loadEmployees(), 300);
        return;
      }
      try {
        loadingDiv.style.display = "flex";
        gridContainer.style.display = "none";
        emptyDiv.style.display = "none";
        const snapshot = await getEmployeesCollection().get();
        employees = [];
        snapshot.forEach(doc => {
          employees.push({ id: doc.id, ...doc.data() });
        });
        // if no employees, optionally seed demo data for testing (only if empty)
        if (employees.length === 0) {
          await seedDemoEmployees();
          const newSnapshot = await getEmployeesCollection().get();
          employees = [];
          newSnapshot.forEach(doc => employees.push({ id: doc.id, ...doc.data() }));
        }
        applyFiltersAndRender();
      } catch (error) {
        console.error("Error loading employees:", error);
        loadingDiv.innerHTML = `<div class="alert alert-danger">Failed to load data: ${error.message}</div>`;
      }
    }

    // Optional demo seed for testing purposes (creates two example employees if collection empty)
    async function seedDemoEmployees() {
      const collection = getEmployeesCollection();
      const sample = [
        {
          name: "Amila Perera",
          employeeId: "EMP1001",
          department: "Front Office",
          position: "Customer Relations",
          employmentType: "FullTime",
          email: "amila@grafix.lk",
          phone: "0771234567",
          joinDate: "2022-01-15"
        },
        {
          name: "Nuwan Rathnayake",
          employeeId: "EMP1002",
          department: "Workshop",
          position: "Senior Printer",
          employmentType: "PartTime",
          email: "nuwan@grafix.lk",
          phone: "0769876543",
          joinDate: "2023-06-10"
        }
      ];
      for (const emp of sample) {
        const exists = await collection.where("employeeId", "==", emp.employeeId).get();
        if (exists.empty) {
          await collection.add(emp);
        }
      }
    }

    // Filters + search + render cards
    function applyFiltersAndRender() {
      const searchTerm = searchInput.value.toLowerCase();
      const dept = deptFilter.value;
      const status = statusFilter.value;

      filteredEmployees = employees.filter(emp => {
        let match = true;
        if (searchTerm) {
          match = (emp.name && emp.name.toLowerCase().includes(searchTerm)) ||
                  (emp.employeeId && emp.employeeId.toLowerCase().includes(searchTerm)) ||
                  (emp.department && emp.department.toLowerCase().includes(searchTerm));
          if (!match) return false;
        }
        if (dept && emp.department !== dept) return false;
        if (status) {
          if (status === "FullTime" && emp.employmentType !== "FullTime") return false;
          if (status === "PartTime" && emp.employmentType !== "PartTime") return false;
        }
        return true;
      });

      updateStats();
      if (filteredEmployees.length === 0) {
        gridContainer.style.display = "none";
        emptyDiv.style.display = "block";
        loadingDiv.style.display = "none";
      } else {
        gridContainer.style.display = "grid";
        emptyDiv.style.display = "none";
        loadingDiv.style.display = "none";
        renderEmployeeCards(filteredEmployees);
      }
    }

    function updateStats() {
      totalSpan.innerText = employees.length;
      const fullTimeCount = employees.filter(e => e.employmentType === "FullTime").length;
      const partTimeCount = employees.filter(e => e.employmentType === "PartTime").length;
      activeSpan.innerText = fullTimeCount;
      inactiveSpan.innerText = partTimeCount;
    }

    function renderEmployeeCards(empList) {
      gridContainer.innerHTML = "";
      empList.forEach(emp => {
        const card = document.createElement("div");
        card.className = "employee-card";
        const statusClass = emp.employmentType === "FullTime" ? "status-ft" : "status-pt";
        const statusText = emp.employmentType === "FullTime" ? "Full Time" : "Part Time";
        card.innerHTML = `
          <div class="card-header-custom">
            <span class="emp-id"><i class="bi bi-upc-scan"></i> ${emp.employeeId || 'N/A'}</span>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          <div class="emp-name">${escapeHtml(emp.name || 'Unnamed')}</div>
          <div class="emp-dept"><i class="bi bi-building"></i> ${escapeHtml(emp.department || '—')} · ${escapeHtml(emp.position || '—')}</div>
          <div class="card-actions">
            <button class="btn btn-outline-primary btn-sm view-detail-btn" data-id="${emp.id}"><i class="bi bi-eye"></i> View</button>
            <button class="btn btn-outline-secondary btn-sm edit-detail-btn" data-id="${emp.id}"><i class="bi bi-pencil-square"></i> Edit</button>
            <button class="btn btn-outline-danger btn-sm delete-employee-btn" data-id="${emp.id}" data-name="${escapeHtml(emp.name)}"><i class="bi bi-trash3"></i> Delete</button>
          </div>
        `;
        gridContainer.appendChild(card);
      });

      // attach event listeners for view/edit/delete
      document.querySelectorAll('.view-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          openDetailModal(id, 'view');
        });
      });
      document.querySelectorAll('.edit-detail-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          openDetailModal(id, 'edit');
        });
      });
      document.querySelectorAll('.delete-employee-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-name');
          confirmDelete(id, name);
        });
      });
    }

    async function openDetailModal(empId, mode = 'view') {
      if (!detailModal) detailModal = new bootstrap.Modal(document.getElementById('detailModal'));
      const employee = employees.find(emp => emp.id === empId);
      if (!employee) return;
      currentEditId = empId;
      currentEmployeeData = { ...employee };
      const modalBody = document.getElementById('detailModalBody');
      const modalFooter = document.getElementById('modalFooter');
      const modalTitleSpan = document.getElementById('modalTitle');
      
      if (mode === 'view') {
        modalTitleSpan.innerText = "Employee Details";
        modalBody.innerHTML = renderDetailView(employee);
        modalFooter.innerHTML = `
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
          <button type="button" class="btn btn-primary" id="switchToEditBtn"><i class="bi bi-pencil"></i> Edit Employee</button>
        `;
        document.getElementById('switchToEditBtn')?.addEventListener('click', () => {
          detailModal.hide();
          setTimeout(() => openDetailModal(empId, 'edit'), 300);
        });
      } 
      else { // edit mode
        modalTitleSpan.innerText = "Edit Employee";
        modalBody.innerHTML = renderEditForm(employee);
        modalFooter.innerHTML = `
          <button type="button" class="btn btn-secondary" id="cancelEditBtn">Cancel</button>
          <button type="button" class="btn btn-success" id="saveUpdateBtn"><i class="bi bi-check-lg"></i> Update Employee</button>
        `;
        document.getElementById('cancelEditBtn')?.addEventListener('click', () => {
          detailModal.hide();
        });
        document.getElementById('saveUpdateBtn')?.addEventListener('click', async () => {
          await saveUpdatedEmployee(empId);
        });
      }
      detailModal.show();
    }

    function renderDetailView(emp) {
      return `
        <div class="detail-section">
          <div><span class="detail-label"><i class="bi bi-person-badge"></i> Full Name:</span> ${escapeHtml(emp.name || '—')}</div>
          <div class="mt-2"><span class="detail-label"><i class="bi bi-upc-scan"></i> Employee ID:</span> ${escapeHtml(emp.employeeId || '—')}</div>
          <div class="mt-2"><span class="detail-label"><i class="bi bi-building"></i> Department:</span> ${escapeHtml(emp.department || '—')}</div>
          <div class="mt-2"><span class="detail-label"><i class="bi bi-briefcase"></i> Position:</span> ${escapeHtml(emp.position || '—')}</div>
          <div class="mt-2"><span class="detail-label"><i class="bi bi-clock-history"></i> Employment:</span> ${emp.employmentType === 'FullTime' ? 'Full Time' : 'Part Time'}</div>
          <div class="mt-2"><span class="detail-label"><i class="bi bi-envelope"></i> Email:</span> ${escapeHtml(emp.email || '—')}</div>
          <div class="mt-2"><span class="detail-label"><i class="bi bi-telephone"></i> Phone:</span> ${escapeHtml(emp.phone || '—')}</div>
          <div class="mt-2"><span class="detail-label"><i class="bi bi-calendar3"></i> Join Date:</span> ${emp.joinDate ? emp.joinDate : '—'}</div>
        </div>
      `;
    }

    function renderEditForm(emp) {
      return `
        <div class="detail-section edit-mode">
          <div class="mb-3"><label class="fw-bold">Full Name *</label><input type="text" id="editName" class="form-control" value="${escapeHtml(emp.name || '')}"></div>
          <div class="mb-3"><label class="fw-bold">Employee ID *</label><input type="text" id="editEmpId" class="form-control" value="${escapeHtml(emp.employeeId || '')}"></div>
          <div class="mb-3"><label class="fw-bold">Department</label>
            <select id="editDept" class="form-select"><option value="Front Office" ${emp.department === 'Front Office' ? 'selected' : ''}>Front Office</option><option value="Workshop" ${emp.department === 'Workshop' ? 'selected' : ''}>Workshop</option></select>
          </div>
          <div class="mb-3"><label class="fw-bold">Position</label><input type="text" id="editPosition" class="form-control" value="${escapeHtml(emp.position || '')}"></div>
          <div class="mb-3"><label class="fw-bold">Employment Type</label>
            <select id="editEmpType" class="form-select"><option value="FullTime" ${emp.employmentType === 'FullTime' ? 'selected' : ''}>Full Time</option><option value="PartTime" ${emp.employmentType === 'PartTime' ? 'selected' : ''}>Part Time</option></select>
          </div>
          <div class="mb-3"><label class="fw-bold">Email</label><input type="email" id="editEmail" class="form-control" value="${escapeHtml(emp.email || '')}"></div>
          <div class="mb-3"><label class="fw-bold">Phone</label><input type="text" id="editPhone" class="form-control" value="${escapeHtml(emp.phone || '')}"></div>
          <div class="mb-3"><label class="fw-bold">Join Date</label><input type="date" id="editJoinDate" class="form-control" value="${emp.joinDate || ''}"></div>
        </div>
      `;
    }

    async function saveUpdatedEmployee(id) {
      const updatedData = {
        name: document.getElementById('editName')?.value.trim() || "No Name",
        employeeId: document.getElementById('editEmpId')?.value.trim() || "",
        department: document.getElementById('editDept')?.value,
        position: document.getElementById('editPosition')?.value.trim() || "",
        employmentType: document.getElementById('editEmpType')?.value,
        email: document.getElementById('editEmail')?.value.trim() || "",
        phone: document.getElementById('editPhone')?.value.trim() || "",
        joinDate: document.getElementById('editJoinDate')?.value || "",
      };
      if (!updatedData.name || !updatedData.employeeId) {
        alert("Name and Employee ID are required.");
        return;
      }
      try {
        await getEmployeesCollection().doc(id).update(updatedData);
        // update local array
        const index = employees.findIndex(emp => emp.id === id);
        if (index !== -1) employees[index] = { id, ...updatedData };
        applyFiltersAndRender();
        if (detailModal) detailModal.hide();
        alert("Employee updated successfully!");
      } catch (err) {
        console.error("Update error:", err);
        alert("Update failed: " + err.message);
      }
    }

    async function confirmDelete(id, name) {
      const userConfirmed = confirm(`⚠️ Permanently delete "${name}"? This action cannot be undone.`);
      if (!userConfirmed) return;
      try {
        await getEmployeesCollection().doc(id).delete();
        employees = employees.filter(emp => emp.id !== id);
        applyFiltersAndRender();
        if (detailModal) detailModal.hide();
        alert("Employee record deleted.");
      } catch (err) {
        alert("Delete error: " + err.message);
      }
    }

    function escapeHtml(str) {
      if (!str) return '';
      return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      }).replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, function(c) {
        return c;
      });
    }

    // Event listeners for search & filters
    searchInput.addEventListener('input', () => applyFiltersAndRender());
    deptFilter.addEventListener('change', () => applyFiltersAndRender());
    statusFilter.addEventListener('change', () => applyFiltersAndRender());

    // Wait for firebase config
    window.addEventListener('load', () => {
      const waitForFirebase = setInterval(() => {
        if (window.db && window.firebase) {
          clearInterval(waitForFirebase);
          loadEmployees();
        } else if (typeof firebase !== 'undefined' && firebase.apps.length && !window.db) {
          console.warn("re-check firebase-config, ensure db export");
        }
      }, 400);
      setTimeout(() => {
        if (employees.length === 0 && window.db) loadEmployees();
      }, 1500);
    });

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