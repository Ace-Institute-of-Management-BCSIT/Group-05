function escapeHtml(value = '') {
    if (value === null || value === undefined) return '';
    return value.toString().replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

let places = [];

const BASE_CATEGORIES = ['All', 'Hidden Village', 'Viewpoint', 'Waterfall', 'Trekking Route',
    'Lake', 'Cultural Site', 'Monastery', 'Cave', 'Forest', 'Camping Spot', 'Homestay',
    'Adventure', 'Nature', 'Beach', 'Historical', 'Urban', 'Cultural', 'Other'];

let currentFilter = 'All';
let searchQuery = '';
let selectedPlace = null;
let userRating = 0;
const PLACE_STORAGE_KEY = 'nepalTravelPlaces';

// Sample reviews
const sampleReviews = [
    {
        id: 1,
        author: 'Sarah Johnson',
        rating: 5,
        date: '2 weeks ago',
        comment: 'Absolutely stunning! The scenery was breathtaking and the local culture was so welcoming. A must-visit destination for any traveler.',
        helpful: 24
    },
    {
        id: 2,
        author: 'Michael Chen',
        rating: 4,
        date: '1 month ago',
        comment: 'Great place with amazing views. The hiking trails are well-maintained and offer spectacular vistas. Would definitely recommend!',
        helpful: 15
    },
    {
        id: 3,
        author: 'Emma Williams',
        rating: 5,
        date: '2 months ago',
        comment: 'One of the best experiences of my life! The natural beauty combined with rich history makes this place truly special.',
        helpful: 31
    }
];

// DOM Elements
const loginPage = document.getElementById('login-page');
const mainApp = document.getElementById('main-app');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const tabButtons = document.querySelectorAll('.tab-btn');
const userBtn = document.getElementById('user-btn');
const profileCard = document.getElementById('user-profile-card');
const logoutBtn = document.getElementById('logout-btn');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
let profileHideTimer = null;
const searchInput = document.getElementById('search-input');
const categoriesContainer = document.getElementById('categories');
const placesGrid = document.getElementById('places-grid');
const noResults = document.getElementById('no-results');
const placeDetailModal = document.getElementById('place-detail-modal');
const addPlaceBtns = document.querySelectorAll('#add-place-btn, #cta-add-btn, #featured-add-btn, .mobile-add-btn');
const backBtn = document.getElementById('back-btn');
const closeFormBtn = document.getElementById('close-form-btn');
const addPlaceModal = document.getElementById('add-place-modal');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const reviewForm = document.getElementById('review-form');
const starRating = document.getElementById('star-rating');
const travelStatus = document.getElementById('travel-status');
const travelBoardContent = document.getElementById('travel-board-content');

// Initialize
async function init() {
    places = await loadApprovedPlaces();
    renderCategories();
    renderPlaces();
    updateStats();
    initializeUserProfile();
    attachEventListeners();
}

function getStoredPlaces() {
    try {
        return JSON.parse(localStorage.getItem(PLACE_STORAGE_KEY) || '[]');
    } catch (error) {
        return [];
    }
}

function saveStoredPlaces(nextPlaces) {
    localStorage.setItem(PLACE_STORAGE_KEY, JSON.stringify(nextPlaces));
}

function normalizePlace(place) {
    return {
        rating: 4.8,
        reviews: 0,
        category: 'Other',
        budget: 0,
        transport: 0,
        stay: 0,
        food: 0,
        fee: 0,
        localName: '',
        tagline: '',
        province: '',
        district: '',
        municipality: '',
        shortDesc: '',
        bestTime: '',
        duration: '',
        difficulty: 'Easy',
        things: '',
        tips: '',
        startPoint: '',
        routeDesc: '',
        destination: '',
        accomDesc: '',
        hotels: '',
        restaurants: '',
        homestay: false,
        parking: false,
        toilets: false,
        ...place,
        location: place.location || [place.district, place.province].filter(Boolean).join(', ') || place.destination || 'Nepal',
        status: place.status || 'approved'
    };
}

function getApprovedPlacesFallback() {
    return getStoredPlaces()
        .filter(place => place.status === 'approved')
        .map(normalizePlace);
}

async function loadApprovedPlaces() {
    try {
        const response = await fetch('../../PHP/places.php?action=approved', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (data.success) {
            return (data.places || []).map(normalizePlace);
        }
    } catch (error) {
        // Fall back to local data when the PHP server/database is not reachable.
    }

    return getApprovedPlacesFallback();
}

function buildPlaceFromForm(formElement) {
    const data = new FormData(formElement);
    const field = name => (data.get(name) || '').toString().trim();
    const numberField = name => Number(field(name)) || 0;

    return normalizePlace({
        id: Date.now(),
        name: field('name'),
        localName: field('localName'),
        tagline: field('tagline'),
        province: field('province'),
        district: field('district'),
        municipality: field('municipality'),
        category: field('category'),
        shortDesc: field('shortDesc'),
        bestTime: field('bestTime'),
        duration: field('duration'),
        things: field('things'),
        tips: field('tips'),
        difficulty: field('difficulty') || 'Easy',
        budget: numberField('budget'),
        transport: numberField('transport'),
        stay: numberField('stay'),
        food: numberField('food'),
        fee: numberField('fee'),
        accomDesc: field('accomDesc'),
        hotels: field('hotels'),
        restaurants: field('restaurants'),
        homestay: data.has('homestay'),
        parking: data.has('parking'),
        toilets: data.has('toilets'),
        coverImage: coverFile ? coverFile.name : 'Submitted destination',
        startPoint: field('start'),
        routeDesc: field('routeDesc'),
        destination: field('dest'),
        submittedBy: localStorage.getItem('userName') || getCookie('userName') || 'Traveler',
        submittedAt: new Date().toISOString(),
        status: 'pending'
    });
}

async function submitPlaceForApproval(formElement) {
    const submittedPlace = buildPlaceFromForm(formElement);
    const formData = new FormData(formElement);
    formData.append('action', 'submit');
    if (coverFile) {
        formData.set('coverImage', coverFile, coverFile.name);
    }

    try {
        const response = await fetch('../../PHP/places.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (response.status === 401) {
            window.location.href = 'login.html';
            return null;
        }

        if (!data.success) {
            throw new Error(data.message || 'Unable to submit place.');
        }

        return { ...submittedPlace, id: data.id };
    } catch (error) {
        throw new Error(error.message || 'Unable to submit place. Please check Apache, MySQL, and login status.');
    }
}

// Event Listeners
function attachEventListeners() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleLogin);
    if (userBtn) userBtn.addEventListener('click', toggleUserProfile);
    if (logoutBtn) logoutBtn.addEventListener('click', logoutUser);
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);
    document.addEventListener('click', (event) => {
        if (event.target.closest('#travel-features')) {
            handleTravelFeatureClick(event);
        }
    });

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            filterPlaces();
        });
    }

    addPlaceBtns.forEach(btn => {
        btn.addEventListener('click', openAddPlaceModal);
    });

    backBtn.addEventListener('click', closePlaceDetail);
    if (closeFormBtn) closeFormBtn.addEventListener('click', closeAddPlaceModal);
    clearFiltersBtn.addEventListener('click', clearFilters);
    if (reviewForm) reviewForm.addEventListener('submit', handleReviewSubmit);

    if (starRating) {
        const starBtns = starRating.querySelectorAll('.star-btn');
        starBtns.forEach(btn => {
            btn.addEventListener('click', () => setRating(parseInt(btn.dataset.rating)));
            btn.addEventListener('mouseenter', () => highlightStars(parseInt(btn.dataset.rating)));
        });
        starRating.addEventListener('mouseleave', () => highlightStars(userRating));
    }

    addPlaceModal.addEventListener('click', (e) => {
        if (e.target === addPlaceModal) closeAddPlaceModal();
    });
    placeDetailModal.addEventListener('click', (e) => {
        if (e.target === placeDetailModal) closePlaceDetail();
    });
}

// Auth Functions
function switchTab(tab) {
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    if (tab === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    if (loginPage) loginPage.classList.remove('active');
    if (mainApp) mainApp.classList.add('active');
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return '';
}

function initializeUserProfile() {
    const userName = localStorage.getItem('userName') || getCookie('userName') || 'Traveler';
    const userRole = localStorage.getItem('userRole') || getCookie('userRole') || 'User';
    const profileName = document.getElementById('profile-name');
    const profileRole = document.getElementById('profile-role');
    const userAvatar = document.getElementById('user-avatar');
    const isLoggedIn = Boolean(localStorage.getItem('userRole') || getCookie('userRole'));

    if (profileName) profileName.textContent = userName;
    if (profileRole) profileRole.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
    if (userAvatar) userAvatar.textContent = userName.charAt(0).toUpperCase();

    if (isLoggedIn) {
        showProfileCard();
        updateTravelBoard();
    }

    if (userName && userName !== 'Traveler') {
        userBtn?.setAttribute('aria-label', 'Open user profile');
    }
}

function showProfileCard() {
    if (!profileCard) return;

    profileCard.classList.add('active');
    profileCard.setAttribute('aria-hidden', 'false');

    if (profileHideTimer) clearTimeout(profileHideTimer);
    profileHideTimer = setTimeout(() => {
        profileCard.classList.remove('active');
        profileCard.setAttribute('aria-hidden', 'true');
    }, 8000);
}

function hideProfileCard() {
    if (!profileCard) return;
    profileCard.classList.remove('active');
    profileCard.setAttribute('aria-hidden', 'true');
    if (profileHideTimer) clearTimeout(profileHideTimer);
}

function isUserLoggedIn() {
    return Boolean(localStorage.getItem('isAdmin') === 'true' || localStorage.getItem('userRole') || getCookie('userRole'));
}

function toggleUserProfile() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    if (profileCard?.classList.contains('active')) {
        hideProfileCard();
    } else {
        showProfileCard();
        updateTravelBoard();
    }
}

function setTravelStatus(message) {
    if (travelStatus) {
        travelStatus.textContent = message;
    }
}

function updateTravelBoard(feature = 'saved') {
    if (!travelBoardContent) return;

    if (!isUserLoggedIn()) {
        travelBoardContent.innerHTML = '<p class="empty-state">Please sign in to view your saved places and trips.</p>';
        setTravelStatus('Sign in to start saving places and shaping your next trip.');
        return;
    }

    fetch('../../PHP/travel.php?action=get', {
        method: 'GET',
        credentials: 'same-origin'
    })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                travelBoardContent.innerHTML = '<p class="empty-state">Unable to load your travel board right now.</p>';
                return;
            }

            const saved = data.saved || [];
            const trips = data.trips || [];
            const notes = data.notes || [];

            if (feature === 'saved') {
                if (saved.length === 0) {
                    travelBoardContent.innerHTML = '<p class="empty-state">No saved places yet.</p>';
                } else {
                    travelBoardContent.innerHTML = saved.map(item => {
                        const place = places.find(p => p.id === item.place_id);
                        return `<div class="travel-board-item">💾 ${place ? place.name : `Place ${item.place_id}`}</div>`;
                    }).join('');
                }
                setTravelStatus('Your saved places are ready for the next trip.');
            } else if (feature === 'future') {
                if (trips.length === 0) {
                    travelBoardContent.innerHTML = '<p class="empty-state">No future trips planned yet.</p>';
                } else {
                    travelBoardContent.innerHTML = trips.map(item => {
                        const place = places.find(p => p.id === item.place_id);
                        return `<div class="travel-board-item">🗓️ ${place ? place.name : `Place ${item.place_id}`}</div>`;
                    }).join('');
                }
                setTravelStatus('Your future trips are ready to review.');
            } else if (feature === 'notes') {
                if (notes.length === 0) {
                    travelBoardContent.innerHTML = '<p class="empty-state">No trip notes yet.</p>';
                } else {
                    travelBoardContent.innerHTML = notes.map(note => `<div class="travel-board-item">📝 ${note.note_text}</div>`).join('');
                }
                setTravelStatus('Your notes are stored here for later.');
            } else {
                travelBoardContent.innerHTML = '<div class="travel-board-item">✨ More travel tools will appear here soon.</div>';
                setTravelStatus('More travel tools are on the way.');
            }
        })
        .catch(() => {
            travelBoardContent.innerHTML = '<p class="empty-state">Unable to load your travel board right now.</p>';
        });
}

function handleTravelFeatureClick(event) {
    const button = event.target.closest('.feature-item');
    if (!button || !isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    const feature = button.dataset.feature;
    showProfileCard();
    updateTravelBoard(feature);
}

function logoutUser() {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    document.cookie = 'userRole=; path=/; max-age=0';
    document.cookie = 'userName=; path=/; max-age=0';
    hideProfileCard();
    window.location.href = 'login.html';
}

// Collections, notes, and trip planning stored locally per-user
function savePlaceToCollection(placeId) {
    if (!isUserLoggedIn()) { window.location.href = 'login.html'; return; }

    const formData = new FormData();
    formData.append('action', 'save_place');
    formData.append('place_id', placeId);

    fetch('../../PHP/travel.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
        .then(response => response.json())
        .then(() => {
            showProfileCard();
            setTravelStatus('Saved to your collection.');
            updateTravelBoard('saved');
        })
        .catch(() => {
            setTravelStatus('Unable to save right now.');
        });
}

function addNoteToPlace(placeId, note) {
    if (!isUserLoggedIn()) { window.location.href = 'login.html'; return; }

    const formData = new FormData();
    formData.append('action', 'add_note');
    formData.append('place_id', placeId);
    formData.append('note_text', note);

    fetch('../../PHP/travel.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
        .then(response => response.json())
        .then(() => {
            showProfileCard();
            setTravelStatus('Note saved to your travel board.');
            updateTravelBoard('notes');
        })
        .catch(() => {
            setTravelStatus('Unable to save note right now.');
        });
}

function organizeTrip(placeId) {
    if (!isUserLoggedIn()) { window.location.href = 'login.html'; return; }

    const formData = new FormData();
    formData.append('action', 'plan_trip');
    formData.append('place_id', placeId);

    fetch('../../PHP/travel.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
    })
        .then(response => response.json())
        .then(() => {
            showProfileCard();
            setTravelStatus('Added to your future trips.');
            updateTravelBoard('future');
        })
        .catch(() => {
            setTravelStatus('Unable to plan trip right now.');
        });
}

// Mobile Menu
function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
}

// Categories
function renderCategories() {
    // Build category list from loaded places + base categories
    const placeCategories = [...new Set(places.map(p => p.category).filter(Boolean))];
    const allCategories = ['All', ...placeCategories.filter(c => !BASE_CATEGORIES.includes(c)),
        ...BASE_CATEGORIES.filter(c => c !== 'All' && placeCategories.includes(c))];
    // Deduplicate while preserving order
    const seen = new Set();
    const displayCategories = allCategories.filter(c => !seen.has(c) && seen.add(c));

    categoriesContainer.innerHTML = displayCategories.map(cat => `
        <button class="category-btn ${cat === currentFilter ? 'active' : ''}"
                onclick="setCategory('${cat}')">
            ${cat}
        </button>
    `).join('');
}

function setCategory(category) {
    currentFilter = category;
    renderCategories();
    filterPlaces();
}

// Places
function renderPlaces() {
    const filteredPlaces = getFilteredPlaces();

    if (filteredPlaces.length === 0) {
        placesGrid.style.display = 'none';
        noResults.style.display = 'block';
    } else {
        placesGrid.style.display = 'grid';
        noResults.style.display = 'none';

        placesGrid.innerHTML = filteredPlaces.map(place => {
            const imgUrl = place.coverImage
                ? `../../PHP/serve_image.php?path=${encodeURIComponent(place.coverImage)}`
                : '';
            const imgHtml = imgUrl
                ? `<img src="${imgUrl}" alt="${escapeHtml(place.name)}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                   <div class="place-img-fallback" style="display:none;width:100%;height:100%;align-items:center;justify-content:center;">
                     <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                       <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                       <circle cx="12" cy="10" r="3"></circle>
                     </svg>
                   </div>`
                : `<svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                     <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                     <circle cx="12" cy="10" r="3"></circle>
                   </svg>`;
            return `
            <div class="place-card" onclick="openPlaceDetail(${place.id})">
                <div class="place-image">
                    ${imgHtml}
                    <div class="place-category">${escapeHtml(place.category)}</div>
                </div>
                <div class="place-info">
                    <h3 class="place-name">${escapeHtml(place.name)}</h3>
                    <div class="place-location">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${escapeHtml(place.location)}</span>
                    </div>
                    <div class="place-meta">
                        <div class="place-rating">
                            <span class="rating-badge">${place.rating.toFixed(1)} / 5</span>
                        </div>
                        <div class="place-reviews">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                <circle cx="9" cy="7" r="4"></circle>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                            </svg>
                            <span>${place.reviews} reviews</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        }).join('');

    }

    updateSectionHeader(filteredPlaces.length);
}

function getFilteredPlaces() {
    return places
        .filter(place => {
            const matchesCategory = currentFilter === 'All' || place.category === currentFilter;
            const searchableLocation = place.location || [place.district, place.province].filter(Boolean).join(', ');
            const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                searchableLocation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.category.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesCategory && matchesSearch;
        })
        .sort((a, b) => b.rating - a.rating);
}

function filterPlaces() {
    renderPlaces();
}

function clearFilters() {
    searchQuery = '';
    currentFilter = 'All';
    searchInput.value = '';
    renderCategories();
    renderPlaces();
}

function updateSectionHeader(count) {
    const title = currentFilter === 'All' ? 'All Destinations' : `${currentFilter} Destinations`;
    const subtitle = `Sorted by rating • ${count} ${count === 1 ? 'place' : 'places'}`;

    document.getElementById('section-title').textContent = title;
    document.getElementById('section-subtitle').textContent = subtitle;
}

function updateStats() {
    document.getElementById('stat-places').textContent = `${places.length}+`;
}

function openAddPlaceModal() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }
    addPlaceModal.classList.add('active');
    mobileMenu.classList.remove('active');
}

function closeAddPlaceModal() {
    addPlaceModal.classList.remove('active');
}

// Place Detail
function openPlaceDetail(id) {
    selectedPlace = places.find(p => p.id === id);
    if (!selectedPlace) return;

    // Header info
    document.getElementById('detail-name').textContent = selectedPlace.name;
    document.getElementById('detail-local-name').textContent = selectedPlace.localName;
    document.getElementById('detail-tagline').textContent = selectedPlace.tagline;

    // Hero cover image
    const heroImg = document.getElementById('detail-hero-img');
    const heroSvg = document.getElementById('detail-hero-svg');
    if (heroImg && heroSvg) {
        if (selectedPlace.coverImage) {
            const imgUrl = `../../PHP/serve_image.php?path=${encodeURIComponent(selectedPlace.coverImage)}`;
            heroImg.src = imgUrl;
            heroImg.alt = selectedPlace.name;
            heroImg.style.display = 'block';
            heroSvg.style.display = 'none';
            heroImg.onerror = () => {
                heroImg.style.display = 'none';
                heroSvg.style.display = '';
            };
        } else {
            heroImg.style.display = 'none';
            heroSvg.style.display = '';
        }
    }


    // Location info
    document.getElementById('detail-location').textContent = `${selectedPlace.district}, ${selectedPlace.province}`;
    document.getElementById('detail-location-full').textContent = `${selectedPlace.municipality}, ${selectedPlace.province} Province`;

    // About
    document.getElementById('detail-desc').textContent = selectedPlace.shortDesc;

    // Trip Information
    document.getElementById('detail-best-time').textContent = selectedPlace.bestTime;
    document.getElementById('detail-duration').textContent = selectedPlace.duration;
    document.getElementById('detail-difficulty').textContent = selectedPlace.difficulty;
    document.getElementById('detail-category').textContent = selectedPlace.category;

    // Things to Do
    document.getElementById('detail-things').textContent = selectedPlace.things;

    // Tips
    document.getElementById('detail-tips').textContent = selectedPlace.tips;

    // Route
    document.getElementById('detail-start').textContent = selectedPlace.startPoint;
    document.getElementById('detail-route').textContent = selectedPlace.routeDesc;
    document.getElementById('detail-dest').textContent = selectedPlace.destination;

    // Budget
    document.getElementById('detail-budget').textContent = `NPR ${selectedPlace.budget.toLocaleString()}`;
    document.getElementById('detail-transport').textContent = `NPR ${selectedPlace.transport.toLocaleString()}`;
    document.getElementById('detail-stay').textContent = `NPR ${selectedPlace.stay.toLocaleString()}`;
    document.getElementById('detail-food').textContent = `NPR ${selectedPlace.food.toLocaleString()}`;
    document.getElementById('detail-fee').textContent = `NPR ${selectedPlace.fee.toLocaleString()}`;

    // Facilities
    document.getElementById('detail-accom').textContent = selectedPlace.accomDesc;
    document.getElementById('detail-hotels').textContent = selectedPlace.hotels;
    document.getElementById('detail-restaurants').textContent = selectedPlace.restaurants;

    // Features
    document.getElementById('feature-homestay').style.display = selectedPlace.homestay ? 'flex' : 'none';
    document.getElementById('feature-parking').style.display = selectedPlace.parking ? 'flex' : 'none';
    document.getElementById('feature-toilets').style.display = selectedPlace.toilets ? 'flex' : 'none';

    // Add action buttons (save, note, plan)
    const actionsContainerId = 'detail-actions';
    let actions = document.getElementById(actionsContainerId);
    if (!actions) {
        actions = document.createElement('div');
        actions.id = actionsContainerId;
        actions.className = 'detail-actions';
        const header = document.querySelector('.detail-card .detail-header');
        if (header) header.appendChild(actions);
    }
    actions.innerHTML = `
        <div class="detail-action-buttons" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn-outline" id="save-collection-btn">Save to Collection</button>
            <button class="btn btn-outline" id="add-note-btn">Add Note</button>
            <button class="btn btn-primary" id="plan-trip-btn">Plan Trip</button>
        </div>
    `;

    const saveBtn = document.getElementById('save-collection-btn');
    const noteBtn = document.getElementById('add-note-btn');
    const planBtn = document.getElementById('plan-trip-btn');

    if (saveBtn) saveBtn.onclick = () => savePlaceToCollection(selectedPlace.id);
    if (noteBtn) noteBtn.onclick = () => {
        const note = prompt('Add a private note for this place:');
        if (note) addNoteToPlace(selectedPlace.id, note);
    };
    if (planBtn) planBtn.onclick = () => organizeTrip(selectedPlace.id);

    placeDetailModal.classList.add('active');
    loadAndRenderReviews(selectedPlace.id);
}

function closePlaceDetail() {
    placeDetailModal.classList.remove('active');
    selectedPlace = null;
}

async function loadAndRenderReviews(placeId) {
    const addReviewContainer = document.getElementById('add-review-container');
    if (addReviewContainer) {
        addReviewContainer.style.display = isUserLoggedIn() ? 'block' : 'none';
    }

    try {
        const response = await fetch(`../../PHP/places.php?action=get_reviews&place_id=${placeId}`);
        const data = await response.json();
        
        if (data.success) {
            const list = document.getElementById('reviews-list');
            const countEl = document.getElementById('review-count');
            const avgEl = document.getElementById('detail-average-rating');
            
            if (countEl) countEl.textContent = `(${data.reviews.length})`;
            
            let avgRating = 0;
            if (data.reviews.length > 0) {
                const totalRating = data.reviews.reduce((sum, r) => sum + r.rating, 0);
                avgRating = totalRating / data.reviews.length;
            }
            if (avgEl) avgEl.textContent = `${avgRating.toFixed(1)} / 5`;
            
            if (!list) return;
            if (data.reviews.length === 0) {
                list.innerHTML = `<p class="empty-state" style="color: var(--text-muted); text-align: center; padding: 1.5rem 0;">No reviews yet. Be the first to review this place!</p>`;
                return;
            }
            
            list.innerHTML = data.reviews.map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="review-avatar">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        </div>
                        <div class="review-info">
                            <div class="review-top">
                                <div>
                                    <h4 class="review-author" style="margin:0; font-size:1rem; color:var(--text-primary);">${escapeHtml(review.author)} <small style="color:var(--text-muted); font-weight:normal;">(@${escapeHtml(review.username)})</small></h4>
                                    <div class="review-date" style="font-size:0.8rem; color:var(--text-muted); margin-top:2px;">${escapeHtml(new Date(review.date).toLocaleDateString())}</div>
                                </div>
                                <span class="rating-badge rating-badge-sm" style="font-size:0.85rem; padding:4px 8px; font-weight:600;">${review.rating} / 5</span>
                            </div>
                            <p class="review-text" style="margin:8px 0 0; color:var(--text-secondary); line-height:1.5;">${escapeHtml(review.comment)}</p>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

function setRating(rating) {
    userRating = rating;
    highlightStars(rating);
}

function highlightStars(rating) {
    const starBtns = starRating.querySelectorAll('.star-btn');
    starBtns.forEach((btn, index) => {
        btn.classList.toggle('active', index < rating);
    });
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!isUserLoggedIn()) { window.location.href = 'login.html'; return; }
    const reviewText = document.getElementById('review-text').value.trim();

    if (userRating === 0) {
        alert('Please select a rating');
        return;
    }

    const formData = new FormData();
    formData.append('action', 'submit_review');
    formData.append('place_id', selectedPlace.id);
    formData.append('rating', userRating);
    formData.append('comment', reviewText);

    try {
        const response = await fetch('../../PHP/places.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        const data = await response.json();

        if (data.success) {
            showToastGlobal('Review submitted successfully!', 'fa-check');
            userRating = 0;
            highlightStars(0);
            document.getElementById('review-text').value = '';
            
            await loadAndRenderReviews(selectedPlace.id);
            places = await loadApprovedPlaces();
            renderPlaces();
        } else {
            showToastGlobal(data.message || 'Unable to submit review.', 'fa-triangle-exclamation');
        }
    } catch (error) {
        showToastGlobal('Error submitting review.', 'fa-triangle-exclamation');
    }
}

// ===== FORM FUNCTIONALITY =====
const form = document.getElementById('placeForm');
const pages = form ? [...form.querySelectorAll('.page')] : [];
const steps = form ? [...form.querySelectorAll('.step')] : [];
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const publishBtn = document.getElementById('publishBtn');
let current = 1;
const total = pages.length;

// File uploads - declared at top level so validateStep can access
let coverFile = null;
let galleryFiles = [];

function showStep(n) {
    current = n;
    pages.forEach(p => p.classList.toggle('active', +p.dataset.page === n));
    steps.forEach(s => {
        const sn = +s.dataset.step;
        s.classList.toggle('active', sn === n);
        s.classList.toggle('done', sn < n);
    });
    if (prevBtn) prevBtn.disabled = n === 1;
    if (nextBtn) nextBtn.style.display = n === total ? 'none' : 'inline-flex';
    if (publishBtn) publishBtn.style.display = n === total ? 'inline-flex' : 'none';
}

function validateStep(n) {
    const page = pages[n - 1];
    if (!page) return true;
    let ok = true;
    page.querySelectorAll('[required]').forEach(el => {
        const wrap = el.closest('.field');
        const err = wrap?.querySelector('.err-msg');
        const bad = !el.value.trim();
        el.classList.toggle('error', bad);
        if (err) err.classList.toggle('show', bad);
        if (bad) ok = false;
    });
    if (n === 1 && !document.getElementById('categoryInput').value) {
        const err = document.querySelector('#chips')?.parentElement.querySelector('.err-msg');
        if (err) err.classList.add('show');
        ok = false;
    }
    if (n === 3 && coverFile == null) {
        const drop = document.getElementById('coverDrop');
        if (drop) drop.parentElement.querySelector('.err-msg').classList.add('show');
        ok = false;
    }
    return ok;
}

if (form) {
    if (nextBtn) nextBtn.addEventListener('click', () => { if (validateStep(current)) showStep(Math.min(current + 1, total)); });
    if (prevBtn) prevBtn.addEventListener('click', () => showStep(Math.max(current - 1, 1)));
    steps.forEach(s => s.addEventListener('click', () => {
        const target = +s.dataset.step;
        if (target < current || validateStep(current)) showStep(target);
    }));

    // Chips
    document.querySelectorAll('#chips .chip').forEach(c => {
        c.addEventListener('click', () => {
            document.querySelectorAll('#chips .chip').forEach(x => x.classList.remove('active'));
            c.classList.add('active');
            document.getElementById('categoryInput').value = c.dataset.cat;
            const err = document.querySelector('#chips')?.parentElement.querySelector('.err-msg');
            if (err) err.classList.remove('show');
        });
    });

    // Uploads setup
    function setupDrop(dropId, inputId, isMulti, onFiles) {
        const drop = document.getElementById(dropId);
        const input = document.getElementById(inputId);
        if (!drop || !input) return;
        drop.addEventListener('click', () => input.click());
        input.addEventListener('click', e => e.stopPropagation());
        drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
        drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
        drop.addEventListener('drop', e => {
            e.preventDefault();
            drop.classList.remove('drag');
            onFiles([...e.dataTransfer.files]);
        });
        input.addEventListener('change', e => onFiles([...e.target.files]));
    }

    function renderCover() {
        const wrap = document.getElementById('coverPreview');
        if (!wrap) return;
        wrap.innerHTML = '';
        if (!coverFile) return;
        const url = URL.createObjectURL(coverFile);
        wrap.innerHTML = `<div class="preview"><img src="${url}"><button type="button" data-x>×</button></div>`;
        wrap.querySelector('[data-x]').onclick = () => { coverFile = null; renderCover(); };
    }

    function renderGallery() {
        const wrap = document.getElementById('galleryPreview');
        if (!wrap) return;
        wrap.innerHTML = '';
        galleryFiles.forEach((f, i) => {
            const url = URL.createObjectURL(f);
            const div = document.createElement('div');
            div.className = 'preview';
            div.innerHTML = `<img src="${url}"><button type="button">×</button>`;
            div.querySelector('button').onclick = () => { galleryFiles.splice(i, 1); renderGallery(); };
            wrap.appendChild(div);
        });
    }

    setupDrop('coverDrop', 'coverInput', false, (files) => {
        if (files[0]) {
            coverFile = files[0];
            renderCover();
            const err = document.getElementById('coverDrop')?.parentElement.querySelector('.err-msg');
            if (err) err.classList.remove('show');
        }
    });

    setupDrop('galleryDrop', 'galleryInput', true, (files) => {
        galleryFiles = galleryFiles.concat(files);
        renderGallery();
    });

    // Cancel & Draft
    const cancelBtn = document.getElementById('cancelBtn');
    const draftBtn = document.getElementById('draftBtn');

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (confirm('Discard this submission?')) {
                form.reset();
                coverFile = null;
                galleryFiles = [];
                renderCover();
                renderGallery();
                document.querySelectorAll('#chips .chip').forEach(c => c.classList.remove('active'));
                document.getElementById('categoryInput').value = '';
                showStep(1);
            }
        });
    }

    if (draftBtn) {
        draftBtn.addEventListener('click', () => {
            showToast('Draft saved locally', 'fa-bookmark');
        });
    }

    // Submit
    form.addEventListener('submit', async e => {
        e.preventDefault();
        let all = true;
        for (let i = 1; i <= total; i++) {
            if (!validateStep(i)) {
                showStep(i);
                all = false;
                break;
            }
        }
        if (!all) return;
        let submittedPlace = null;
        try {
            submittedPlace = await submitPlaceForApproval(form);
        } catch (error) {
            showToast(error.message || 'Unable to submit place.', 'fa-triangle-exclamation');
        }
        if (!submittedPlace) return;
        showToast('Submitted for admin approval!', 'fa-check');
        form.reset();
        coverFile = null;
        galleryFiles = [];
        renderCover();
        renderGallery();
        document.querySelectorAll('#chips .chip').forEach(c => c.classList.remove('active'));
        document.getElementById('categoryInput').value = '';
        showStep(1);
        closeAddPlaceModal();
    });

    function showToast(msg, icon) {
        showToastGlobal(msg, icon);
    }

    // Clear errors on input
    form.addEventListener('input', e => {
        if (e.target.matches('.input,.select,.textarea')) {
            e.target.classList.remove('error');
            const err = e.target.closest('.field')?.querySelector('.err-msg');
            if (err) err.classList.remove('show');
        }
    });
}

function showToastGlobal(msg, icon) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.querySelector('div strong').textContent = msg;
    t.querySelector('i').className = `fa-solid ${icon || 'fa-check'}`;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// Start the app
init();
