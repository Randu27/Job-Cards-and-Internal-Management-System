// ===============================
// HR - Add Employee Page
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  // =========================
  // Shared popup helper
  // =========================
  function showPopup(type, title, message) {
    const existing = document.getElementById("hrPopupOverlay");
    if (existing) existing.remove();

    const icon = type === "success"
      ? "bi-check-circle-fill"
      : "bi-exclamation-triangle-fill";

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
        <button class="hr-popup-close" id="hrPopupClose">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>`;

    document.body.appendChild(overlay);

    const timer = setTimeout(() => overlay.remove(), 4000);

    document
      .getElementById("hrPopupClose")
      .addEventListener("click", () => {
        clearTimeout(timer);
        overlay.remove();
      });
  }

  // =========================
  // Global Validators
  // =========================
  function isValidName(val) {
    return /^[a-zA-Z\s.\-']{2,}$/.test(val.trim());
  }

  function isValidEmpId(val) {
    return /^[a-zA-Z0-9\-_]{3,15}$/.test(val.trim());
  }

  function isValidNIC(val) {
    const nic = val.trim().toUpperCase();
    return /^[0-9]{9}[VX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
  }

  function isValidContact(val) {
    const cleaned = val.trim().replace(/[\s\-]/g, "");
    return /^(0[1-9][0-9]{7,8}|\+94[1-9][0-9]{8})$/.test(cleaned);
  }

  function isValidEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  }

  function isValidDate(val) {
    if (!val) return false;
    const chosen = new Date(val);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return chosen <= today;
  }

  function isValidAddress(val) {
    return val.trim().length >= 5;
  }

  // ================================================
  // ADD PAGE
  // ================================================
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

    function getValidationError() {
      if (!empName.value.trim())
        return { field: empName, msg: "Please enter Employee Name." };
      if (!isValidName(empName.value))
        return { field: empName, msg: "Invalid name." };

      if (!empId.value.trim())
        return { field: empId, msg: "Enter Employee ID." };
      if (!isValidEmpId(empId.value))
        return { field: empId, msg: "Invalid ID." };

      if (!empStatus.value)
        return { field: empStatus, msg: "Select status." };

      if (!empDept.value)
        return { field: empDept, msg: "Select department." };

      if (!empJoinDate.value || !isValidDate(empJoinDate.value))
        return { field: empJoinDate, msg: "Invalid date." };

      if (!empNic.value.trim() || !isValidNIC(empNic.value))
        return { field: empNic, msg: "Invalid NIC." };

      if (!empAddress.value.trim() || !isValidAddress(empAddress.value))
        return { field: empAddress, msg: "Invalid address." };

      if (!empEmail.value.trim() || !isValidEmail(empEmail.value))
        return { field: empEmail, msg: "Invalid email." };

      if (!empContact.value.trim() || !isValidContact(empContact.value))
        return { field: empContact, msg: "Invalid contact." };

      return null;
    }

    function highlightField(field) {
      field.classList.add("is-invalid");
      field.focus();
      field.addEventListener("input", () => field.classList.remove("is-invalid"), { once: true });
    }

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      const err = getValidationError();
      if (err) {
        highlightField(err.field);
        showPopup("error", "Error", err.msg);
        return;
      }

      try {
        await firebase.firestore().collection("employees").doc(empId.value.trim()).set({
          name: empName.value.trim(),
          status: empStatus.value,
          department: empDept.value,
          joinDate: empJoinDate.value,
          nic: empNic.value.trim(),
          address: empAddress.value.trim(),
          email: empEmail.value.trim(),
          contact: empContact.value.trim(),
          remarks: empRemarks.value.trim(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        form.reset();
        showPopup("success", "Success", "Employee added.");
      } catch (e) {
        showPopup("error", "Error", "Failed.");
      }
    });
  }

  // ================================================================
  // EMPLOYEE MANAGEMENT
  // ================================================================
  let allEmployees = [];
  let currentEmpId = null;
  let currentEmpData = {};

  async function loadEmployees() {
    const snapshot = await firebase.firestore().collection("employees").get();
    allEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    renderList(allEmployees);
  }

  function renderList(employees) {
    const list = document.getElementById("empList");
    if (!list) return;

    list.innerHTML = employees.map(emp => `
      <div class="emp-row-card" data-id="${emp.id}">
        ${emp.name}
      </div>
    `).join("");
  }

  function selectEmployee(id) {
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;
    currentEmpId = id;
    currentEmpData = emp;
  }

  // make global
  window.selectEmployee = selectEmployee;

  loadEmployees();

  // ================================================
  // PRINT PAGE
  // ================================================
  if (document.getElementById("reportArea")) {

    let allEmployeesPrint = [];

    async function loadPrintData() {
      const snapshot = await firebase.firestore().collection("employees").get();
      allEmployeesPrint = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    loadPrintData();
  }

});