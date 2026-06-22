// Admin Dashboard JavaScript
const PLACE_STORAGE_KEY = 'nepalTravelPlaces';
let adminLoadedPlaces = [];

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

    renderSubmittedPlaces();
}

function getStoredPlaces() {
    try {
        return JSON.parse(localStorage.getItem(PLACE_STORAGE_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

function saveStoredPlaces(places) {
    localStorage.setItem(PLACE_STORAGE_KEY, JSON.stringify(places));
}

async function fetchPlaces(action) {
    const response = await fetch(`../../PHP/places.php?action=${action}`, {
        method: 'GET',
        credentials: 'same-origin'
    });
    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
        window.location.href = '../HTML/login.html';
        return [];
    }

    if (!data.success) {
        throw new Error(data.message || 'Unable to load places.');
    }

    return data.places || [];
}

async function postPlaceAction(action, placeId) {
    const formData = new FormData();
    formData.append('action', action);
    formData.append('place_id', placeId);

    const response = await fetch('../../PHP/places.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    });
    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
        window.location.href = '../HTML/login.html';
        return false;
    }

    if (!data.success) {
        throw new Error(data.message || 'Action failed.');
    }

    return true;
}

function escapeHtml(value = '') {
    return value.toString().replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

function formatDate(value) {
    if (!value) return 'Unknown date';
    return new Date(value).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function updateDashboardStats(pendingPlaces = [], allPlaces = []) {
    const pendingCount = pendingPlaces.length;
    const approvedCount = allPlaces.filter(place => place.status === 'approved').length;
    const statNumbers = document.querySelectorAll('.stat-number');

    if (statNumbers[0]) statNumbers[0].textContent = 1 + approvedCount;
    const pendingLabel = document.querySelector('.stat-icon.photos')?.closest('.stat-card')?.querySelector('.stat-label');
    if (pendingLabel) pendingLabel.textContent = `Pending verification: ${pendingCount}`;
}

async function renderSubmittedPlaces() {
    try {
        const [pendingPlaces, allPlaces] = await Promise.all([
            fetchPlaces('pending'),
            fetchPlaces('all')
        ]);

        adminLoadedPlaces = pendingPlaces.concat(allPlaces);
        renderPendingSubmissions(pendingPlaces);
        renderManagedPlaces(allPlaces);
        updateDashboardStats(pendingPlaces, allPlaces);
    } catch (error) {
        const storedPlaces = getStoredPlaces();
        const pendingPlaces = storedPlaces.filter(place => place.status === 'pending');
        const allPlaces = storedPlaces.filter(place => place.status !== 'rejected');
        adminLoadedPlaces = pendingPlaces.concat(allPlaces);
        renderPendingSubmissions(pendingPlaces);
        renderManagedPlaces(allPlaces);
        updateDashboardStats(pendingPlaces, allPlaces);
    }
}

function renderPendingSubmissions(pendingPlaces = []) {
    const grid = document.querySelector('#verify-content .content-grid');
    if (!grid) return;

    if (pendingPlaces.length === 0) {
        grid.innerHTML = `
            <div class="content-card approved">
                <div class="card-header">
                    <h3>No Pending Places</h3>
                    <span class="badge badge-active">All Clear</span>
                </div>
                <div class="card-body">
                    <p>New places submitted by users will appear here for approval.</p>
                </div>
            </div>
        `;
        return;
    }

    grid.innerHTML = pendingPlaces.map(place => `
        <div class="content-card pending">
            <div class="card-header">
                <h3>${escapeHtml(place.name)}</h3>
                <span class="badge badge-pending">Pending Verification</span>
            </div>
            <div class="card-body">
                <p><strong>Submitted by:</strong> ${escapeHtml(place.submittedBy || 'Traveler')}</p>
                <p><strong>Date:</strong> ${formatDate(place.submittedAt)}</p>
                <p><strong>Category:</strong> ${escapeHtml(place.category || 'Place')}</p>
                <p><strong>Location:</strong> ${escapeHtml([place.district, place.province].filter(Boolean).join(', ') || 'Nepal')}</p>
                <p><strong>Description:</strong> ${escapeHtml(place.shortDesc || 'No description provided.')}</p>
                <div class="verification-actions">
                    <button class="btn-approve" onclick="approvePlace(${place.id})">
                        <i class="fas fa-check"></i> Approve & Publish
                    </button>
                    <button class="btn-reject" onclick="rejectPlace(${place.id})">
                        <i class="fas fa-times"></i> Reject
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function renderManagedPlaces(allPlaces = []) {
    const tbody = document.querySelector('#manage-places .admin-table tbody');
    if (!tbody) return;

    const approvedPlaces = allPlaces.filter(place => place.status === 'approved');
    tbody.innerHTML = approvedPlaces.map(place => `
        <tr>
            <td>${escapeHtml(place.name)}</td>
            <td>${escapeHtml([place.district, place.province].filter(Boolean).join(', ') || 'Nepal')}</td>
            <td>${escapeHtml(place.submittedBy || 'Traveler')}</td>
            <td><span class="badge badge-active">Active</span></td>
            <td>
                <button class="btn-icon" title="View Details" onclick="viewStoredPlace(${place.id})"><i class="fas fa-eye"></i></button>
                <button class="btn-icon btn-delete" title="Delete" onclick="deletePlace(${place.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
}

function viewStoredPlace(placeId) {
    const place = adminLoadedPlaces.find(item => Number(item.id) === Number(placeId)) ||
        getStoredPlaces().find(item => Number(item.id) === Number(placeId));
    if (!place) {
        openModal('Place Not Found', 'This place could not be found.');
        return;
    }

    openModal(place.name, place.shortDesc || 'No description provided.');
}

async function approvePlace(placeId) {
    try {
        const ok = await postPlaceAction('approve', placeId);
        if (!ok) return;
        await renderSubmittedPlaces();
        openModal('Place Approved', 'The place is now published on the website.');
        setTimeout(closeModal, 2000);
        return;
    } catch (error) {
        // Fall back to local data when PHP/MySQL is unavailable.
    }

    const storedPlaces = getStoredPlaces();
    const place = storedPlaces.find(item => item.id === placeId);

    if (!place) {
        openModal('Place Not Found', 'This submission could not be found.');
        return;
    }

    place.status = 'approved';
    place.approvedAt = new Date().toISOString();
    saveStoredPlaces(storedPlaces);
    renderSubmittedPlaces();
    updateDashboardStats();
    openModal('Place Approved', `"${place.name}" is now published on the website.`);
    setTimeout(closeModal, 2000);
}

async function rejectPlace(placeId) {
    try {
        const ok = await postPlaceAction('reject', placeId);
        if (!ok) return;
        await renderSubmittedPlaces();
        openModal('Place Rejected', 'The place has been rejected.');
        setTimeout(closeModal, 2000);
        return;
    } catch (error) {
        // Fall back to local data when PHP/MySQL is unavailable.
    }

    const storedPlaces = getStoredPlaces();
    const place = storedPlaces.find(item => item.id === placeId);

    if (!place) {
        openModal('Place Not Found', 'This submission could not be found.');
        return;
    }

    place.status = 'rejected';
    place.rejectedAt = new Date().toISOString();
    saveStoredPlaces(storedPlaces);
    renderSubmittedPlaces();
    updateDashboardStats();
    openModal('Place Rejected', `"${place.name}" has been rejected.`);
    setTimeout(closeModal, 2000);
}

async function deletePlace(placeId) {
    if (!confirm('Delete this place from the website?')) return;
    try {
        const ok = await postPlaceAction('delete', placeId);
        if (!ok) return;
        await renderSubmittedPlaces();
        openModal('Place Deleted', 'The place has been removed.');
        setTimeout(closeModal, 2000);
        return;
    } catch (error) {
        // Fall back to local data when PHP/MySQL is unavailable.
    }

    const nextPlaces = getStoredPlaces().filter(place => place.id !== placeId);
    saveStoredPlaces(nextPlaces);
    renderSubmittedPlaces();
    updateDashboardStats();
    openModal('Place Deleted', 'The place has been removed.');
    setTimeout(closeModal, 2000);
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

                if (sectionId === 'delete-reviews') {
                    renderReviewsForAdmin();
                }
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

async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
        const formData = new FormData();
        formData.append('action', 'delete_review');
        formData.append('review_id', reviewId);

        const response = await fetch('../../PHP/places.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (data.success) {
            openModal('Review Deleted', 'The review has been permanently deleted.');
            renderReviewsForAdmin();
            setTimeout(closeModal, 2000);
        } else {
            alert(data.message || 'Unable to delete review.');
        }
    } catch (error) {
        alert('Error deleting review: ' + error.message);
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

async function renderReviewsForAdmin() {
    const list = document.querySelector('#delete-reviews .reviews-list');
    if (!list) return;

    try {
        const response = await fetch('../../PHP/places.php?action=all_reviews', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (data.success) {
            if (data.reviews.length === 0) {
                list.innerHTML = `
                    <div class="review-card approved" style="padding: 1.5rem; text-align: center; color: var(--text-muted);">
                        <p style="margin: 0; font-size: 1.1rem; font-weight: 500;">No reviews available in the system.</p>
                    </div>
                `;
                return;
            }
            
            list.innerHTML = data.reviews.map(review => `
                <div class="review-card flagged" style="margin-bottom: 1.5rem; padding: 1.5rem; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; background: #fff;">
                    <div class="review-header" style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 1rem;">
                        <div>
                            <h4 style="margin: 0 0 4px 0; font-size: 1.2rem; color: #111;">${escapeHtml(review.placeName)}</h4>
                            <p style="margin: 0; font-size: 0.9rem; color: #666;">Reviewed by: <strong>${escapeHtml(review.fullName)}</strong> <small>(@${escapeHtml(review.username)})</small></p>
                        </div>
                        <span class="badge badge-flagged" style="background: rgba(45, 95, 77, 0.1); color: var(--color-primary); font-weight: 600; padding: 4px 10px; border-radius: 8px;">${review.rating} / 5 Stars</span>
                    </div>
                    <div class="review-body" style="margin-bottom: 1rem;">
                        <p class="review-content" style="margin: 0 0 8px 0; color: #333; line-height: 1.5; font-style: italic;">"${escapeHtml(review.comment)}"</p>
                        <p class="review-reason" style="margin: 0; font-size: 0.85rem; color: #888;"><strong>Submitted At:</strong> ${formatDate(review.createdAt)}</p>
                    </div>
                    <div class="review-actions">
                        <button class="btn-delete" onclick="deleteReview(${review.id})" style="background: var(--form-danger, #c0392b); color: #fff; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.9rem; display: inline-flex; align-items: center; gap: 6px;">
                            <i class="fas fa-trash"></i> Delete Review
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        list.innerHTML = `<p style="color: var(--form-danger);">Error loading reviews: ${escapeHtml(error.message)}</p>`;
    }
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
