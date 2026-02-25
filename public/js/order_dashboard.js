
const allowedRole = 'order_manager'; // ← change this per dashboard

const storedRole = sessionStorage.getItem('userRole');

if (!storedRole || storedRole !== allowedRole) {
    window.location.href = '../../index.html';
}
