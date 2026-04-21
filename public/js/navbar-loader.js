document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById('sidebarMenu');
    if (!sidebar) return;

    // Injected HTML exactly as you specified
    sidebar.innerHTML = `
        <div class="offcanvas-header border-bottom border-secondary">
            <h5 class="offcanvas-title fw-bold text-black">Main Menu</h5>
            <button type="button" class="btn-close btn-close-black" data-bs-dismiss="offcanvas"></button>
        </div>
        <div class="offcanvas-body p-0 d-flex flex-column">
            <ul class="nav flex-column mt-3">
                <li class="nav-item"><a href="../order_manager/order_dashboard.html" class="nav-link"><i class="bi bi-card-checklist"></i> Order Admin</a></li>
                <li class="nav-item"><a href="../financial_manager/financial_dashboard.html" class="nav-link"><i class="bi bi-cash-stack"></i> Financial Management</a></li>
                <li class="nav-item"><a href="../R.coordinater/resource.html" class="nav-link"><i class="bi bi-box-seam"></i> Resource Coord.</a></li>
                <li class="nav-item"><a href="../Client_profile/CRMIndex.html" class="nav-link"><i class="bi bi-people"></i> CRM</a></li>
                <li class="nav-item"><a href="../../pages/HR_Manager/hr-index.html" class="nav-link"><i class="bi bi-person-badge"></i> Human Resources</a></li>
                
                <li class="nav-item mt-auto">
                    <hr class="mx-3 my-2 border-secondary">
                    <a href="javascript:void(0)" id="logoutTrigger" class="nav-link nav-link-logout">
                        <i class="bi bi-box-arrow-right"></i> <span>LogOut</span>
                    </a>
                </li>
            </ul>
        </div>
    `;

    // Logout Click Handler
    document.getElementById('logoutTrigger').addEventListener('click', function (e) {
        e.preventDefault();
        confirmLogout();
    });

    // Auto-Highlight Active Page logic
    const currentPath = window.location.pathname;
    sidebar.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.includes(href.split('/').pop())) {
            link.classList.add('active');
        }
    });
});

// --- Logout Modal Functions ---
function confirmLogout() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        // Fallback for pages where the modal div is missing
        if (confirm("Are you sure you want to log out?")) {
            logout();
        }
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutModal');
    if (modal) modal.style.display = 'none';
}

function logout() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().signOut();
    }
    sessionStorage.clear();
    window.location.href = _loginPath();
}