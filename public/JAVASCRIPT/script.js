// Initial Data - Updated structure to match form fields
let places = [
    {
        id: 1,
        name: 'Khopra Danda',
        localName: 'खोप्रा डाँडा',
        tagline: 'Alpine meadow with panoramic mountain views above the clouds',
        province: 'Gandaki',
        district: 'Myagdi',
        municipality: 'Annapurna RM',
        category: 'Viewpoint',
        shortDesc: 'A stunning high-altitude meadow offering breathtaking 360-degree views of the Annapurna, Dhaulagiri, and Nilgiri ranges. The experience of being above the clouds at sunrise is truly magical.',
        bestTime: 'October - November, March - May',
        duration: '3 days / 2 nights',
        things: 'Sunrise hike, sunset watching, local tea houses, photography',
        tips: 'Carry warm clothing, sunscreen, water. No mobile signal above 3000m. Respect the local community.',
        difficulty: 'Moderate',
        budget: 12000,
        transport: 3000,
        stay: 4000,
        food: 3500,
        fee: 500,
        accomDesc: 'Community homestays and basic teahouses available along the route',
        hotels: 'Pokhara (2 hotels)',
        restaurants: 'Local teahouses and small eateries',
        homestay: true,
        parking: false,
        toilets: true,
        coverImage: 'Khopra Danda panoramic mountain view',
        startPoint: 'Pokhara',
        routeDesc: 'From Pokhara, take local bus to Baglung (3 hours), then jeep to Ghar (2 hours). Trek begins from Ghar - Day 1: Ghar to Poon Hill (4 hours). Day 2: Poon Hill to Khopra Danda (5 hours through rhododendron forest). Return via same route.',
        destination: 'Khopra Danda viewpoint'
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
const placeDetailModal = document.getElementById('place-detail-modal');
const addPlaceBtns = document.querySelectorAll('#add-place-btn, #cta-add-btn, #featured-add-btn, .mobile-add-btn');
const backBtn = document.getElementById('back-btn');
const closeFormBtn = document.getElementById('close-form-btn');
const addPlaceModal = document.getElementById('add-place-modal');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const reviewForm = document.getElementById('review-form');
const starRating = document.getElementById('star-rating');

// Initialize
function init() {
    renderCategories();
    // renderPlaces(); // Disabled - using static card layout for now
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

    backBtn.addEventListener('click', closePlaceDetail);
    if (closeFormBtn) closeFormBtn.addEventListener('click', closeAddPlaceModal);
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

function openAddPlaceModal() {
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

    placeDetailModal.classList.add('active');
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
    form.addEventListener('submit', e => {
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
        showToast('Destination published!', 'fa-check');
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
        const t = document.getElementById('toast');
        if (!t) return;
        t.querySelector('div strong').textContent = msg;
        t.querySelector('i').className = `fa-solid ${icon || 'fa-check'}`;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2800);
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

// Start the app
init();