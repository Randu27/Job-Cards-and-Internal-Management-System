// ===============================
// HR - Shared Popup Helper
// ===============================

// Global popup function (used by all HR pages)
function showPopup(type, title, message) {
  // Remove existing popup if any
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
  
  // Auto close after 4 seconds
  const timer = setTimeout(() => {
    if (overlay && overlay.remove) overlay.remove();
  }, 4000);
  
  // Close button handler
  const closeBtn = document.getElementById("hrPopupClose");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      clearTimeout(timer);
      if (overlay && overlay.remove) overlay.remove();
    });
  }
}

// ===============================
// HR - Common Functions
// ===============================

// Format date for display
function formatDateForDisplay(dateString) {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  } catch {
    return dateString;
  }
}

// Format status for display (database -> display)
function formatStatusForDisplay(status) {
  if (!status) return "—";
  if (status === "FullTime") return "Full Time";
  if (status === "PartTime") return "Part Time";
  return status;
}

// Format status for database (display -> database)
function formatStatusForDatabase(status) {
  if (!status) return "";
  if (status === "Full Time") return "FullTime";
  if (status === "Part Time") return "PartTime";
  return status;
}

// Get badge class based on status
function getStatusBadgeClass(status) {
  if (!status) return "badge-parttime";
  const dbStatus = status === "FullTime" ? "fulltime" : status.toLowerCase();
  return dbStatus === "fulltime" ? "badge-fulltime" : "badge-parttime";
}

// Validation functions (reusable across pages)
const Validators = {
  name: (v) => /^[a-zA-Z\s.\-']{2,}$/.test(v.trim()),
  empId: (v) => /^[a-zA-Z0-9\-_]{3,15}$/.test(v.trim()),
  nic: (v) => {
    const nic = v.trim().toUpperCase();
    return /^[0-9]{9}[VX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
  },
  contact: (v) => {
    const cleaned = v.trim().replace(/[\s\-]/g, "");
    return /^(0[1-9][0-9]{7,8}|\+94[1-9][0-9]{8})$/.test(cleaned);
  },
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
  address: (v) => v.trim().length >= 5,
  date: (v) => {
    if (!v) return false;
    const chosen = new Date(v);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return chosen <= today;
  }
};

// Firebase error message mapper
function getFirebaseErrorMessage(code) {
  const messages = {
    "permission-denied": "You don't have permission to perform this action. Please contact your admin.",
    "already-exists": "This record already exists. Please use a unique identifier.",
    "not-found": "Record not found in the database.",
    "unavailable": "Service is currently unavailable. Please check your internet connection.",
    "storage/unauthorized": "You are not authorized to upload images.",
    "storage/canceled": "Image upload was cancelled. Please try again.",
    "storage/unknown": "An unknown error occurred during image upload.",
    "failed-precondition": "Operation failed. Please try again.",
    "aborted": "Operation was aborted. Please try again.",
    "deadline-exceeded": "Request timed out. Please check your connection.",
    "resource-exhausted": "Too many requests. Please wait a moment and try again.",
  };
  return messages[code] || `An unexpected error occurred (${code || "unknown"}). Please try again.`;
}

// Escape HTML to prevent XSS
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ===============================
// HR - Add Employee Page
// ===============================

if (document.getElementById("addEmployeeForm")) {
  
  const form = document.getElementById("addEmployeeForm");
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
  const empImage = document.getElementById("empImage");
  const imagePreview = document.getElementById("imagePreview");

  // Image Preview
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

  // Helper functions for validation UI
  function markValid(field) {
    if (!field) return;
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
  }

  function markInvalid(field) {
    if (!field) return;
    field.classList.remove("is-valid");
    field.classList.add("is-invalid");
  }

  function highlightField(field) {
    if (!field) return;
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");
    field.focus();
    field.addEventListener("input", () => field.classList.remove("is-invalid"), { once: true });
  }

  // Get validation error
  function getValidationError() {
    if (!empName.value.trim())
      return { field: empName, msg: "Please enter the <strong>Employee Name</strong>." };
    if (!Validators.name(empName.value))
      return { field: empName, msg: "<strong>Employee Name</strong> should only contain letters, spaces, dots, or hyphens (min 2 characters)." };

    if (!empId.value.trim())
      return { field: empId, msg: "Please enter the <strong>Employee ID</strong>." };
    if (!Validators.empId(empId.value))
      return { field: empId, msg: "<strong>Employee ID</strong> must be 3–15 alphanumeric characters (letters, numbers, - or _)." };

    if (!empStatus.value)
      return { field: empStatus, msg: "Please select an <strong>Employment Status</strong>." };

    if (!empDept.value)
      return { field: empDept, msg: "Please select a <strong>Department</strong>." };

    if (!empJoinDate.value)
      return { field: empJoinDate, msg: "Please select the <strong>Date Joined</strong>." };
    if (!Validators.date(empJoinDate.value))
      return { field: empJoinDate, msg: "<strong>Date Joined</strong> cannot be a future date." };

    if (!empNic.value.trim())
      return { field: empNic, msg: "Please enter the <strong>NIC</strong> number." };
    if (!Validators.nic(empNic.value))
      return { field: empNic, msg: "<strong>NIC</strong> must be in old format (9 digits + V/X, e.g. <em>901234567V</em>) or new format (12 digits, e.g. <em>200012345678</em>)." };

    if (!empAddress.value.trim())
      return { field: empAddress, msg: "Please enter the <strong>Address</strong>." };
    if (!Validators.address(empAddress.value))
      return { field: empAddress, msg: "<strong>Address</strong> must be at least 5 characters long." };

    if (!empEmail.value.trim())
      return { field: empEmail, msg: "Please enter the <strong>Email</strong> address." };
    if (!Validators.email(empEmail.value))
      return { field: empEmail, msg: "Please enter a <strong>valid Email</strong> address (e.g. <em>name@example.com</em>)." };

    if (!empContact.value.trim())
      return { field: empContact, msg: "Please enter the <strong>Contact Number</strong>." };
    if (!Validators.contact(empContact.value))
      return { field: empContact, msg: "<strong>Contact Number</strong> must be a valid Sri Lankan number (e.g. <em>0771234567</em> or <em>+94771234567</em>)." };

    return null;
  }

  // Real-time blur validation
  if (empName) empName.addEventListener("blur", () => {
    empName.value.trim() && Validators.name(empName.value) ? markValid(empName) : markInvalid(empName);
  });

  if (empId) empId.addEventListener("blur", () => {
    empId.value.trim() && Validators.empId(empId.value) ? markValid(empId) : markInvalid(empId);
  });

  if (empStatus) empStatus.addEventListener("change", () => {
    empStatus.value ? markValid(empStatus) : markInvalid(empStatus);
  });

  if (empDept) empDept.addEventListener("change", () => {
    empDept.value ? markValid(empDept) : markInvalid(empDept);
  });

  if (empJoinDate) empJoinDate.addEventListener("blur", () => {
    Validators.date(empJoinDate.value) ? markValid(empJoinDate) : markInvalid(empJoinDate);
  });

  if (empNic) empNic.addEventListener("blur", () => {
    Validators.nic(empNic.value) ? markValid(empNic) : markInvalid(empNic);
  });

  if (empAddress) empAddress.addEventListener("blur", () => {
    Validators.address(empAddress.value) ? markValid(empAddress) : markInvalid(empAddress);
  });

  if (empEmail) empEmail.addEventListener("blur", () => {
    Validators.email(empEmail.value) ? markValid(empEmail) : markInvalid(empEmail);
  });

  if (empContact) empContact.addEventListener("blur", () => {
    Validators.contact(empContact.value) ? markValid(empContact) : markInvalid(empContact);
  });

  // Form Submit
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      form.classList.remove("was-validated");

      const validationError = getValidationError();
      if (validationError) {
        highlightField(validationError.field);
        showPopup("error", "Missing Information", validationError.msg);
        return;
      }

      const submitBtn = form.querySelector(".add-btn");
      if (!submitBtn) return;
      
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Saving...`;

      try {
        let imageUrl = "";

        // Upload image if selected
        const file = empImage?.files[0];
        if (file) {
          try {
            const storageRef = firebase.storage().ref("employees/" + empId.value.trim());
            await storageRef.put(file);
            imageUrl = await storageRef.getDownloadURL();
          } catch (imgErr) {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            showPopup("error", "Image Upload Failed", getFirebaseErrorMessage(imgErr.code));
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
          name: empName.value.trim(),
          status: empStatus.value,
          department: empDept.value,
          joinDate: empJoinDate.value,
          nic: empNic.value.trim(),
          address: empAddress.value.trim(),
          email: empEmail.value.trim(),
          contact: empContact.value.trim(),
          remarks: empRemarks?.value.trim() || "",
          image: imageUrl,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        const addedName = empName.value.trim();
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        form.reset();
        if (imagePreview) imagePreview.style.display = "none";
        form.classList.remove("was-validated");

        // Clear validation classes
        [empName, empId, empStatus, empDept, empJoinDate, empNic, empAddress, empEmail, empContact].forEach(field => {
          if (field) {
            field.classList.remove("is-valid", "is-invalid");
          }
        });

        showPopup("success", "Employee Added!", `<strong>${addedName}</strong> has been successfully added to the system.`);

      } catch (error) {
        console.error(error);
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        showPopup("error", "Something Went Wrong", getFirebaseErrorMessage(error.code));
      }
    });
  }
}

// ===============================
// HR - Update Employee Page
// ===============================

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
      empStatus: formatStatusForDisplay(data.status),
      empDepartment: data.department || "—",
      empJoinDate: formatDateForDisplay(data.joinDate),
      empNic: data.nic || "—",
      empAddress: data.address || "—",
      empEmail: data.email || "—",
      empContact: data.contact || "—",
      empRemarks: data.remarks || "—",
    };

    // Hide form inputs
    form.querySelectorAll("input, select, textarea").forEach(el => el.style.display = "none");
    form.querySelectorAll(".form-label").forEach(el => el.style.display = "none");

    // Remove existing panel
    const oldPanel = document.getElementById("empInfoPanel");
    if (oldPanel) oldPanel.remove();

    const panel = document.createElement("div");
    panel.id = "empInfoPanel";
    panel.style.cssText = "margin-bottom: 1rem;";

    const row = document.createElement("div");
    row.className = "row g-3";

    const leftFields = ["empName", "empId", "empStatus", "empDepartment", "empJoinDate", "empNic", "empAddress"];
    const rightFields = ["empEmail", "empContact", "empRemarks"];

    const labels = {
      empName: "Employee Name", empId: "Employee ID", empStatus: "Status",
      empDepartment: "Department", empJoinDate: "Date Joined", empNic: "NIC",
      empAddress: "Address", empEmail: "Email", empContact: "Contact Number",
      empRemarks: "Remarks"
    };

    [leftFields, rightFields].forEach(group => {
      const col = document.createElement("div");
      col.className = "col-md-6";
      group.forEach(key => {
        const item = document.createElement("div");
        item.className = "mb-3";
        item.innerHTML = `
          <strong>${labels[key]}:</strong><br>
          <span>${escapeHtml(displayData[key])}</span>
        `;
        col.appendChild(item);
      });
      row.appendChild(col);
    });

    panel.appendChild(row);
    const btnRow = form.querySelector(".d-flex.gap-2");
    if (btnRow) form.insertBefore(panel, btnRow);
    
    form.style.display = "block";
    if (updateBtn) updateBtn.disabled = true;
    if (editBtn) editBtn.disabled = false;
  }

  function showEditMode() {
    const oldPanel = document.getElementById("empInfoPanel");
    if (oldPanel) oldPanel.remove();

    form.querySelectorAll("input, select, textarea").forEach(el => el.style.display = "");
    form.querySelectorAll(".form-label").forEach(el => el.style.display = "");

    if (empName) empName.value = currentData.name || "";
    if (empId) empId.value = currentEmployeeId;
    if (empStatus) empStatus.value = currentData.status || "";
    if (empJoinDate) empJoinDate.value = currentData.joinDate || "";
    if (empNic) empNic.value = currentData.nic || "";
    if (empAddress) empAddress.value = currentData.address || "";
    if (empEmail) empEmail.value = currentData.email || "";
    if (empContact) empContact.value = currentData.contact || "";
    if (empRemarks) empRemarks.value = currentData.remarks || "";
    
    if (empDept) {
      for (let opt of empDept.options) {
        if (opt.value === (currentData.department || "")) {
          empDept.value = opt.value;
          break;
        }
      }
    }

    const fields = [empName, empStatus, empJoinDate, empNic, empAddress, empEmail, empContact, empRemarks];
    fields.forEach(f => { if (f) f.readOnly = false; });
    if (empDept) empDept.disabled = false;
    if (empId) empId.readOnly = true;
    if (updateBtn) updateBtn.disabled = false;
    if (editBtn) editBtn.disabled = true;
  }

  function populateForm(data, id) {
    currentData = data;
    currentEmployeeId = id;
    showViewMode(data, id);
  }

  async function searchEmployee() {
    const id = searchInput?.value.trim();
    if (!id) {
      showPopup("error", "No ID Entered", "Please enter an Employee ID to search.");
      return;
    }

    if (searchBtn) {
      searchBtn.disabled = true;
      searchBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Searching...`;
    }

    try {
      const doc = await firebase.firestore().collection("employees").doc(id).get();
      
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = "Search";
      }

      if (!doc.exists) {
        if (form) form.style.display = "none";
        currentEmployeeId = null;
        showPopup("error", "Not Found", `No employee found with ID ${id}.`);
        return;
      }
      
      currentEmployeeId = id;
      populateForm(doc.data(), id);
      showPopup("success", "Employee Found", `Loaded details for ${doc.data().name}.`);

    } catch (err) {
      if (searchBtn) {
        searchBtn.disabled = false;
        searchBtn.innerHTML = "Search";
      }
      console.error(err);
      showPopup("error", "Search Failed", getFirebaseErrorMessage(err.code));
    }
  }

  if (searchBtn) searchBtn.addEventListener("click", searchEmployee);
  if (searchInput) searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchEmployee(); });

  if (editBtn) {
    editBtn.addEventListener("click", () => {
      if (!currentEmployeeId) {
        showPopup("error", "No Employee Loaded", "Please search for an employee first.");
        return;
      }
      showEditMode();
      showPopup("success", "Edit Mode Enabled", "Fields are now editable. Click Update to save changes.");
    });
  }

  function getUpdateValidationError() {
    if (!empName?.value.trim()) return { field: empName, msg: "Please enter the Employee Name." };
    if (!Validators.name(empName.value)) return { field: empName, msg: "Employee Name should contain only letters, spaces, dots, or hyphens." };
    if (!empStatus?.value.trim()) return { field: empStatus, msg: "Please select a Status." };
    if (!empDept?.value) return { field: empDept, msg: "Please select a Department." };
    if (!empJoinDate?.value) return { field: empJoinDate, msg: "Please select the Date Joined." };
    if (!Validators.date(empJoinDate.value)) return { field: empJoinDate, msg: "Date Joined cannot be a future date." };
    if (!empNic?.value.trim()) return { field: empNic, msg: "Please enter the NIC number." };
    if (!Validators.nic(empNic.value)) return { field: empNic, msg: "NIC must be in valid format." };
    if (!empAddress?.value.trim()) return { field: empAddress, msg: "Please enter the Address." };
    if (!Validators.address(empAddress.value)) return { field: empAddress, msg: "Address must be at least 5 characters." };
    if (!empEmail?.value.trim()) return { field: empEmail, msg: "Please enter the Email address." };
    if (!Validators.email(empEmail.value)) return { field: empEmail, msg: "Please enter a valid Email address." };
    if (!empContact?.value.trim()) return { field: empContact, msg: "Please enter the Contact Number." };
    if (!Validators.contact(empContact.value)) return { field: empContact, msg: "Contact Number must be a valid Sri Lankan number." };
    return null;
  }

  function highlightFieldU(field) {
    if (!field) return;
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");
    field.focus();
    field.addEventListener("input", () => field.classList.remove("is-invalid"), { once: true });
  }

  if (updateBtn) {
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
          remarks: empRemarks?.value.trim() || "",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        updateBtn.innerHTML = "Update";
        currentData = {
          name: empName.value.trim(),
          status: empStatus.value,
          department: empDept.value,
          joinDate: empJoinDate.value,
          nic: empNic.value.trim(),
          address: empAddress.value.trim(),
          email: empEmail.value.trim(),
          contact: empContact.value.trim(),
          remarks: empRemarks?.value.trim() || ""
        };
        
        showViewMode(currentData, currentEmployeeId);
        showPopup("success", "Updated Successfully", `${empName.value.trim()}'s details have been saved.`);

      } catch (error) {
        console.error(error);
        updateBtn.disabled = false;
        updateBtn.innerHTML = "Update";
        showPopup("error", "Update Failed", getFirebaseErrorMessage(error.code));
      }
    });
  }

  if (deleteBtn) {
    deleteBtn.addEventListener("click", () => {
      if (!currentEmployeeId) {
        showPopup("error", "No Employee Loaded", "Please search for an employee first.");
        return;
      }
      const modal = new bootstrap.Modal(document.getElementById("deleteModal"));
      if (modal) modal.show();
    });
  }

  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", async () => {
      if (!currentEmployeeId) return;
      
      const modal = bootstrap.Modal.getInstance(document.getElementById("deleteModal"));
      if (modal) modal.hide();
      
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1"></span> Deleting...`;

      try {
        const deletedName = empName?.value.trim() || currentEmployeeId;
        await firebase.firestore().collection("employees").doc(currentEmployeeId).delete();
        
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = "Delete";
        
        if (form) form.style.display = "none";
        if (searchInput) searchInput.value = "";
        currentEmployeeId = null;
        
        showPopup("success", "Employee Deleted", `${deletedName} has been removed from the system.`);

      } catch (error) {
        console.error(error);
        confirmDeleteBtn.disabled = false;
        confirmDeleteBtn.innerHTML = "Delete";
        showPopup("error", "Delete Failed", getFirebaseErrorMessage(error.code));
      }
    });
  }
}

// ===============================
// HR - Employee Directory Page
// ===============================

if (document.getElementById("dirList")) {
  
  let allEmployees = [];
  let currentEmpId = null;
  let isEditMode = false;

  const dirList = document.getElementById("dirList");
  const searchInput = document.getElementById("dirSearch");
  const filterDept = document.getElementById("filterDept");
  const filterStatus = document.getElementById("filterStatus");
  const countNum = document.getElementById("countNum");

  async function loadDirectory() {
    renderSkeletons();
    try {
      const snap = await firebase.firestore()
        .collection("employees")
        .orderBy("name")
        .get();

      allEmployees = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      applyFilters();
    } catch (err) {
      console.error(err);
      if (dirList) {
        dirList.innerHTML = `
          <div class="col-12">
            <div class="empty-state">
              <i class="bi bi-wifi-off"></i>
              <p>Could not load employees. Please check your connection.</p>
            </div>
          </div>`;
      }
    }
  }

  function renderSkeletons(n = 6) {
    if (!dirList) return;
    dirList.innerHTML = Array.from({ length: n }, () => `
      <div class="col-md-6 col-lg-4">
        <div class="skeleton-card">
          <div class="sk-circle"></div>
          <div class="sk-lines">
            <div class="sk-line"></div>
            <div class="sk-line short"></div>
          </div>
        </div>
      </div>`).join("");
  }

  function applyFilters() {
    if (!allEmployees.length) return;
    
    const q = searchInput?.value.trim().toLowerCase() || "";
    const dept = filterDept?.value || "";
    const stat = filterStatus?.value || "";

    const filtered = allEmployees.filter(e => {
      const matchQ = !q ||
        (e.name || "").toLowerCase().includes(q) ||
        (e.id || "").toLowerCase().includes(q) ||
        (e.email || "").toLowerCase().includes(q) ||
        (e.nic || "").toLowerCase().includes(q) ||
        (e.contact || "").toLowerCase().includes(q);
      
      const matchDept = !dept || (e.department || "") === dept;
      
      let matchStat = !stat;
      if (stat === "Full Time") {
        matchStat = (e.status || "").toLowerCase() === "fulltime";
      } else if (stat === "Part Time") {
        matchStat = (e.status || "").toLowerCase() === "parttime";
      }
      
      return matchQ && matchDept && matchStat;
    });

    if (countNum) countNum.textContent = filtered.length;
    renderCards(filtered);
  }

  function renderCards(list) {
    if (!dirList) return;
    
    if (!list.length) {
      dirList.innerHTML = `
        <div class="col-12">
          <div class="empty-state">
            <i class="bi bi-person-x"></i>
            <p>No employees match your search.</p>
          </div>
        </div>`;
      return;
    }

    dirList.innerHTML = list.map(e => {
      const initial = (e.name || "?")[0].toUpperCase();
      const avatar = e.image
        ? `<img src="${escapeHtml(e.image)}" class="emp-avatar" alt="${escapeHtml(e.name)}">`
        : `<div class="emp-avatar-placeholder">${initial}</div>`;
      const displayStatus = formatStatusForDisplay(e.status);
      const badgeClass = getStatusBadgeClass(e.status);

      return `
        <div class="col-md-6 col-lg-4">
          <div class="emp-card" onclick="openEmployeeModal('${escapeHtml(e.id)}')">
            ${avatar}
            <div class="emp-card-info">
              <div class="emp-card-name">${escapeHtml(e.name || "—")}</div>
              <div class="emp-card-meta">
                <span><i class="bi bi-hash"></i>${escapeHtml(e.id)}</span>
                <span><i class="bi bi-building"></i>${escapeHtml(e.department || "—")}</span>
              </div>
              <div class="mt-1">
                <span class="badge-status ${badgeClass}">${escapeHtml(displayStatus)}</span>
              </div>
            </div>
          </div>
        </div>`;
    }).join("");
  }

  window.openEmployeeModal = function (id) {
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;
    currentEmpId = id;
    isEditMode = false;

    populateViewMode(emp);
    showViewMode();
    const modal = document.getElementById("empModal");
    if (modal) {
      modal.style.display = "flex";
      document.body.style.overflow = "hidden";
    }
  };

  function populateViewMode(emp) {
    const initial = (emp.name || "?")[0].toUpperCase();
    const modalAvatarWrap = document.getElementById("modalAvatarWrap");
    if (modalAvatarWrap) {
      modalAvatarWrap.innerHTML = emp.image
        ? `<img src="${escapeHtml(emp.image)}" class="dir-modal-avatar" alt="${escapeHtml(emp.name)}">`
        : `<div class="dir-modal-avatar-ph">${initial}</div>`;
    }
    
    const modalName = document.getElementById("modalName");
    if (modalName) modalName.textContent = emp.name || "—";
    
    const modalSub = document.getElementById("modalSub");
    if (modalSub) {
      const displayStatus = formatStatusForDisplay(emp.status);
      modalSub.textContent = `${emp.id} · ${emp.department || "—"} · ${displayStatus}`;
    }

    const fields = [
      { label: "Employee ID", val: emp.id },
      { label: "Status", val: formatStatusForDisplay(emp.status) },
      { label: "Department", val: emp.department },
      { label: "Date Joined", val: formatDateForDisplay(emp.joinDate) },
      { label: "NIC", val: emp.nic },
      { label: "Contact", val: emp.contact },
      { label: "Email", val: emp.email, full: true },
      { label: "Address", val: emp.address, full: true },
      { label: "Remarks", val: emp.remarks || "—", full: true },
    ];

    const detailGrid = document.getElementById("detailGrid");
    if (detailGrid) {
      detailGrid.innerHTML = fields.map(f => `
        <div class="detail-item ${f.full ? "full" : ""}">
          <label>${f.label}</label>
          <div class="val">${escapeHtml(f.val || "—")}</div>
        </div>`).join("");
    }
  }

  window.enterEditMode = function () {
    const emp = allEmployees.find(e => e.id === currentEmpId);
    if (!emp) return;
    isEditMode = true;

    const editName = document.getElementById("editName");
    const editEmpId = document.getElementById("editEmpId");
    const editStatus = document.getElementById("editStatus");
    const editDept = document.getElementById("editDept");
    const editJoinDate = document.getElementById("editJoinDate");
    const editNic = document.getElementById("editNic");
    const editAddress = document.getElementById("editAddress");
    const editEmail = document.getElementById("editEmail");
    const editContact = document.getElementById("editContact");
    const editRemarks = document.getElementById("editRemarks");
    
    if (editName) editName.value = emp.name || "";
    if (editEmpId) editEmpId.value = emp.id;
    if (editStatus) {
      let statusValue = "Part Time";
      if (emp.status) {
        statusValue = emp.status.toLowerCase() === "fulltime" ? "Full Time" : "Part Time";
      }
      editStatus.value = statusValue;
    }
    if (editDept) editDept.value = emp.department || "";
    if (editJoinDate) editJoinDate.value = emp.joinDate || "";
    if (editNic) editNic.value = emp.nic || "";
    if (editAddress) editAddress.value = emp.address || "";
    if (editEmail) editEmail.value = emp.email || "";
    if (editContact) editContact.value = emp.contact || "";
    if (editRemarks) editRemarks.value = emp.remarks || "";
  }
}
