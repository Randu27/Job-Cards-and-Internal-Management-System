// Sidebar toggle functionality
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const closeBtn = document.getElementById('closeBtn');

// Open sidebar
menuToggle.addEventListener('click', () => {
    sidebar.classList.add('active');
    overlay.classList.add('active');
});

// Close sidebar
closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});

// Close sidebar when clicking overlay
overlay.addEventListener('click', () => {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
});