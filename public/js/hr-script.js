// =============================== 
// HR SYSTEM (SAFE VERSION)
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  // =========================
  // SAFETY: Ensure Firebase loaded
  // =========================
  if (!window.firebase) {
    console.error("Firebase not loaded");
    return;
  }

  // =========================
  // Popup
  // =========================
  function showPopup(type, title, message) {
    const existing = document.getElementById("hrPopupOverlay");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "hrPopupOverlay";
    overlay.innerHTML = `
      <div class="hr-popup ${type}">
        <div>${title}</div>
        <div>${message}</div>
      </div>`;
    document.body.appendChild(overlay);

    setTimeout(() => overlay.remove(), 3000);
  }

  // =========================
  // Validators
  // =========================
  const isValidName = v => /^[a-zA-Z\s.\-']{2,}$/.test(v.trim());
  const isValidEmpId = v => /^[a-zA-Z0-9\-_]{3,15}$/.test(v.trim());
  const isValidNIC = v => /^[0-9]{9}[VX]$/.test(v.toUpperCase()) || /^[0-9]{12}$/.test(v);
  const isValidEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidContact = v => /^(0[0-9]{9}|\+94[0-9]{9})$/.test(v.replace(/[\s-]/g, ""));

  // ============================================================
  // ADD + EDIT FORM
  // ============================================================
  let isEditMode = false;

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

    form.addEventListener("submit", async function (e) {
      e.preventDefault();

      // validation
      if (!isValidName(empName.value)) return showPopup("error","Error","Invalid name");
      if (!isValidEmpId(empId.value)) return showPopup("error","Error","Invalid ID");

      const data = {
        name: empName.value.trim(),
        status: empStatus.value,
        department: empDept.value,
        joinDate: empJoinDate.value,
        nic: empNic.value.trim(),
        address: empAddress.value.trim(),
        email: empEmail.value.trim(),
        contact: empContact.value.trim(),
        remarks: empRemarks.value.trim()
      };

      try {
        if (isEditMode) {
          await firebase.firestore().collection("employees").doc(empId.value).update(data);
          showPopup("success","Updated","Employee updated");
        } else {
          await firebase.firestore().collection("employees").doc(empId.value).set(data);
          showPopup("success","Added","Employee added");
        }

        form.reset();
        isEditMode = false;

      } catch (err) {
        console.error(err);
        showPopup("error","Error","Database failed");
      }
    });

    // expose edit fill
    window.fillFormForEdit = function(emp) {
      empName.value = emp.name || "";
      empId.value = emp.id || "";
      empStatus.value = emp.status || "";
      empDept.value = emp.department || "";
      empJoinDate.value = emp.joinDate || "";
      empNic.value = emp.nic || "";
      empAddress.value = emp.address || "";
      empEmail.value = emp.email || "";
      empContact.value = emp.contact || "";
      empRemarks.value = emp.remarks || "";

      isEditMode = true;
    };
  }

  // ============================================================
  // EMPLOYEE MANAGEMENT LIST
  // ============================================================
  let allEmployees = [];

  async function loadEmployees() {
    try {
      const snapshot = await firebase.firestore().collection("employees").get();
      allEmployees = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      renderList(allEmployees);
    } catch (e) {
      console.error("Load error", e);
    }
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

  // SAFE click handler (no inline onclick)
  document.getElementById("empList")?.addEventListener("click", function(e){
    const card = e.target.closest(".emp-row-card");
    if (!card) return;

    const id = card.dataset.id;
    const emp = allEmployees.find(e => e.id === id);
    if (!emp) return;

    if (typeof window.fillFormForEdit === "function") {
      window.fillFormForEdit({ ...emp, id });
    }
  });

  loadEmployees();

  // ============================================================
  // EMAIL PAGE
  // ============================================================
  if (document.getElementById("emailPageContainer")) {
    (async function(){
      try {
        const snapshot = await firebase.firestore().collection("employees").get();
        console.log("Email employees:", snapshot.size);
      } catch(e){
        console.error("Email load error", e);
      }
    })();
  }

  // ============================================================
  // PRINT PAGE (SAFE)
  // ============================================================
  if (document.getElementById("reportArea")) {

    (async function(){
      try {
        const snapshot = await firebase.firestore().collection("employees").get();
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const tbody = document.getElementById("reportTbody");
        if (!tbody) return;

        tbody.innerHTML = data.map(emp => `
          <tr>
            <td>${emp.id}</td>
            <td>${emp.name}</td>
            <td>${emp.department}</td>
            <td>${emp.status}</td>
          </tr>
        `).join("");

      } catch(e){
        console.error("Print error", e);
      }
    })();
  }

});