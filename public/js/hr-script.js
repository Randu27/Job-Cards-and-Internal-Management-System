// ===============================
// HR - Add Employee Page (Clean Version)
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  // =========================
  // Get Elements
  // =========================
  const form = document.getElementById("addEmployeeForm");
  const notificationArea = document.getElementById("notificationArea");

  const empName = document.getElementById("empName");
  const empId = document.getElementById("empId");
  const empStatus = document.getElementById("empStatus");
  const empDepartment = document.getElementById("empDepartment");
  const empJoinDate = document.getElementById("empJoinDate");
  const empNic = document.getElementById("empNic");
  const empAddress = document.getElementById("empAddress");
  const empEmail = document.getElementById("empEmail");
  const empContact = document.getElementById("empContact");
  const empRemarks = document.getElementById("empRemarks");

  const empImage = document.getElementById("empImage");
  const imagePreview = document.getElementById("imagePreview");

  // =========================
  // Image Preview (OPTIONAL)
  // =========================
  if (empImage) {
    empImage.addEventListener("change", function () {
      const file = this.files[0];

      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          imagePreview.src = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        imagePreview.src = "https://via.placeholder.com/150";
      }
    });
  }

  // =========================
  // Show Notification
  // =========================
  function showMessage(msg, type) {
    notificationArea.innerHTML = `
      <div class="alert alert-${type} mt-3">${msg}</div>
    `;
  }

  // =========================
  // FORM SUBMIT (ADD EMPLOYEE)
  // =========================
  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      showMessage("Please fill all required fields!", "danger");
      form.classList.add("was-validated");
      return;
    }

    try {

      let imageUrl = "";

      // =========================
      // Upload Image (if selected)
      // =========================
      const file = empImage.files[0];

      if (file) {
        const storageRef = firebase.storage().ref("employees/" + empId.value);
        await storageRef.put(file);
        imageUrl = await storageRef.getDownloadURL();
      }

      // =========================
      // Save Data to Firestore
      // =========================
      await firebase.firestore().collection("employees").doc(empId.value).set({
        name: empName.value,
        status: empStatus.value,
        department: empDepartment.value,
        joinDate: empJoinDate.value,
        nic: empNic.value,
        address: empAddress.value,
        email: empEmail.value,
        contact: empContact.value,
        remarks: empRemarks.value,
        image: imageUrl || "" // optional
      });

      showMessage("Employee added successfully!", "success");

      form.reset();
      imagePreview.src = "https://via.placeholder.com/150";
      form.classList.remove("was-validated");

    } catch (error) {
      console.error(error);
      showMessage("Error adding employee!", "danger");
    }
  });

});


// ===============================
// Bootstrap Validation Styling
// ===============================
(function () {
  'use strict'
  const forms = document.querySelectorAll('.needs-validation')

  Array.from(forms).forEach(function (form) {
    form.addEventListener('submit', function (event) {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }
      form.classList.add('was-validated')
    }, false)
  })
})();