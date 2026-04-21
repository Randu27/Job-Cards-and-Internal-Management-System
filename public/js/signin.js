// ─── Page Access Config ──────────────────────────────────────────────────────
const PAGE_ROUTES = {
  order_manager:     '../pages/order_manager/order_dashboard.html',
  financial_manager: '../pages/financial_manager/financial_dashboard.html',
  resource_manager:  '../pages/R.coordinater/resource.html',
  customer_manager:  '../pages/Client_profile/CRMIndex.html',
};

const ALL_PAGE_KEYS = [
  'order_management',
  'crm',
  'financial_management',
  'human_resources',
  'resource_coordinator',
];

// Guard with Alert
window.guardPage = function (pageKey) {
  const role = sessionStorage.getItem('userRole');
  if (!role) {
    window.location.href = '../../auth/login/index.html';
    return;
  }
  if (role === 'order_manager') return;

  const granted = JSON.parse(sessionStorage.getItem('grantedPages') || '[]');
  if (!granted.includes(pageKey)) {
    alert("Access Denied!\n\nYou don't have permission to access this page.\nPlease contact the Owner.");
    setTimeout(() => {
      window.location.href = '../../auth/login/index.html';
    }, 1800);
  }
};

// ─── Background Animation ───────────────────────────────────────────────────
function createBackgroundCircles() {
  const container = document.getElementById('bgAnimation');
  if (!container) return;
  for (let i = 0; i < 20; i++) {
    const circle = document.createElement('div');
    circle.className = 'circle';
    const size = Math.random() * 100 + 30;
    circle.style.width = size + 'px';
    circle.style.height = size + 'px';
    circle.style.left = Math.random() * 100 + '%';
    circle.style.bottom = `-${Math.random() * 50}px`;
    circle.style.animationDuration = (Math.random() * 15 + 8) + 's';
    circle.style.animationDelay = (Math.random() * 5) + 's';
    circle.style.opacity = Math.random() * 0.25 + 0.05;
    container.appendChild(circle);
  }
}

// ─── Your Original Login Code (Dropdown + Form) ─────────────────────────────
const dropdownContainer  = document.getElementById('roleDropdown');
const dropdownSelectedEl = document.getElementById('dropdownSelected');
const roleOptions        = document.querySelectorAll('.dropdown-option');
const hiddenRoleInput    = document.getElementById('selectedRoleInput');
const loginForm          = document.getElementById('loginForm');
const loginBtn           = document.getElementById('loginBtn');
const alertMessage       = document.getElementById('alertMessage');

let selectedRole = '';
let selectedRoleName = '';

function showAlert(message, type = 'error') {
  const icon = type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill';
  alertMessage.innerHTML = `
    <div class="alert-custom alert-${type}">
      <i class="bi ${icon}"></i>
      <span>${message}</span>
    </div>
  `;
  setTimeout(() => { alertMessage.innerHTML = ''; }, 5000);
}

function toggleDropdown() { dropdownContainer.classList.toggle('active'); }
function closeDropdown() { dropdownContainer.classList.remove('active'); }

function setSelectedRole(roleValue, roleName) {
  selectedRole = roleValue;
  selectedRoleName = roleName;
  hiddenRoleInput.value = roleValue;
  dropdownSelectedEl.innerHTML = `<span>${roleName}</span><i class="bi bi-chevron-down dropdown-arrow"></i>`;
  closeDropdown();
}

dropdownSelectedEl.addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(); });

roleOptions.forEach(option => {
  option.addEventListener('click', (e) => {
    e.stopPropagation();
    const roleVal = option.getAttribute('data-role');
    const roleName = option.getAttribute('data-name');
    if (roleVal) setSelectedRole(roleVal, roleName);
  });
});

document.addEventListener('click', (e) => {
  if (!dropdownContainer.contains(e.target)) closeDropdown();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDropdown();
});

function restorePreviousRole() {
  const prevRole = sessionStorage.getItem('userRole');
  if (prevRole) {
    const match = document.querySelector(`.dropdown-option[data-role="${prevRole}"]`);
    if (match) setSelectedRole(prevRole, match.getAttribute('data-name'));
  }
}

function formatRoleName(role) {
  const roleNames = {
    order_manager: 'Owner',
    financial_manager: 'Receptionist',
    resource_manager: 'Front Office Manager',
    customer_manager: 'Shop Keeper',
  };
  return roleNames[role] || role;
}

// Login Form
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!selectedRole) return showAlert('Please select your role.', 'error');
  if (!email || !password) return showAlert('Please enter email and password.', 'error');

  loginBtn.disabled = true;
  loginBtn.innerHTML = '<span class="spinner-small"></span> Authenticating...';

  try {
    const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
    const user = userCredential.user;

    let userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    let userData = userDoc.exists ? userDoc.data() : {};

    const grantedPages = userData.grantedPages || (selectedRole === 'order_manager' ? ALL_PAGE_KEYS : []);

    sessionStorage.setItem('userRole', selectedRole);
    sessionStorage.setItem('userEmail', user.email);
    sessionStorage.setItem('userName', userData.name || email.split('@')[0]);
    sessionStorage.setItem('userId', user.uid);
    sessionStorage.setItem('grantedPages', JSON.stringify(grantedPages));

    showAlert('Login successful! Redirecting...', 'success');

    setTimeout(() => {
      window.location.href = PAGE_ROUTES[selectedRole] || 'dashboard.html';
    }, 1200);

  } catch (error) {
    showAlert('Invalid email or password.', 'error');
    loginBtn.disabled = false;
    loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
  }
});

// Init
createBackgroundCircles();
restorePreviousRole();