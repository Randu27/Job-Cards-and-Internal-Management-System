// Create animated background circles
  function createBackgroundCircles() {
    const container = document.getElementById('bgAnimation');
    const circleCount = 8;
    
    for (let i = 0; i < circleCount; i++) {
      const circle = document.createElement('div');
      circle.className = 'circle';
      const size = Math.random() * 100 + 50;
      circle.style.width = size + 'px';
      circle.style.height = size + 'px';
      circle.style.left = Math.random() * 100 + '%';
      circle.style.animationDelay = Math.random() * 20 + 's';
      circle.style.animationDuration = Math.random() * 10 + 15 + 's';
      container.appendChild(circle);
    }
  }
  
  createBackgroundCircles();
  
  // Role selection
  let selectedRole = null;
  const roleCards = document.querySelectorAll('.role-card');
  const roleGrid = document.getElementById('roleGrid');
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const alertMessage = document.getElementById('alertMessage');
  
  roleCards.forEach(card => {
    card.addEventListener('click', function() {
      roleCards.forEach(c => c.classList.remove('selected'));
      this.classList.add('selected');
      selectedRole = this.dataset.role;
      
      // Clear any previous alerts
      alertMessage.innerHTML = '';
    });
  });
  
  // Show alert message
  function showAlert(message, type = 'error') {
    alertMessage.innerHTML = `
      <div class="alert-custom alert-${type}">
        <i class="bi bi-${type === 'error' ? 'exclamation-triangle' : 'check-circle'}"></i>
        <span>${message}</span>
      </div>
    `;
    
    setTimeout(() => {
      if (alertMessage.children[0]) {
        alertMessage.children[0].style.opacity = '0';
        setTimeout(() => {
          alertMessage.innerHTML = '';
        }, 300);
      }
    }, 5000);
  }
  
  // Login function
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!selectedRole) {
      showAlert('Please select your role before logging in', 'error');
      return;
    }
    
    if (!email || !password) {
      showAlert('Please enter both email and password', 'error');
      return;
    }
    
    // Disable login button
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<span class="spinner-small"></span> Logging in...';
    
    try {
      // Sign in with Firebase Auth
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Get user role from Firestore
      let userDoc = await firebase.firestore().collection('users').doc(user.uid).get();

// If document NOT found → first login case
if (!userDoc.exists) {

  // Find user by email
  const query = await firebase.firestore()
    .collection('users')
    .where('email', '==', user.email)
    .limit(1)
    .get();

  if (!query.empty) {
    const doc = query.docs[0];

    // Copy data to correct UID
    await firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .set(doc.data());

    // Delete old temp document
    await firebase.firestore()
      .collection('users')
      .doc(doc.id)
      .delete();

    // Get updated document
    userDoc = await firebase.firestore()
      .collection('users')
      .doc(user.uid)
      .get();
  }
}
      
      let userRole = null;
      let userData = {};
      
      if (userDoc.exists) {
        userData = userDoc.data();
        userRole = userData.role;
      }
      
      // 🚨 FIRST LOGIN CHECK
    if (userData.isFirstLogin) {
    showAlert('First login detected. Please change your password.', 'success');

    setTimeout(() => {
    window.location.href = "../pages/change-password.html";
    }, 1500);

    return; // STOP further execution
    }
      // Check if role matches
      if (userRole && userRole !== selectedRole) {
        showAlert(`You are registered as ${formatRoleName(userRole)}. Please select the correct role or contact admin.`, 'error');
        await firebase.auth().signOut();
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
        return;
      }
      
      // If user doesn't have role in Firestore, create it (for demo)
      if (!userDoc.exists) {
        await firebase.firestore().collection('users').doc(user.uid).set({
          email: user.email,
          role: selectedRole,
          name: user.displayName || email.split('@')[0],
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      // Store user info in session
      sessionStorage.setItem('userRole', selectedRole);
      sessionStorage.setItem('userEmail', user.email);
      sessionStorage.setItem('userName', userData.name || email.split('@')[0]);
      sessionStorage.setItem('userId', user.uid);
      
      showAlert('Login successful! Redirecting...', 'success');
      
      // Redirect based on role
      setTimeout(() => {
        switch(selectedRole) {
          case 'order_manager':
            window.location.href = '../pages/order_manager/order_dashboard.html';
            break;
          case 'financial_manager':
            window.location.href = '../pages/financial_manager/financial_dashboard.html';
            break;
          case 'resource_manager':
            window.location.href = '../pages/R.coordinater/resource.html';
            break;
          case 'customer_manager':
            window.location.href = '../pages/Client_profile/CRMIndex.html';
            break;
          case 'hr_manager':
            window.location.href = '../pages/HR_Manager/hr-index.html';
            break;
          default:
            window.location.href = 'dashboard.html';
        }
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Invalid email or password';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      
      showAlert(errorMessage, 'error');
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';
    }
  });
  
  function formatRoleName(role) {
    const roleNames = {
      'order_manager': 'Order Manager',
      'financial_manager': 'Financial Manager',
      'resource_manager': 'Resource Manager',
      'customer_manager': 'Customer Manager',
      'hr_manager': 'HR Manager'
    };
    return roleNames[role] || role;
  }
  
  // Check if already logged in
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      const savedRole = sessionStorage.getItem('userRole');
      if (savedRole) {
        // Already logged in, redirect to appropriate dashboard
        switch(savedRole) {
          case 'order_manager':
            window.location.href = '../pages/order_manager/order_dashboard.html';
            break;
          case 'financial_manager':
            window.location.href = '../pages/financial_manager/financial_dashboard.html';
            break;
          case 'resource_manager':
            window.location.href = '../pages/R.coordinater/resource.html';
            break;
          case 'customer_manager':
            window.location.href = '../pages/Client_profile/CRMIndex.html';
            break;
          case 'hr_manager':
            window.location.href = '../pages/HR_Manager/hr-index.html';
            break;
        }
      }
    }
  });