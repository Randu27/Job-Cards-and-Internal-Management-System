// ─── Page Routes ─────────────────────────────────────────────────────────────
function _publicPath(path) {
  const isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  return isLocal ? '/public' + path : path;
}

const PAGE_ROUTES = {
  order_manager: _publicPath('/pages/order_manager/order_dashboard.html'),
  financial_manager: _publicPath('/pages/financial_manager/financial_dashboard.html'),
  resource_manager: _publicPath('/pages/R.coordinater/resource.html'),
  customer_manager: _publicPath('/pages/Client_profile/CRMIndex.html'),
  hr_manager: _publicPath('/pages/HR_Manager/hr-index.html'),
};

const ALL_PAGE_KEYS = [
  'order_management',
  'crm',
  'financial_management',
  'human_resources',
  'resource_coordinator',
];

// ─── Path Helpers ─────────────────────────────────────────────────────────────
function _loginPath() {
  const isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  return isLocal ? '/public/index.html' : '/';
}

function _deniedPath() {
  const isLocal = window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';
  return isLocal ? '/public/404.html' : '/404.html';
}

function _getGrantedPages() {
  try { return JSON.parse(sessionStorage.getItem('grantedPages') || '[]'); }
  catch { return []; }
}

function _getRouteFromKey(key) {
  const map = {
    'order_management': PAGE_ROUTES.order_manager,
    'crm': PAGE_ROUTES.customer_manager,
    'financial_management': PAGE_ROUTES.financial_manager,
    'human_resources': PAGE_ROUTES.hr_manager,
    'resource_coordinator': PAGE_ROUTES.resource_manager,
  };
  return map[key] || _deniedPath();
}

function _showAccessDeniedPopup() {
  const existing = document.getElementById('_accessDeniedOverlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = '_accessDeniedOverlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(0,0,0,0.55);
    display: flex; align-items: center; justify-content: center;
  `;
  overlay.innerHTML = `
    <style>
      @keyframes _popIn { from { opacity:0; transform:scale(0.85) translateY(20px) } to { opacity:1; transform:scale(1) translateY(0) } }
      #_accessDeniedBox { background:#fff; border-radius:20px; padding:36px 32px 28px; max-width:380px; width:90%; text-align:center; box-shadow:0 24px 60px rgba(0,0,0,0.25); animation:_popIn 0.3s cubic-bezier(0.34,1.56,0.64,1); }
      #_accessDeniedBox ._ad-icon { width:72px; height:72px; background:#fee2e2; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
      #_accessDeniedBox ._ad-icon i { font-size:2rem; color:#dc2626; }
      #_accessDeniedBox h5 { font-size:1.2rem; font-weight:700; color:#111827; margin-bottom:10px; }
      #_accessDeniedBox p { font-size:0.9rem; color:#6b7280; margin-bottom:24px; }
      #_accessDeniedBox ._ad-btn { background:linear-gradient(135deg,#ffe785,#34495e); color:#1f2937; border:none; border-radius:10px; padding:10px 28px; font-size:0.9rem; font-weight:600; cursor:pointer; }
    </style>
    <div id="_accessDeniedBox">
      <div class="_ad-icon"><i class="bi bi-shield-lock-fill"></i></div>
      <h5>Access Restricted</h5>
      <p>Sorry. You cannot access this system.</p>
      <button class="_ad-btn" id="_adDismissBtn">Go Back</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById('_adDismissBtn').addEventListener('click', () => {
    overlay.remove();
    const granted = _getGrantedPages();
    if (granted.length > 0) {
      window.location.href = _getRouteFromKey(granted[0]);
    } else {
      window.location.href = _loginPath();
    }
  });
}

// ─── Page Guard ───────────────────────────────────────────────────────────────
window.guardPage = function (pageKey) {
  const role = sessionStorage.getItem('userRole');
  if (!role) { window.location.href = _loginPath(); return; }
  if (role === 'order_manager') return;
  const granted = _getGrantedPages();
  if (!granted.includes(pageKey)) {
    document.body.style.visibility = 'hidden';
    setTimeout(() => {
      document.body.style.visibility = '';
      _showAccessDeniedPopup();
    }, 80);
  }
};

// ─── Background Animation ─────────────────────────────────────────────────────
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

// ─── DOM References ───────────────────────────────────────────────────────────
const loginForm = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const alertMessage = document.getElementById('alertMessage');

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

// ─── Login Form Submit ────────────────────────────────────────────────────────
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showAlert('Please enter both email and password.', 'error');
      return;
    }

    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-small"></span> Authenticating...';

    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // ── Owner check ──
      if (email === "randulamunasinghe727@gmail.com") {
        sessionStorage.setItem('userRole', 'order_manager');
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('grantedPages', JSON.stringify(ALL_PAGE_KEYS));
        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => { window.location.href = PAGE_ROUTES.order_manager; }, 1500);
        return;
      }

      // ── Employee check ──
      const empQuery = await firebase.firestore()
        .collection('employees')
        .where('accessDetails.uid', '==', user.uid)
        .limit(1)
        .get();

      if (!empQuery.empty) {
        const empData = empQuery.docs[0].data().accessDetails;
        const grantedPages = empData.grantedPages || [];

        sessionStorage.setItem('userRole', empData.role);
        sessionStorage.setItem('userEmail', user.email);
        sessionStorage.setItem('grantedPages', JSON.stringify(grantedPages));

        showAlert('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          if (grantedPages.length > 0) {
            const firstKey = ALL_PAGE_KEYS.find(k => grantedPages.includes(k));
            window.location.href = _getRouteFromKey(firstKey || grantedPages[0]);
          } else {
            showAlert('No pages assigned. Please contact admin.', 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
          }
        }, 1500);

      } else {
        await firebase.auth().signOut();
        showAlert('No account found. Please contact admin.', 'error');
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
      }

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
      if (savedRole === 'order_manager') {
        window.location.href = PAGE_ROUTES.order_manager;
      } else if (savedRole && savedGranted.length > 0) {
        const firstKey = ALL_PAGE_KEYS.find(k => savedGranted.includes(k));
        window.location.href = _getRouteFromKey(firstKey || savedGranted[0]);
      }
    }
  });
}

// ─── Logout ───────────────────────────────────────────────────────────────────
window.logout = async function () {
  try { await firebase.auth().signOut(); } catch (e) { }
  sessionStorage.clear();
  window.location.href = _loginPath();
};
window.openLogoutModal = function () { const m = document.getElementById('logoutModal'); if (m) m.style.display = 'flex'; };
window.closeLogoutModal = function () { const m = document.getElementById('logoutModal'); if (m) m.style.display = 'none'; };

// ─── Init ─────────────────────────────────────────────────────────────────────
createBackgroundCircles();
