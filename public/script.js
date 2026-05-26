// Initial Data
let places = [
    {
        id: 1,
        name: 'Emerald Lake',
        location: 'British Columbia, Canada',
        rating: 4.8,
        reviews: 234,
        image: 'Mountain Lake',
        category: 'Nature',
        description: 'A stunning alpine lake surrounded by towering peaks and pristine wilderness. The crystal-clear waters reflect the surrounding mountains, creating a breathtaking vista that attracts photographers and nature lovers from around the world.'
    },
    {
        id: 2,
        name: 'Ancient Temple Ruins',
        location: 'Angkor, Cambodia',
        rating: 4.9,
        reviews: 567,
        image: 'Historical Site',
        category: 'Historical',
        description: 'Explore centuries-old temple complexes nestled in lush jungle. These magnificent structures showcase incredible architectural achievements and offer a glimpse into ancient civilizations.'
    },
    {
        id: 3,
        name: 'Paradise Beach',
        location: 'Maldives',
        rating: 4.7,
        reviews: 423,
        image: 'Beach Paradise',
        category: 'Beach',
        description: 'White sandy beaches meet crystal clear turquoise waters in this tropical paradise. Perfect for snorkeling, diving, or simply relaxing under the palm trees.'
    },
    {
        id: 4,
        name: 'Mountain Vista Trail',
        location: 'Swiss Alps, Switzerland',
        rating: 4.9,
        reviews: 312,
        image: 'Alpine Trail',
        category: 'Adventure',
        description: 'Challenge yourself with this spectacular mountain trail offering panoramic views of snow-capped peaks and alpine meadows. An unforgettable hiking experience for adventure enthusiasts.'
    },
    {
        id: 5,
        name: 'Hidden Waterfall',
        location: 'Iceland',
        rating: 4.6,
        reviews: 189,
        image: 'Waterfall Wonder',
        category: 'Nature',
        description: 'Discover this secluded waterfall cascading through dramatic volcanic landscapes. The raw power of nature on full display in one of Iceland\'s hidden gems.'
    },
    {
        id: 6,
        name: 'Urban Art District',
        location: 'Tokyo, Japan',
        rating: 4.5,
        reviews: 278,
        image: 'City Streets',
        category: 'Urban',
        description: 'Immerse yourself in vibrant street art and contemporary culture in Tokyo\'s trendiest neighborhood. A perfect blend of traditional Japanese culture and modern urban art.'
    },
    {
        id: 7,
        name: 'Sunrise Ridge Viewpoint',
        location: 'Pokhara, Nepal',
        rating: 4.9,
        reviews: 198,
        image: 'Golden Peaks',
        category: 'Nature',
        description: 'Watch the Himalayan range glow at sunrise from this peaceful ridge above the valley. It is a calm, photogenic stop for travelers who want big views without a difficult hike.'
    },
    {
        id: 8,
        name: 'Riverside Heritage Walk',
        location: 'Bhaktapur, Nepal',
        rating: 4.8,
        reviews: 256,
        image: 'Old Streets',
        category: 'Cultural',
        description: 'A relaxed walking route through preserved courtyards, local craft shops, and traditional architecture. Perfect for travelers who want a slower, more immersive cultural experience.'
    },
    {
        id: 9,
        name: 'Hidden Valley Camp',
        location: 'Langtang, Nepal',
        rating: 4.7,
        reviews: 164,
        image: 'Mountain Camp',
        category: 'Adventure',
        description: 'A scenic basecamp surrounded by forested slopes and mountain air. Great for overnight stays, stargazing, and adventure-focused trips away from the crowds.'
    }
];

const categories = ['All', 'Nature', 'Beach', 'Historical', 'Urban', 'Adventure', 'Cultural'];

let currentFilter = 'All';
let searchQuery = '';
let selectedPlace = null;
let userRating = 0;

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
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
const searchInput = document.getElementById('search-input');
const categoriesContainer = document.getElementById('categories');
const placesGrid = document.getElementById('places-grid');
const noResults = document.getElementById('no-results');
const addPlaceModal = document.getElementById('add-place-modal');
const placeDetailModal = document.getElementById('place-detail-modal');
const addPlaceBtns = document.querySelectorAll('#add-place-btn, #cta-add-btn, #featured-add-btn, .mobile-add-btn');
const closeModalBtn = document.getElementById('close-modal-btn');
const cancelBtn = document.getElementById('cancel-btn');
const addPlaceForm = document.getElementById('add-place-form');
const backBtn = document.getElementById('back-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const reviewForm = document.getElementById('review-form');
const starRating = document.getElementById('star-rating');

// Initialize
function init() {
    renderCategories();
    renderPlaces();
    updateStats();
    attachEventListeners();
}

// Event Listeners
function attachEventListeners() {
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleLogin);
    if (userBtn) userBtn.addEventListener('click', openLoginPage);
    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMobileMenu);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            filterPlaces();
        });
    }

    addPlaceBtns.forEach(btn => {
        btn.addEventListener('click', openAddPlaceModal);
    });
    closeModalBtn.addEventListener('click', closeAddPlaceModal);
    cancelBtn.addEventListener('click', closeAddPlaceModal);
    addPlaceForm.addEventListener('submit', handleAddPlace);

    backBtn.addEventListener('click', closePlaceDetail);
    clearFiltersBtn.addEventListener('click', clearFilters);
    reviewForm.addEventListener('submit', handleReviewSubmit);

    const starBtns = starRating.querySelectorAll('.star-btn');
    starBtns.forEach(btn => {
        btn.addEventListener('click', () => setRating(parseInt(btn.dataset.rating)));
        btn.addEventListener('mouseenter', () => highlightStars(parseInt(btn.dataset.rating)));
    });
    starRating.addEventListener('mouseleave', () => highlightStars(userRating));

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

function openLoginPage() {
    window.location.href = 'login.html';
}

// Mobile Menu
function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
}

// Categories
function renderCategories() {
    categoriesContainer.innerHTML = categories.map(cat => `
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

        placesGrid.innerHTML = filteredPlaces.map(place => `
            <div class="place-card" onclick="openPlaceDetail(${place.id})">
                <div class="place-image">
                    <svg class="icon-large" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div class="place-category">${place.category}</div>
                </div>
                <div class="place-info">
                    <h3 class="place-name">${place.name}</h3>
                    <div class="place-location">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                        <span>${place.location}</span>
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
        `).join('');
    }

    updateSectionHeader(filteredPlaces.length);
}

function getFilteredPlaces() {
    return places
        .filter(place => {
            const matchesCategory = currentFilter === 'All' || place.category === currentFilter;
            const matchesSearch = place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                place.location.toLowerCase().includes(searchQuery.toLowerCase());
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

// Add Place Modal
function openAddPlaceModal() {
    addPlaceModal.classList.add('active');
    mobileMenu.classList.remove('active');
}

function closeAddPlaceModal() {
    addPlaceModal.classList.remove('active');
    addPlaceForm.reset();
}

function handleAddPlace(e) {
    e.preventDefault();

    const newPlace = {
        id: Date.now(),
        name: document.getElementById('place-name').value,
        location: document.getElementById('place-location').value,
        category: document.getElementById('place-category').value,
        description: document.getElementById('place-description').value,
        rating: 0,
        reviews: 0,
        image: 'New Location'
    };

    places.unshift(newPlace);
    closeAddPlaceModal();
    renderPlaces();
    updateStats();
}

// Place Detail
function openPlaceDetail(id) {
    selectedPlace = places.find(p => p.id === id);
    if (!selectedPlace) return;

    document.getElementById('detail-name').textContent = selectedPlace.name;
    document.getElementById('detail-location').innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${selectedPlace.location}
    `;

    document.getElementById('detail-meta').innerHTML = `
        <div class="detail-rating">
            <span class="rating-badge">${selectedPlace.rating.toFixed(1)} / 5</span>
        </div>
        <div style="width: 1px; height: 2rem; background: var(--border-color);"></div>
        <div class="detail-reviews">
            <span>${selectedPlace.reviews}</span> reviews
        </div>
        <div style="width: 1px; height: 2rem; background: var(--border-color);"></div>
        <div class="detail-category">${selectedPlace.category}</div>
    `;

    document.getElementById('detail-desc').textContent = selectedPlace.description;
    renderReviews();

    placeDetailModal.classList.add('active');
    userRating = 0;
    highlightStars(0);
    document.getElementById('review-text').value = '';
}

function closePlaceDetail() {
    placeDetailModal.classList.remove('active');
    selectedPlace = null;
}

function renderReviews() {
    document.getElementById('review-count').textContent = `(${sampleReviews.length})`;
    document.getElementById('reviews-list').innerHTML = sampleReviews.map(review => `
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
                            <h4 class="review-author">${review.author}</h4>
                            <div class="review-date">${review.date}</div>
                        </div>
                        <span class="rating-badge rating-badge-sm">${review.rating}/5</span>
                    </div>
                    <p class="review-text">${review.comment}</p>
                    <button class="review-helpful">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        <span>Helpful (${review.helpful})</span>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
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

function handleReviewSubmit(e) {
    e.preventDefault();
    const reviewText = document.getElementById('review-text').value;

    if (userRating === 0) {
        alert('Please select a rating');
        return;
    }

    alert('Review submitted successfully!');
    userRating = 0;
    highlightStars(0);
    document.getElementById('review-text').value = '';
}

// Start the app
init();