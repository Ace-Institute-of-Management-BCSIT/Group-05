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

const state = {
    activeFeature: 'saved',
    places: [],
    travel: { saved: [], trips: [], notes: [] }
};

const els = {
    avatar: document.getElementById('profile-avatar'),
    name: document.getElementById('profile-name'),
    role: document.getElementById('profile-role'),
    savedCount: document.getElementById('saved-count'),
    tripCount: document.getElementById('trip-count'),
    noteCount: document.getElementById('note-count'),
    tabs: document.getElementById('profile-tabs'),
    boardTitle: document.getElementById('board-title'),
    boardSubtitle: document.getElementById('board-subtitle'),
    boardGrid: document.getElementById('profile-board-grid'),
    status: document.getElementById('profile-status'),
    search: document.getElementById('profile-search'),
    placeSelect: document.getElementById('quick-place-select'),
    noteText: document.getElementById('quick-note-text'),
    quickSave: document.getElementById('quick-save-btn'),
    quickPlan: document.getElementById('quick-plan-btn'),
    quickNote: document.getElementById('quick-note-btn'),
    refresh: document.getElementById('refresh-profile-btn'),
    logout: document.getElementById('profile-logout-btn'),
    toast: document.getElementById('profile-toast')
};

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return '';
}

function isUserLoggedIn() {
    return Boolean(localStorage.getItem('isAdmin') === 'true' || localStorage.getItem('userRole') || getCookie('userRole'));
}

function getUserName() {
    return localStorage.getItem('userName') || getCookie('userName') || 'Traveler';
}

function getUserRole() {
    return localStorage.getItem('userRole') || getCookie('userRole') || 'User';
}

function normalizePlace(place) {
    return {
        id: Number(place.id),
        name: place.name || `Place ${place.id}`,
        category: place.category || 'Destination',
        district: place.district || '',
        province: place.province || '',
        location: place.location || [place.district, place.province].filter(Boolean).join(', ') || 'Nepal',
        rating: Number(place.rating) || 0,
        coverImage: place.coverImage || place.cover_image || ''
    };
}

function getPlace(placeId) {
    return state.places.find(place => Number(place.id) === Number(placeId));
}

function getPlaceName(placeId) {
    return getPlace(placeId)?.name || `Place ${placeId}`;
}

function formatDate(value) {
    if (!value) return 'Recently updated';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Recently updated';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function setStatus(message) {
    if (els.status) els.status.textContent = message;
}

function showToast(message, icon = 'fa-check') {
    if (!els.toast) return;
    els.toast.querySelector('strong').textContent = message;
    els.toast.querySelector('i').className = `fa-solid ${icon}`;
    els.toast.classList.add('show');
    setTimeout(() => els.toast.classList.remove('show'), 2600);
}

async function fetchJson(url, options = {}) {
    const response = await fetch(url, { credentials: 'same-origin', ...options });
    if (response.status === 401) {
        window.location.href = 'login.html';
        return null;
    }
    return response.json();
}

async function loadPlaces() {
    const data = await fetchJson('../../PHP/places.php?action=approved');
    state.places = data?.success ? (data.places || []).map(normalizePlace) : [];
    renderPlaceSelect();
}

async function loadTravelBoard() {
    setStatus('Loading your travel board...');
    const data = await fetchJson('../../PHP/travel.php?action=get');
    if (!data) return;
    if (!data.success) {
        setStatus(data.message || 'Unable to load your profile board.');
        return;
    }

    state.travel = {
        saved: data.saved || [],
        trips: data.trips || [],
        notes: data.notes || []
    };

    updateCounts();
    renderBoard();
}

function renderIdentity() {
    const userName = getUserName();
    const userRole = getUserRole();
    if (els.name) els.name.textContent = userName;
    if (els.role) els.role.textContent = `${userRole.charAt(0).toUpperCase()}${userRole.slice(1)} account`;
    if (els.avatar) els.avatar.textContent = userName.charAt(0).toUpperCase();
}

function updateCounts() {
    if (els.savedCount) els.savedCount.textContent = state.travel.saved.length;
    if (els.tripCount) els.tripCount.textContent = state.travel.trips.length;
    if (els.noteCount) els.noteCount.textContent = state.travel.notes.length;
}

function renderPlaceSelect() {
    if (!els.placeSelect) return;
    if (state.places.length === 0) {
        els.placeSelect.innerHTML = '<option value="">No approved places found</option>';
        return;
    }

    els.placeSelect.innerHTML = [
        '<option value="">Choose a destination</option>',
        ...state.places.map(place => `<option value="${place.id}">${escapeHtml(place.name)}</option>`)
    ].join('');
}

function setActiveFeature(feature) {
    state.activeFeature = feature;
    document.querySelectorAll('.profile-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.feature === feature);
    });
    renderBoard();
}

function getBoardConfig() {
    const configs = {
        saved: {
            title: 'Saved Places',
            subtitle: 'Places you want to keep close for later.',
            empty: 'No saved places yet. Use Quick Add or open a destination and save it.',
            status: 'Saved places loaded.',
            items: state.travel.saved.map(item => ({
                key: `saved-${item.place_id}`,
                icon: 'fa-bookmark',
                title: getPlaceName(item.place_id),
                meta: `Saved ${formatDate(item.saved_at)}`,
                placeId: item.place_id,
                action: 'remove_saved',
                actionLabel: 'Remove'
            }))
        },
        trips: {
            title: 'Future Trips',
            subtitle: 'Destinations you are planning to visit.',
            empty: 'No future trips yet. Add one from Quick Add.',
            status: 'Future trips loaded.',
            items: state.travel.trips.map(item => ({
                key: `trip-${item.place_id}`,
                icon: 'fa-calendar-days',
                title: getPlaceName(item.place_id),
                meta: `Planned ${formatDate(item.planned_at)}`,
                placeId: item.place_id,
                action: 'remove_trip',
                actionLabel: 'Remove'
            }))
        },
        notes: {
            title: 'Trip Notes',
            subtitle: 'Private reminders, ideas, and planning details.',
            empty: 'No notes yet. Write one from Quick Add.',
            status: 'Trip notes loaded.',
            items: state.travel.notes.map(note => ({
                key: `note-${note.id}`,
                icon: 'fa-note-sticky',
                title: note.note_text,
                meta: `${getPlaceName(note.place_id)} - ${formatDate(note.created_at)}`,
                noteId: note.id,
                action: 'delete_note',
                actionLabel: 'Delete'
            }))
        },
        tools: {
            title: 'Travel Tools',
            subtitle: 'Useful shortcuts for shaping your next route.',
            empty: '',
            status: 'Travel tools ready.',
            items: [
                { key: 'tool-explore', icon: 'fa-compass', title: 'Explore destinations', meta: 'Browse all approved places.', href: 'index.html' },
                { key: 'tool-add', icon: 'fa-plus', title: 'Add destination', meta: 'Open the add place form from the home page.', href: 'index.html#add-place' },
                { key: 'tool-refresh', icon: 'fa-rotate-right', title: 'Refresh board', meta: 'Sync saved places, trips, and notes.', action: 'refresh', actionLabel: 'Refresh' }
            ]
        }
    };
    return configs[state.activeFeature] || configs.saved;
}

function renderBoard() {
    if (!els.boardGrid) return;
    const config = getBoardConfig();
    const query = (els.search?.value || '').trim().toLowerCase();
    const items = query
        ? config.items.filter(item => `${item.title} ${item.meta}`.toLowerCase().includes(query))
        : config.items;

    if (els.boardTitle) els.boardTitle.textContent = config.title;
    if (els.boardSubtitle) els.boardSubtitle.textContent = config.subtitle;
    setStatus(config.status);

    if (items.length === 0) {
        els.boardGrid.innerHTML = `<div class="profile-empty-state">${escapeHtml(query ? 'No matching items found.' : config.empty)}</div>`;
        return;
    }

    els.boardGrid.innerHTML = items.map(renderBoardCard).join('');
}

function renderBoardCard(item) {
    const button = item.href
        ? `<a class="profile-card-action" href="${item.href}">Open</a>`
        : `<button class="profile-card-action" type="button" data-action="${item.action || ''}" data-place-id="${item.placeId || ''}" data-note-id="${item.noteId || ''}">${item.actionLabel || 'Open'}</button>`;

    return `
        <article class="profile-board-card">
            <div class="profile-board-card-icon"><i class="fa-solid ${item.icon}"></i></div>
            <div class="profile-board-card-body">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.meta)}</p>
            </div>
            ${button}
        </article>
    `;
}

async function postTravelAction(action, payload = {}) {
    const formData = new FormData();
    formData.append('action', action);
    Object.entries(payload).forEach(([key, value]) => formData.append(key, value));

    const data = await fetchJson('../../PHP/travel.php', {
        method: 'POST',
        body: formData
    });

    if (!data) return false;
    if (!data.success) {
        showToast(data.message || 'Action failed.', 'fa-triangle-exclamation');
        return false;
    }

    showToast(data.message || 'Profile updated.');
    await loadTravelBoard();
    return true;
}

function getSelectedPlaceId() {
    const placeId = els.placeSelect?.value || '';
    if (!placeId) {
        showToast('Choose a destination first.', 'fa-triangle-exclamation');
        return '';
    }
    return placeId;
}

async function handleBoardAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    if (action === 'refresh') {
        await loadTravelBoard();
        showToast('Profile board refreshed.');
        return;
    }

    if (action === 'delete_note') {
        await postTravelAction(action, { note_id: button.dataset.noteId });
        return;
    }

    if (action === 'remove_saved' || action === 'remove_trip') {
        await postTravelAction(action, { place_id: button.dataset.placeId });
    }
}

function logout() {
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    document.cookie = 'userRole=; path=/; max-age=0';
    document.cookie = 'userName=; path=/; max-age=0';
    window.location.href = 'login.html';
}

function bindEvents() {
    els.tabs?.addEventListener('click', event => {
        const tab = event.target.closest('.profile-tab');
        if (tab) setActiveFeature(tab.dataset.feature);
    });
    els.boardGrid?.addEventListener('click', handleBoardAction);
    els.search?.addEventListener('input', renderBoard);
    els.refresh?.addEventListener('click', async () => {
        await loadTravelBoard();
        showToast('Profile board refreshed.');
    });
    els.logout?.addEventListener('click', logout);
    els.quickSave?.addEventListener('click', () => {
        const placeId = getSelectedPlaceId();
        if (placeId) postTravelAction('save_place', { place_id: placeId }).then(() => setActiveFeature('saved'));
    });
    els.quickPlan?.addEventListener('click', () => {
        const placeId = getSelectedPlaceId();
        if (placeId) postTravelAction('plan_trip', { place_id: placeId }).then(() => setActiveFeature('trips'));
    });
    els.quickNote?.addEventListener('click', async () => {
        const placeId = getSelectedPlaceId();
        const note = els.noteText?.value.trim() || '';
        if (!placeId) return;
        if (!note) {
            showToast('Write a note first.', 'fa-triangle-exclamation');
            return;
        }

        const saved = await postTravelAction('add_note', { place_id: placeId, note_text: note });
        if (saved && els.noteText) els.noteText.value = '';
        if (saved) setActiveFeature('notes');
    });
}

async function initProfile() {
    if (!isUserLoggedIn()) {
        window.location.href = 'login.html';
        return;
    }

    renderIdentity();
    bindEvents();
    await loadPlaces();
    await loadTravelBoard();
}

initProfile();
