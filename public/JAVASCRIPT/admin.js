// Admin Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
});

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return '';
}

function initializeAdminDashboard() {
    const userRole = localStorage.getItem('userRole') || getCookie('userRole');
    const isAdmin = localStorage.getItem('isAdmin') === 'true' || userRole === 'admin' || getCookie('userRole') === 'admin';
    
    if (!isAdmin) {
        alert('Access Denied! Admin access required.');
        window.location.href = '../HTML/login.html';
        return;
    }

    const adminName = localStorage.getItem('adminName') || getCookie('userName') || 'Admin User';
    document.getElementById('adminName').textContent = adminName;

    // Navigation
    setupNavigation();
    
    // Sidebar toggle
    setupSidebarToggle();
    
    // Logout
    setupLogout();
    
    // Modal functionality
    setupModal();
}

function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Get the section id
            const sectionId = link.getAttribute('data-section');
            
            // Hide all sections
            sections.forEach(section => section.classList.remove('active'));
            
            // Show the selected section
            const selectedSection = document.getElementById(sectionId);
            if (selectedSection) {
                selectedSection.classList.add('active');
                
                // Update page title
                document.getElementById('pageTitle').textContent = 
                    link.querySelector('span').textContent;
            }
        });
    });
}

function setupSidebarToggle() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('sidebar-collapsed');
        });
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                // Clear admin session
                localStorage.removeItem('isAdmin');
                localStorage.removeItem('adminName');
                localStorage.removeItem('userRole');
                document.cookie = 'userRole=; path=/; max-age=0';
                document.cookie = 'userName=; path=/; max-age=0';
                
                // Redirect to login
                window.location.href = '../HTML/login.html';
            }
        });
    }
}

function setupModal() {
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('closeModal');

    if (closeModal) {
        closeModal.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// Modal Functions
function openModal(title, message) {
    const modal = document.getElementById('modal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').textContent = message;
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

// Content Verification Functions
function approveContent(contentId) {
    openModal('Content Approved', `Content "${contentId}" has been approved and published successfully.`);
    // In a real app, this would send data to the server
    setTimeout(closeModal, 2000);
}

function rejectContent(contentId) {
    openModal('Content Rejected', `Content "${contentId}" has been rejected. You can request the user to make changes.`);
    setTimeout(closeModal, 2000);
}

function requestChanges(contentId) {
    openModal('Request Changes', `Requesting changes for content "${contentId}". The user will be notified.`);
    setTimeout(closeModal, 2000);
}

function viewContent(contentId) {
    openModal('View Content', `Opening published content for "${contentId}"...`);
    setTimeout(closeModal, 2000);
}

// Review Management Functions
function deleteReview(reviewId) {
    if (confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
        openModal('Review Deleted', `Review "${reviewId}" has been permanently deleted.`);
        setTimeout(closeModal, 2000);
    }
}

function warnUser(userId) {
    openModal('Warning Sent', `A warning has been sent to user "${userId}". They have been notified of the policy violation.`);
    setTimeout(closeModal, 2000);
}

function banUser(userId) {
    if (confirm('Are you sure you want to ban this user? They will not be able to access the platform.')) {
        openModal('User Banned', `User "${userId}" has been banned from the platform.`);
        setTimeout(closeModal, 2000);
    }
}

// Table Search and Filter Functions
function setupTableSearch() {
    const searchInputs = document.querySelectorAll('.search-input');
    const tables = document.querySelectorAll('.admin-table');

    searchInputs.forEach((input, index) => {
        input.addEventListener('keyup', () => {
            const filter = input.value.toLowerCase();
            const table = tables[index];
            
            if (table) {
                const rows = table.querySelectorAll('tbody tr');
                rows.forEach(row => {
                    const text = row.innerText.toLowerCase();
                    row.style.display = text.includes(filter) ? '' : 'none';
                });
            }
        });
    });
}

// Initialize table search when section is displayed
document.addEventListener('DOMContentLoaded', () => {
    setupTableSearch();
});

// Photo management
function setupPhotoManagement() {
    const approveButtons = document.querySelectorAll('.btn-approve');
    const rejectButtons = document.querySelectorAll('.btn-reject');

    approveButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const photoCard = this.closest('.photo-card');
            const photoName = photoCard.querySelector('h4').textContent;
            openModal('Photo Approved', `Photo "${photoName}" has been approved and published.`);
            setTimeout(() => {
                photoCard.remove();
                closeModal();
            }, 2000);
        });
    });

    rejectButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const photoCard = this.closest('.photo-card');
            const photoName = photoCard.querySelector('h4').textContent;
            openModal('Photo Rejected', `Photo "${photoName}" has been rejected.`);
            setTimeout(() => {
                photoCard.remove();
                closeModal();
            }, 2000);
        });
    });
}

// Initialize on page load
window.addEventListener('load', () => {
    setupPhotoManagement();
});

// Add place button
document.addEventListener('DOMContentLoaded', () => {
    const addPlaceBtn = document.getElementById('addPlaceBtn');
    if (addPlaceBtn) {
        addPlaceBtn.addEventListener('click', () => {
            openModal('Add New Place', 'This feature would open a form to add a new place to the directory.');
        });
    }
});

// Confirm action function (used by modal)
function confirmAction() {
    closeModal();
}

// Export admin functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        openModal,
        closeModal,
        approveContent,
        rejectContent,
        deleteReview,
        warnUser,
        banUser
    };
}
