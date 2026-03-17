// script.js - Human Resources page functionality

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    
    // Prevent page reload when clicking Human Resources link
    const hrLink = document.querySelector('a[href="/hr/index.html"], a[href="hr/index.html"], a[href="./index.html"]');
    
    if (hrLink) {
        hrLink.addEventListener('click', function(e) {
            e.preventDefault(); // Stops the page from reloading
            console.log('Already on Human Resources page');
            
            // Optional: Close the offcanvas menu after clicking
            try {
                const offcanvasElement = document.getElementById('sidebarMenu');
                if (offcanvasElement) {
                    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
                    if (offcanvas) {
                        offcanvas.hide();
                    }
                }
            } catch (error) {
                console.log('Offcanvas not available');
            }
        });
    }
    
    // Add active link flash effect (optional)
    const activeLink = document.querySelector('.nav-link.active');
    if (activeLink) {
        activeLink.addEventListener('click', function(e) {
            // Quick flash effect
            this.style.backgroundColor = '#2c3e50';
            this.style.transition = 'background-color 0.2s';
            setTimeout(() => {
                this.style.backgroundColor = '';
            }, 200);
        });
    }
    
    // Handle all nav links to close offcanvas after navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Close offcanvas after clicking any link
            try {
                const offcanvasElement = document.getElementById('sidebarMenu');
                if (offcanvasElement) {
                    const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasElement);
                    if (offcanvas) {
                        setTimeout(() => {
                            offcanvas.hide();
                        }, 150); // Small delay to ensure navigation starts
                    }
                }
            } catch (error) {
                console.log('Offcanvas not available');
            }
        });
    });
    
    // Logo error handling (if image doesn't load)
    const logo = document.querySelector('.navbar-brand img');
    if (logo) {
        logo.addEventListener('error', function() {
            this.onerror = null; // Prevent infinite loop
            this.src = 'https://via.placeholder.com/150x65/ffe785/000000?text=GPH';
            console.log('Logo failed to load, using placeholder');
        });
    }
    
    console.log('HR page script loaded successfully');
});

// Optional: Add any HR-specific functions below
function showNotification(message, type = 'info') {
    console.log(`[${type}] ${message}`);
    // You can expand this to show toast notifications later
}

// Export functions if needed (for modular JS)
// export { showNotification };


// Add Employee Form Validation
const form = document.getElementById("addEmployeeForm");

if (form) {
    form.addEventListener("submit", function (e) {
        e.preventDefault(); // Stop page reload

        const notificationArea = document.getElementById("notificationArea");

        if (form.checkValidity()) {
            // SUCCESS
            notificationArea.innerHTML = `
                <div class="alert alert-success mt-3">
                    Employee successfully added!
                </div>
            `;

            form.reset(); // Clear form
        } else {
            // ERROR
            notificationArea.innerHTML = `
                <div class="alert alert-danger mt-3">
                    You must fill all the required information!
                </div>
            `;
        }
    });
}

// Bootstrap validation styling
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


// ===============================
// HR - Update Employee Page
// Hard-coded Demo Version
// ===============================

document.addEventListener("DOMContentLoaded", function () {

  // ===============================
  // Fake Database (Object format)
  // ===============================
  let employees = {
    "E001": {
      name: "John Silva",
      status: "Active",
      department: "front office",
      joinDate: "2023-01-10",
      nic: "200012345678",
      address: "Negombo",
      email: "john@gmail.com",
      contact: "0771234567",
      remarks: "Senior staff member"
    },
    "E002": {
      name: "Kasun Perera",
      status: "Inactive",
      department: "Workshop",
      joinDate: "2022-05-15",
      nic: "199912345678",
      address: "Colombo",
      email: "kasun@gmail.com",
      contact: "0719876543",
      remarks: "On leave"
    }
  };

  let currentEmployeeId = null;

  // ===============================
  // Get Elements
  // ===============================
  const form = document.getElementById("employeeForm");
  const searchBtn = document.getElementById("searchBtn");
  const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
  const toast = new bootstrap.Toast(document.getElementById("successToast"));

  // Form Fields
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

  const editBtn = document.getElementById("editBtn");
  const updateBtn = document.getElementById("updateBtn");
  const deleteBtn = document.getElementById("deleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

  // ===============================
  // Toast Function
  // ===============================
  function showToast(message) {
    document.getElementById("toastMessage").innerText = message;
    toast.show();
  }

  // ===============================
  // Loading Spinner
  // ===============================
  function showLoading() {
    searchBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Searching...';
    searchBtn.disabled = true;
  }

  function hideLoading() {
    searchBtn.innerHTML = "Search";
    searchBtn.disabled = false;
  }

  // ===============================
  // Disable / Enable Form
  // ===============================
  function disableForm(state) {
    form.querySelectorAll("input, select, textarea").forEach(el => {
      if (el.id !== "empId") {
        el.disabled = state;
      }
    });

    updateBtn.disabled = true;
  }

  // ===============================
  // SEARCH Employee
  // ===============================
  searchBtn.addEventListener("click", function () {

    const id = document.getElementById("employeeSearch").value.trim();

    if (!id) {
      showToast("Please enter Employee ID");
      return;
    }

    showLoading();

    // Simulate server delay
    setTimeout(() => {

      hideLoading();

      if (!employees[id]) {
        showToast("Employee not found!");
        form.style.display = "none";
        return;
      }

      const data = employees[id];
      currentEmployeeId = id;

      empId.value = id;
      empName.value = data.name;
      empStatus.value = data.status;
      empDepartment.value = data.department;
      empJoinDate.value = data.joinDate;
      empNic.value = data.nic;
      empAddress.value = data.address;
      empEmail.value = data.email;
      empContact.value = data.contact;
      empRemarks.value = data.remarks;

      form.style.display = "block";
      disableForm(true);

      showToast("Employee loaded successfully!");

    }, 800);

  });

  // ===============================
  // EDIT Button
  // ===============================
  editBtn.addEventListener("click", function () {

    if (!currentEmployeeId) {
      showToast("Search employee first!");
      return;
    }

    disableForm(false);
    updateBtn.disabled = false;
  });

  // ===============================
  // UPDATE Button
  // ===============================
  updateBtn.addEventListener("click", function () {

    if (!currentEmployeeId) return;

    employees[currentEmployeeId] = {
      name: empName.value,
      status: empStatus.value,
      department: empDepartment.value,
      joinDate: empJoinDate.value,
      nic: empNic.value,
      address: empAddress.value,
      email: empEmail.value,
      contact: empContact.value,
      remarks: empRemarks.value
    };

    disableForm(true);
    showToast("Changes saved successfully!");
  });

  // ===============================
  // DELETE Button (Open Modal)
  // ===============================
  deleteBtn.addEventListener("click", function () {

    if (!currentEmployeeId) {
      showToast("Search employee first!");
      return;
    }

    deleteModal.show();
  });

  // ===============================
  // CONFIRM DELETE
  // ===============================
  confirmDeleteBtn.addEventListener("click", function () {

    delete employees[currentEmployeeId];

    currentEmployeeId = null;

    form.reset();
    form.style.display = "none";

    deleteModal.hide();

    showToast("Employee deleted successfully!");
  });

});