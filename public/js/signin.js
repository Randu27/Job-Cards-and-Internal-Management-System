// Dark Mode Toggle
const themeToggle = document.getElementById('themeToggle');
const moonIcon = document.getElementById('moonIcon');
const sunIcon = document.getElementById('sunIcon');
let isLoggingIn = false;

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    moonIcon.style.display = 'none';
    sunIcon.style.display = 'inline';
}

// Toggle theme
themeToggle.addEventListener('click', function () {
    document.body.classList.toggle('dark-mode');

    if (document.body.classList.contains('dark-mode')) {
        moonIcon.style.display = 'none';
        sunIcon.style.display = 'inline';
        localStorage.setItem('theme', 'dark');
    } else {
        moonIcon.style.display = 'inline';
        sunIcon.style.display = 'none';
        localStorage.setItem('theme', 'light');
    }
});

document.getElementById('togglePassword')?.addEventListener('click', function () {
    const passwordInput = document.getElementById('password');
    const showIcon = this.querySelector('.show-icon');
    const hideIcon = this.querySelector('.hide-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        showIcon.style.display = 'none';
        hideIcon.style.display = 'inline';
    } else {
        passwordInput.type = 'password';
        showIcon.style.display = 'inline';
        hideIcon.style.display = 'none';
    }


});




// ROLE → DASHBOARD MAPPING

// const ROLE_DASHBOARDS = {
//     admin: 'pages/admin/admin_dashboard.html',
//     order_manager: 'pages/order_manager/order_dashboard.html',
//     financial_manager: 'pages/financial_manager/financial_dashboard.html',
//     resource_manager: 'pages/resource_manager/resource_dashboard.html',
//     customer_manager: 'pages/customer_manager/customer_dashboard.html',
//     hr_manager: 'pages/hr_manager/hr_dashboard.html'
// };


// // AUTH STATE CHANGE
// auth.onAuthStateChanged((user) => {
//     const isLoginPage = window.location.pathname.includes('index.html') ||
//         window.location.pathname === '/';

//     // Skip if we're in the middle of a login attempt
//     if (isLoggingIn) return;

//     if (user && isLoginPage) {
//         db.collection('users').doc(user.uid).get().then((doc) => {
//             if (doc.exists) {
//                 const role = doc.data().role;
//                 const dashboardURL = ROLE_DASHBOARDS[role] || 'pages/dashboard.html';
//                 window.location.href = dashboardURL;
//             }
//         });
//     }
// });

// // LOGIN FORM SUBMIT
// document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
//     e.preventDefault();

//     const email = document.getElementById('email').value.trim();
//     const password = document.getElementById('password').value;
//     const selectedRole = document.getElementById('role').value;
//     const errorDiv = document.getElementById('error-message');
//     const btnLogin = document.querySelector('.btn-login');

//     if (!selectedRole) {
//         showError(errorDiv, 'Please select a role');
//         return;
//     }

//     btnLogin.disabled = true;
//     btnLogin.textContent = 'Signing in...';
//     isLoggingIn = true;   //  block onAuthStateChanged from firing 

//     try {
//         const userCredential = await auth.signInWithEmailAndPassword(email, password);
//         const user = userCredential.user;

//         const userDoc = await db.collection('users').doc(user.uid).get();

//         if (!userDoc.exists) {
//             showError(errorDiv, 'User data not found. Please contact HR Manager.');
//             await auth.signOut();
//             btnLogin.disabled = false;
//             btnLogin.textContent = 'Login';
//             isLoggingIn = false;
//             return;
//         }

//         const userData = userDoc.data();

//         if (userData.isActive === false) {
//             showError(errorDiv, 'Your account has been disabled. Contact HR Manager.');
//             await auth.signOut();
//             btnLogin.disabled = false;
//             btnLogin.textContent = 'Login';
//             isLoggingIn = false;
//             return;
//         }

//         // STRICT ROLE CHECK
//         if (userData.role !== selectedRole) {
//             showError(errorDiv, `Access Denied! You are not authorized as "${formatRole(selectedRole)}".`);
//             await auth.signOut();
//             btnLogin.disabled = false;
//             btnLogin.textContent = 'Login';
//             isLoggingIn = false;   // unblock only after signOut completes
//             return;
//         }

//         // All checks passed — store session
//         sessionStorage.setItem('userId', user.uid);
//         sessionStorage.setItem('userRole', userData.role);
//         sessionStorage.setItem('userName', userData.name);
//         sessionStorage.setItem('userEmail', user.email);

//         showSuccess(`Welcome, ${userData.name}! Redirecting...`);

//         const dashboardURL = ROLE_DASHBOARDS[userData.role] || 'pages/dashboard.html';
//         setTimeout(() => {
//             isLoggingIn = false;
//             window.location.href = dashboardURL;
//         }, 1000);

//     } catch (error) {
//         console.error('Login error:', error);
//         showError(errorDiv, getErrorMessage(error.code));
//         btnLogin.disabled = false;
//         btnLogin.textContent = 'Login';
//         isLoggingIn = false;
//     }
// });


// // LOGOUT — Call this from any dashboard page

// function logout() {
//     auth.signOut().then(() => {
//         sessionStorage.clear();
//         window.location.href = '../../index.html'; // adjust path depth as needed
//     }).catch((error) => {
//         console.error('Logout error:', error);
//     });
// }


// // ROUTE GUARD — Add this to every dashboard page's JS
// // Usage: guardRoute('order_manager');

// function guardRoute(requiredRole) {
//     const storedRole = sessionStorage.getItem('userRole');
//     if (!storedRole || storedRole !== requiredRole) {
//         sessionStorage.clear();
//         window.location.href = '../../index.html';
//     }
// }


// // HELPERS

// function showError(element, message) {
//     element.textContent = message;
//     element.style.background = '#ffe6e6';
//     element.style.color = '#e74c3c';
//     element.classList.add('show');
//     setTimeout(() => element.classList.remove('show'), 5000);
// }

// function showSuccess(message) {
//     const errorDiv = document.getElementById('error-message');
//     errorDiv.textContent = message;
//     errorDiv.style.background = '#d4edda';
//     errorDiv.style.color = '#155724';
//     errorDiv.classList.add('show');
// }

// function formatRole(role) {
//     return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
// }

// function getErrorMessage(errorCode) {
//     const messages = {
//         'auth/invalid-email': 'Invalid email address',
//         'auth/user-disabled': 'This account has been disabled',
//         'auth/user-not-found': 'No account found with this email',
//         'auth/wrong-password': 'Incorrect password',
//         'auth/network-request-failed': 'Network error. Please check your connection',
//         'auth/too-many-requests': 'Too many failed attempts. Please try again later',
//         'auth/invalid-credential': 'Invalid email or password',
//     };
//     return messages[errorCode] || 'Login failed. Please check your credentials';
// }



document.getElementById('loginForm')?.addEventListener('submit', function (e) {
    e.preventDefault();

    // Directly go to Order Dashboard
    window.location.href = "pages/order_manager/order_dashboard.html";
});