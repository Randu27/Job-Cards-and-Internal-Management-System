// ─── Page Access Config ──────────────────────────────────────────────────────
// Maps page key → URL (relative to auth/login/)
const PAGE_ROUTES = {
  order_manager: '../pages/order_manager/order_dashboard.html',
  financial_manager: '../pages/financial_manager/financial_dashboard.html',
  resource_manager: '../pages/R.coordinater/resource.html',
  customer_manager: '../pages/Client_profile/CRMIndex.html',
  hr_manager: '../pages/HR_Manager/hr-index.html',
};

// All available page module keys (used to grant full access to owner)
const ALL_PAGE_KEYS = [
  'order_management',
  'crm',
  'financial_management',
  'human_resources',
  'resource_coordinator',
];

// ─── Page Guard (call on every protected page) ───────────────────────────────
// Usage: guardPage('order_management')  — put at top of each dashboard script
window.guardPage = function (pageKey) {
  const role = sessionStorage.getItem('userRole');
  if (!role) { window.location.href = _loginPath(); return; }
  if (role === 'order_manager') return; // Owner has full access
  const granted = _getGrantedPages();
  if (!granted.includes(pageKey)) { window.location.href = _deniedPath(); }
};

function _loginPath() {
  const isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  return isLocal ? '/public/index.html' : '/';
}
function _deniedPath() {
  const segs = window.location.pathname.split('/').filter(Boolean);
  const depth = segs.length - 1;
  return '../'.repeat(Math.max(depth, 0)) + 'auth/login/access-denied.html';
}
function _getGrantedPages() {
  try { return JSON.parse(sessionStorage.getItem('grantedPages') || '[]'); }
  catch { return []; }
}

// ─── Background Animation ────────────────────────────────────────────────────
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

// ─── DOM References ──────────────────────────────────────────────────────────
const dropdownContainer = document.getElementById('roleDropdown');
const dropdownSelectedEl = document.getElementById('dropdownSelected');
const roleOptions = document.querySelectorAll('.dropdown-option');
const hiddenRoleInput = document.getElementById('selectedRoleInput');
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const alertMessage = document.getElementById('alertMessage');

// ─── Role State ───────────────────────────────────────────────────────────────
let selectedRole = '';
let selectedRoleName = '';

// ─── Alert Helper ─────────────────────────────────────────────────────────────
function showAlert(message, type = 'error') {
  if (!alertMessage) return;
  const icon = type === 'error' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill';
  alertMessage.innerHTML = `
    <div class="alert-custom alert-${type}">
      <i class="bi ${icon}"></i>
      <span>${message}</span>
    </div>
  `;
  if (type !== 'success') setTimeout(() => { alertMessage.innerHTML = ''; }, 5000);
}

// ─── Dropdown Logic ───────────────────────────────────────────────────────────
function toggleDropdown() {
  if (dropdownContainer) dropdownContainer.classList.toggle('active');
}

function closeDropdown() {
  if (dropdownContainer) dropdownContainer.classList.remove('active');
}

function setSelectedRole(roleValue, roleName) {
  selectedRole = roleValue;
  selectedRoleName = roleName;
  if (hiddenRoleInput) hiddenRoleInput.value = roleValue;
  if (dropdownSelectedEl) {
    dropdownSelectedEl.innerHTML = `
      <span>${roleName}</span>
      <i class="bi bi-chevron-down dropdown-arrow"></i>
    `;
  }
  closeDropdown();
  if (alertMessage) alertMessage.innerHTML = '';
}

if (dropdownSelectedEl) {
  dropdownSelectedEl.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleDropdown();
  });
}

roleOptions.forEach(option => {
  option.addEventListener('click', (e) => {
    e.stopPropagation();
    const roleVal = option.getAttribute('data-role');
    const roleName = option.getAttribute('data-name');
    if (roleVal) setSelectedRole(roleVal, roleName);
  });
});

document.addEventListener('click', (e) => {
  if (dropdownContainer && !dropdownContainer.contains(e.target)) closeDropdown();
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

// ─── Format Role Name ─────────────────────────────────────────────────────────
function formatRoleName(role) {
  const roleNames = {
    order_manager: 'Owner',
    financial_manager: 'Receptionist',
    resource_manager: 'Front Office Manager',
    customer_manager: 'Shop Keeper',
    hr_manager: 'HR Manager',
  };
  return roleNames[role] || role;
}

// ─── Redirect Helper ──────────────────────────────────────────────────────────
function redirectAfterLogin(role, grantedPages) {
  if (role === 'order_manager') {
    window.location.href = PAGE_ROUTES.order_manager;
    return;
  }
  // Non-owners: go to their first granted page, or the role default if none set
  if (grantedPages && grantedPages.length > 0) {
    const pageKeyToRoute = {
      order_management: '../pages/order_manager/order_dashboard.html',
      crm: '../pages/Client_profile/CRMIndex.html',
      financial_management: '../pages/financial_manager/financial_dashboard.html',
      human_resources: '../pages/HR_Manager/hr-index.html',
      resource_coordinator: '../pages/R.coordinater/resource.html',
    };
    const first = grantedPages[0];
    if (pageKeyToRoute[first]) { window.location.href = pageKeyToRoute[first]; return; }
  }
  // Fallback to role default
  window.location.href = PAGE_ROUTES[role] || 'dashboard.html';
}

// ─── Login Form Submit ────────────────────────────────────────────────────────
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!selectedRole) {
      showAlert('Please select your role before logging in.', 'error');
      return;
    }

    if (!email || !password) {
      showAlert('Please enter both email and password.', 'error');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-small"></span> Authenticating...';

    try {
      // Sign in with Firebase
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Fetch Firestore user doc
      let userDoc = await firebase.firestore().collection('users').doc(user.uid).get();

      // First-login: migrate temp document to UID-keyed document
      if (!userDoc.exists) {
        const query = await firebase.firestore()
          .collection('users')
          .where('email', '==', user.email)
          .limit(1)
          .get();

        if (!query.empty) {
          const doc = query.docs[0];
          await firebase.firestore().collection('users').doc(user.uid).set(doc.data());
          await firebase.firestore().collection('users').doc(doc.id).delete();
          userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        }
      }

      let userRole = null;
      let userData = {};

      if (userDoc.exists) {
        userData = userDoc.data();
        userRole = userData.role;
      }

      // ── Role mismatch check ──
      if (userRole && userRole !== selectedRole) {
        showAlert(
          `You are registered as ${formatRoleName(userRole)}. Please select the correct role or contact admin.`,
          'error'
        );
        await firebase.auth().signOut();
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
        return;
      }

      // ── New user — save role to Firestore ──
      if (!userDoc.exists) {
        await firebase.firestore().collection('users').doc(user.uid).set({
          email: user.email,
          role: selectedRole,
          name: user.displayName || email.split('@')[0],
          grantedPages: selectedRole === 'order_manager' ? ALL_PAGE_KEYS : [],
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
        userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
        userData = userDoc.data();
      }

      // ── Determine granted pages ──
      const grantedPages = selectedRole === 'order_manager'
        ? ALL_PAGE_KEYS
        : (userData.grantedPages || []);

      // ── Save session ──
      sessionStorage.setItem('userRole', selectedRole);
      sessionStorage.setItem('userEmail', user.email);
      sessionStorage.setItem('userName', userData.name || email.split('@')[0]);
      sessionStorage.setItem('userId', user.uid);
      sessionStorage.setItem('grantedPages', JSON.stringify(grantedPages));

      // ── First login → force password change (Owner only, or any flagged user) ──
      if (userData.isFirstLogin) {
        showAlert('First login detected. Please set your password.', 'success');
        setTimeout(() => {
          window.location.href = '../pages/change-password.html';
        }, 1200);
        return;
      }

      showAlert('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        redirectAfterLogin(selectedRole, grantedPages);
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);

      const errorMessages = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/invalid-email': 'Invalid email format.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/invalid-credential': 'Invalid email or password.',
      };

      showAlert(errorMessages[error.code] || 'Invalid email or password.', 'error');
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
    }
  });
}

// ─── Auth State: Redirect if Already Logged In ───────────────────────────────
if (typeof firebase !== 'undefined') {
  firebase.auth().onAuthStateChanged((user) => {
    if (user && loginForm) {
      const savedRole = sessionStorage.getItem('userRole');
      const savedGranted = _getGrantedPages();
      if (savedRole) {
        redirectAfterLogin(savedRole, savedGranted);
      }
    }
  });
}

// ─── Logout (available globally on all pages) ────────────────────────────────
window.logout = async function () {
  try { await firebase.auth().signOut(); } catch (e) { /* ignore */ }
  sessionStorage.clear();
  window.location.href = _loginPath();
};
window.openLogoutModal = function () { const m = document.getElementById('logoutModal'); if (m) m.style.display = 'flex'; };
window.closeLogoutModal = function () { const m = document.getElementById('logoutModal'); if (m) m.style.display = 'none'; };

// ─── Init ─────────────────────────────────────────────────────────────────────
createBackgroundCircles();
restorePreviousRole();