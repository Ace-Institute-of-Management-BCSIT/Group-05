// Admin Dashboard JavaScript
let adminLoadedPlaces = [];

document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard().catch((error) => {
        if (error?.message === 'Admin access required.') {
            alert('Access Denied! Admin access required.');
            window.location.href = '../HTML/login.html';
            return;
        }
        alert('Unable to load admin data right now.');
    });
});

async function initializeAdminDashboard() {
    const response = await fetch('../../PHP/places.php?action=session', {
        method: 'GET',
        credentials: 'same-origin'
    });
    const data = await response.json();

    if (!response.ok || !data.success || data.user?.role !== 'admin') {
        throw new Error('Admin access required.');
    }

    const adminName = data.user?.name || 'Admin User';
    document.getElementById('adminName').textContent = adminName;

    // Navigation
    setupNavigation();
    
    // Sidebar toggle
    setupSidebarToggle();
    
    // Logout
    setupLogout();
    
    // Modal functionality
    setupModal();

    await renderSubmittedPlaces();
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

async function fetchReviews() {
    const response = await fetch('../../PHP/places.php?action=all_reviews', {
        method: 'GET',
        credentials: 'same-origin'
    });
    const data = await response.json();

    if (response.status === 401 || response.status === 403) {
        window.location.href = '../HTML/login.html';
        return [];
    }

    if (!data.success) {
        throw new Error(data.message || 'Unable to load reviews.');
    }

    return data.reviews || [];
}

async function postReviewDelete(reviewId) {
    const formData = new FormData();
    formData.append('action', 'delete_review');
    formData.append('review_id', reviewId);

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
        throw new Error(data.message || 'Unable to delete review.');
    }

    return true;
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

function updateDashboardStats(pendingPlaces = [], allPlaces = [], reviews = []) {
    const pendingCount = pendingPlaces.length;
    const approvedCount = allPlaces.filter(place => place.status === 'approved').length;
    const statNumbers = document.querySelectorAll('.stat-number');

    if (statNumbers[0]) statNumbers[0].textContent = `${approvedCount}`;
    if (statNumbers[3]) statNumbers[3].textContent = `${reviews.length}`;
    const pendingLabel = document.querySelector('.stat-icon.photos')?.closest('.stat-card')?.querySelector('.stat-label');
    if (pendingLabel) pendingLabel.textContent = `Pending verification: ${pendingCount}`;
}

async function renderSubmittedPlaces() {
    const [pendingPlaces, allPlaces, reviews] = await Promise.all([
        fetchPlaces('pending'),
        fetchPlaces('all'),
        fetchReviews()
    ]);

    adminLoadedPlaces = pendingPlaces.concat(allPlaces);
    renderPendingSubmissions(pendingPlaces);
    renderManagedPlaces(allPlaces);
    renderAdminReviews(reviews);
    updateDashboardStats(pendingPlaces, allPlaces, reviews);
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
    if (approvedPlaces.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5">No approved places yet.</td>
            </tr>
        `;
        return;
    }

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
    const place = adminLoadedPlaces.find(item => Number(item.id) === Number(placeId));
    if (!place) {
        openModal('Place Not Found', 'This place could not be found.');
        return;
    }

    openModal(place.name, place.shortDesc || 'No description provided.');
}

function renderAdminReviews(reviews = []) {
    const reviewList = document.querySelector('#delete-reviews .reviews-list');
    if (!reviewList) return;

    if (reviews.length === 0) {
        reviewList.innerHTML = `
            <div class="review-card approved">
                <div class="review-header">
                    <div>
                        <h4>No Reviews Yet</h4>
                        <p>Reviews posted by users will appear here.</p>
                    </div>
                    <span class="badge badge-active">All Clear</span>
                </div>
            </div>
        `;
        return;
    }

    reviewList.innerHTML = reviews.map(review => `
        <div class="review-card approved">
            <div class="review-header">
                <div>
                    <h4>${escapeHtml(review.placeName || 'Place')}</h4>
                    <p>Reviewed by: <strong>${escapeHtml(review.author || 'Traveler')}</strong></p>
                </div>
                <span class="badge badge-active">${Number(review.rating || 0)}/5</span>
            </div>
            <div class="review-body">
                <p class="review-content">${escapeHtml(review.comment || '')}</p>
                <p class="review-reason"><strong>Date:</strong> ${formatDate(review.createdAt)}</p>
            </div>
            <div class="review-actions">
                <button class="btn-delete" onclick="deleteReview(${review.id})">
                    <i class="fas fa-trash"></i> Delete Review
                </button>
            </div>
        </div>
    `).join('');
}

async function approvePlace(placeId) {
    try {
        const ok = await postPlaceAction('approve', placeId);
        if (!ok) return;
        await renderSubmittedPlaces();
        openModal('Place Approved', 'The place is now published on the website.');
        setTimeout(closeModal, 2000);
    } catch (error) {
        openModal('Action Failed', 'Unable to approve place right now.');
    }
}

async function rejectPlace(placeId) {
    try {
        const ok = await postPlaceAction('reject', placeId);
        if (!ok) return;
        await renderSubmittedPlaces();
        openModal('Place Rejected', 'The place has been rejected.');
        setTimeout(closeModal, 2000);
    } catch (error) {
        openModal('Action Failed', 'Unable to reject place right now.');
    }
}

async function deletePlace(placeId) {
    if (!confirm('Delete this place from the website?')) return;
    try {
        const ok = await postPlaceAction('delete', placeId);
        if (!ok) return;
        await renderSubmittedPlaces();
        openModal('Place Deleted', 'The place has been removed.');
        setTimeout(closeModal, 2000);
    } catch (error) {
        openModal('Action Failed', 'Unable to delete place right now.');
    }
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
async function deleteReview(reviewId) {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
        const ok = await postReviewDelete(reviewId);
        if (!ok) return;
        await renderSubmittedPlaces();
        openModal('Review Deleted', 'The review has been permanently deleted.');
        setTimeout(closeModal, 2000);
    } catch (error) {
        openModal('Action Failed', 'Unable to delete review right now.');
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
    const approveButtons = document.querySelectorAll('#manage-photos .photo-card .btn-approve');
    const rejectButtons = document.querySelectorAll('#manage-photos .photo-card .btn-reject');

    approveButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const photoCard = this.closest('.photo-card');
            if (!photoCard) return;
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
            if (!photoCard) return;
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
