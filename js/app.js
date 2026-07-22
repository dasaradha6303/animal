/* ===== State ===== */
let currentPage = 'home';
let favorites = new Set(JSON.parse(localStorage.getItem('arps_favorites') || '[]'));
let allAnimals = [];
let adoptFilterType = 'All';
let adoptFilterGender = 'All';
let adoptFilterStatus = 'All';
let showFilters = false;
let selectedAnimal = null;
let allReports = [];
let allAlerts = [];
let severitySelection = 'medium';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' },
  { id: 'adopt', label: 'Adopt', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' },
  { id: 'report', label: 'Report', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' },
  { id: 'alerts', label: 'Alerts', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
  { id: 'profile', label: 'Profile', icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' },
];

/* ===== Favorites ===== */
function toggleFavorite(id) {
  if (favorites.has(id)) favorites.delete(id); else favorites.add(id);
  localStorage.setItem('arps_favorites', JSON.stringify([...favorites]));
  renderNav();
  if (currentPage === 'home') loadHomeRecentAnimals();
  if (currentPage === 'adopt') { renderAdoptGrid(); renderRecommended(); }
  if (selectedAnimal && selectedAnimal.id == id) renderAnimalModal(selectedAnimal);
}

function saveFav(id) { return favorites.has(id); }

/* ===== Navigation ===== */
function navigate(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${page}`).classList.add('active');
  renderNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  loadPageData(page);
}

function renderNav() {
  const sidebarList = document.getElementById('sidebar-nav-list');
  sidebarList.innerHTML = NAV_ITEMS.map(item => `
    <li><button class="${currentPage === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
      ${item.icon}<span>${item.label}</span>
      ${item.id === 'adopt' && favorites.size > 0 ? `<span class="favorites-badge">${favorites.size}</span>` : ''}
      ${currentPage === item.id ? '<span class="nav-active-dot"></span>' : ''}
    </button></li>
  `).join('');

  const bottomNav = document.getElementById('bottom-nav');
  bottomNav.innerHTML = `<div class="bottom-nav-inner">${NAV_ITEMS.map(item => `
    <button class="bottom-nav-btn ${currentPage === item.id ? 'active' : ''}" onclick="navigate('${item.id}')">
      ${item.icon}<span class="bottom-nav-label">${item.label}</span>
    </button>
  `).join('')}</div>`;
}

/* ===== Load Page Data ===== */
function loadPageData(page) {
  switch (page) {
    case 'home': loadHome(); break;
    case 'adopt': loadAdopt(); break;
    case 'report': loadReports(); break;
    case 'alerts': loadAlerts(); break;
  }
}

/* ===== HOME ===== */
async function loadHome() {
  const data = await apiGet('stats.php');
  const stats = data.stats || {};

  document.getElementById('home-stats').innerHTML = [
    { label: 'Animals Available', value: stats.available || 0, color: 'var(--primary)', bg: 'var(--primary-50)' },
    { label: 'Successful Adoptions', value: stats.adopted || 0, color: 'var(--danger)', bg: 'var(--danger-50)' },
    { label: 'Active Alerts', value: stats.alerts || 0, color: 'var(--accent)', bg: 'var(--accent-50)' },
    { label: 'Reports Resolved', value: stats.resolved || 0, color: 'var(--success)', bg: 'var(--success-50)' },
  ].map(s => `
    <div class="card stat-card">
      <div class="stat-icon" style="background:${s.bg}"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 22c-4.97 0-9-2.69-9-6v-2c0-3.31 4.03-6 9-6s9 2.69 9 6v2c0 3.31-4.03 6-9 6z"/></svg></div>
      <div><p class="stat-value">${s.value}</p><p class="stat-label">${s.label}</p></div>
    </div>
  `).join('');

  const actions = [
    { label: 'Adopt Animal', color: 'var(--primary-100)', textColor: 'var(--primary-700)', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z', page: 'adopt' },
    { label: 'Report Dead Animal', color: 'var(--secondary-100)', textColor: 'var(--secondary-700)', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', page: 'report' },
    { label: 'Report Wild Animal', color: 'var(--accent-100)', textColor: 'var(--accent-700)', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', page: 'alerts' },
    { label: 'View Alerts', color: 'var(--danger-100)', textColor: 'var(--danger-700)', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', page: 'alerts' },
  ];
  document.getElementById('quick-actions').innerHTML = actions.map(a => `
    <button class="quick-action-btn" onclick="navigate('${a.page}')">
      <div class="quick-action-icon" style="background:${a.color}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${a.textColor}" stroke-width="2"><path d="${a.icon}"/></svg></div>
      <span class="quick-action-label">${a.label}</span>
    </button>
  `).join('');

  loadHomeRecentAnimals();

  const contacts = [
    { name: 'Animal Rescue', number: '1-800-RESCUE', color: 'var(--primary-50)', textColor: 'var(--primary-600)', icon: 'circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="4" cy="8" r="2" /><path d="M12 22c-4.97 0-9-2.69-9-6v-2c0-3.31 4.03-6 9-6s9 2.69 9 6v2c0 3.31-4.03 6-9 6z' },
    { name: 'Forest Department', number: '1-800-FOREST', color: 'var(--success-50)', textColor: 'var(--success-600)', icon: 'M17 14V2M9 14V2M5 14v4a2 2 0 002 2h10a2 2 0 002-2v-4M12 2L5 14h14L12 2z' },
    { name: 'Municipal Services', number: '1-800-MUNI', color: 'var(--secondary-50)', textColor: 'var(--secondary-600)', icon: 'M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16' },
    { name: 'Veterinary Emergency', number: '1-800-VET-911', color: 'var(--accent-50)', textColor: 'var(--accent-600)', icon: 'M4.8 2.3A.3.3 0 105 2H4a2 2 0 00-2 2v5a6 6 0 006 6 6 6 0 006-6V4a2 2 0 00-2-2h-1a.2.2 0 10.3.3' },
  ];
  document.getElementById('home-contacts').innerHTML = contacts.map(c => `
    <a href="tel:${c.number}" class="card contact-card card-hover">
      <div class="contact-icon" style="background:${c.color}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${c.textColor}" stroke-width="2"><${c.icon}</svg></div>
      <div class="contact-info"><p class="contact-name">${c.name}</p><p class="contact-number">${c.number}</p></div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
    </a>
  `).join('');
}

async function loadHomeRecentAnimals() {
  const data = await apiGet('stats.php');
  const animals = data.recent_animals || [];
  const container = document.getElementById('home-recent-animals');
  if (animals.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:64px 16px;color:var(--text-muted)"><p style="font-size:40px;margin-bottom:12px">🐾</p><p style="font-weight:600">No animals yet</p><p style="font-size:14px">Check back soon for new arrivals.</p></div>';
    return;
  }
  container.innerHTML = animals.map(a => renderAnimalCard(a)).join('');
}

function renderAnimalCard(a) {
  const emoji = TYPE_EMOJI[a.animal_type] || '🐾';
  const statusClass = a.adoption_status === 'available' ? 'badge-success' : a.adoption_status === 'pending' ? 'badge-warning' : 'badge-neutral';
  const statusLabel = a.adoption_status.charAt(0).toUpperCase() + a.adoption_status.slice(1);
  const img = a.image_url ? `<img src="${a.image_url}" alt="${a.name}" loading="lazy">` : `<div class="animal-card-placeholder">${emoji}</div>`;
  const isFav = favorites.has(String(a.id));

  return `
  <div class="animal-card" onclick="openAnimalDetail(${a.id})">
    <div class="animal-card-img">
      ${img}
      <div class="animal-card-badge"><span class="badge ${statusClass}">${statusLabel}</span></div>
      <button class="animal-card-fav ${isFav ? 'favorited' : ''}" onclick="event.stopPropagation();toggleFavorite('${a.id}')" aria-label="${isFav ? 'Remove favorite' : 'Add favorite'}">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
    </div>
    <div class="animal-card-body">
      <div class="animal-card-top">
        <h3 class="animal-card-name">${a.name}</h3>
        <span>${emoji}</span>
      </div>
      <p class="animal-card-breed">${a.breed}</p>
      <div class="animal-card-meta">
        <div class="animal-card-meta-item">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 22c-4.97 0-9-2.69-9-6v-2c0-3.31 4.03-6 9-6s9 2.69 9 6v2c0 3.31-4.03 6-9 6z"/></svg>
          <span>${ageLabel(a.age_years)}</span>
        </div>
        <div class="animal-card-meta-item">
          <span class="gender-dot ${a.gender === 'Male' ? 'gender-male' : 'gender-female'}"></span>
          <span>${a.gender}</span>
        </div>
      </div>
      <div class="animal-card-footer">
        <p class="animal-card-shelter">${a.shelter_name}</p>
        <div class="animal-card-location">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <span>${a.location}</span>
        </div>
        ${(a.vaccinated || a.sterilized) ? `<div class="animal-card-tags">
          ${a.vaccinated ? '<span class="animal-tag"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Vaccinated</span>' : ''}
          ${a.sterilized ? '<span class="animal-tag"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Sterilized</span>' : ''}
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

/* ===== ADOPT ===== */
async function loadAdopt() {
  allAnimals = await apiGet('animals.php');
  renderAdoptGrid();
  renderRecommended();
  initFilterChips();
}

function initFilterChips() {
  const types = ['All', 'Dog', 'Cat', 'Bird', 'Rabbit', 'Other'];
  const genders = ['All', 'Male', 'Female'];
  const statuses = ['All', 'available', 'pending', 'adopted'];

  document.getElementById('filter-type-chips').innerHTML = types.map(t =>
    `<button class="chip ${adoptFilterType === t ? 'chip-active' : 'chip-default'}" onclick="setFilter('type','${t}')">${t}</button>`
  ).join('');
  document.getElementById('filter-gender-chips').innerHTML = genders.map(g =>
    `<button class="chip ${adoptFilterGender === g ? 'chip-active' : 'chip-default'}" onclick="setFilter('gender','${g}')">${g}</button>`
  ).join('');
  document.getElementById('filter-status-chips').innerHTML = statuses.map(s =>
    `<button class="chip ${adoptFilterStatus === s ? 'chip-active' : 'chip-default'}" onclick="setFilter('status','${s}')">${s.charAt(0).toUpperCase() + s.slice(1)}</button>`
  ).join('');

  updateFilterCount();
}

function setFilter(type, value) {
  if (type === 'type') adoptFilterType = value;
  if (type === 'gender') adoptFilterGender = value;
  if (type === 'status') adoptFilterStatus = value;
  initFilterChips();
  renderAdoptGrid();
}

function toggleFilters() {
  showFilters = !showFilters;
  document.getElementById('filter-panel').style.display = showFilters ? 'block' : 'none';
}

function clearFilters() {
  adoptFilterType = 'All';
  adoptFilterGender = 'All';
  adoptFilterStatus = 'All';
  initFilterChips();
  renderAdoptGrid();
}

function updateFilterCount() {
  const count = [adoptFilterType, adoptFilterGender, adoptFilterStatus].filter(f => f !== 'All').length;
  const el = document.getElementById('filter-count');
  if (count > 0) { el.style.display = 'inline'; el.textContent = count; }
  else el.style.display = 'none';
  const clearBtn = document.getElementById('clear-filters-btn');
  if (clearBtn) clearBtn.style.display = count > 0 ? 'flex' : 'none';
}

function filterAdoptAnimals() { renderAdoptGrid(); }

function getFilteredAnimals() {
  const search = (document.getElementById('adopt-search')?.value || '').toLowerCase();
  return allAnimals.filter(a => {
    if (search && !a.name.toLowerCase().includes(search) && !a.breed.toLowerCase().includes(search)) return false;
    if (adoptFilterType !== 'All' && a.animal_type !== adoptFilterType) return false;
    if (adoptFilterGender !== 'All' && a.gender !== adoptFilterGender) return false;
    if (adoptFilterStatus !== 'All' && a.adoption_status !== adoptFilterStatus) return false;
    return true;
  });
}

function renderAdoptGrid() {
  const filtered = getFilteredAnimals();
  document.getElementById('adopt-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'animal' : 'animals'} available for adoption`;
  const container = document.getElementById('adopt-grid');
  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:64px 16px;color:var(--text-muted)"><p style="font-size:40px;margin-bottom:12px">🐾</p><p style="font-weight:600">No animals found</p><p style="font-size:14px">Try adjusting your search or filters.</p></div>';
  } else {
    container.innerHTML = filtered.map(a => renderAnimalCard(a)).join('');
  }
}

function renderRecommended() {
  const recommended = allAnimals.filter(a => a.adoption_status === 'available').slice(0, 3);
  const section = document.getElementById('recommended-section');
  if (recommended.length === 0) { section.style.display = 'none'; return; }
  section.style.display = 'block';
  document.getElementById('recommended-grid').innerHTML = recommended.map(a => renderAnimalCard(a)).join('');
}

/* ===== Animal Detail Modal ===== */
async function openAnimalDetail(id) {
  const animal = allAnimals.find(a => a.id == id);
  if (!animal) return;
  selectedAnimal = animal;
  renderAnimalModal(animal);
}

function renderAnimalModal(animal) {
  const modal = document.getElementById('animal-modal');
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';
  const emoji = TYPE_EMOJI[animal.animal_type] || '🐾';
  const isFav = favorites.has(String(animal.id));
  const img = animal.image_url ? `<img src="${animal.image_url}" alt="${animal.name}">` : `<div class="modal-img-placeholder">${emoji}</div>`;
  const statusClass = animal.adoption_status === 'available' ? 'badge-success' : animal.adoption_status === 'pending' ? 'badge-warning' : 'badge-neutral';

  document.getElementById('modal-body').innerHTML = `
    <div class="modal-img">
      ${img}
      <button class="modal-close-mobile" onclick="closeAnimalModal()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      <button class="animal-card-fav ${isFav ? 'favorited' : ''}" style="position:absolute;bottom:12px;right:12px" onclick="toggleFavorite('${animal.id}')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
      </button>
      <div style="position:absolute;top:12px;left:12px"><span class="badge ${statusClass}">${animal.adoption_status}</span></div>
      <button class="modal-close-desktop" onclick="closeAnimalModal()" style="position:absolute;top:12px;right:12px"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
    </div>
    <div class="modal-body">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:20px">
        <div><h2 class="modal-title">${animal.name}</h2><p class="modal-subtitle">${animal.breed}</p></div>
        <span style="font-size:30px">${emoji}</span>
      </div>

      <div class="info-grid" style="margin-bottom:20px">
        <div class="info-tile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="margin:0 auto 4px"><circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="4" cy="8" r="2"/><path d="M12 22c-4.97 0-9-2.69-9-6v-2c0-3.31 4.03-6 9-6s9 2.69 9 6v2c0 3.31-4.03 6-9 6z"/></svg>
          <p class="info-tile-label">Age</p><p class="info-tile-value">${ageLabel(animal.age_years)}</p>
        </div>
        <div class="info-tile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2" style="margin:0 auto 4px"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          <p class="info-tile-label">Gender</p><p class="info-tile-value">${animal.gender}</p>
        </div>
        <div class="info-tile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${animal.vaccinated ? 'var(--success-500)' : 'var(--text-muted)'}" stroke-width="2" style="margin:0 auto 4px"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <p class="info-tile-label">Vaccinated</p><p class="info-tile-value">${animal.vaccinated ? 'Yes' : 'No'}</p>
        </div>
        <div class="info-tile">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${animal.sterilized ? 'var(--success-500)' : 'var(--text-muted)'}" stroke-width="2" style="margin:0 auto 4px"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="6" r="8"/><line x1="20" y1="4" x2="8.12" y2="15.88"/></svg>
          <p class="info-tile-label">Sterilized</p><p class="info-tile-value">${animal.sterilized ? 'Yes' : 'No'}</p>
        </div>
      </div>

      ${animal.description ? `<div style="margin-bottom:20px"><h3 style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:6px">About ${animal.name}</h3><p style="font-size:14px;color:var(--text-muted);line-height:1.7">${animal.description}</p></div>` : ''}

      <div class="shelter-info-box" style="margin-bottom:20px">
        <h3 style="font-size:14px;font-weight:600;color:var(--text-secondary);margin-bottom:8px">Shelter Information</h3>
        <p style="font-size:14px;font-weight:500;color:var(--text)">${animal.shelter_name}</p>
        <div style="display:flex;align-items:center;gap:4px;font-size:14px;color:var(--text-muted);margin-top:4px">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${animal.location}
        </div>
        <p style="font-size:12px;color:var(--text-muted);margin-top:6px">Listed ${timeAgo(animal.created_at)}</p>
      </div>

      <div class="modal-actions" id="modal-actions">
        ${animal.adoption_status === 'available' ? `<button class="btn btn-primary flex-1" onclick="showModalForm('adopt')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg> Adopt ${animal.name}</button>` : ''}
        <button class="btn btn-secondary flex-1" onclick="showModalForm('callback')"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg> Request Callback</button>
        <a href="tel:1-800-RESCUE" class="btn btn-secondary" style="padding:10px" title="Call shelter"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>
        <a href="mailto:shelter@example.com" class="btn btn-secondary" style="padding:10px" title="Email shelter"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></a>
      </div>
    </div>`;
}

function showModalForm(type) {
  const actionsEl = document.getElementById('modal-actions');
  if (type === 'adopt') {
    actionsEl.innerHTML = `
      <div class="modal-adopt-form w-full" style="width:100%">
        <div class="form-header"><h3 class="font-semibold">Adoption Request</h3><button class="btn btn-ghost btn-sm" onclick="renderAnimalModal(selectedAnimal)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel</button></div>
        <form onsubmit="submitAdopt(event)" style="margin-top:12px">
          <div class="form-grid-2" style="margin-bottom:12px">
            <div><label class="label">Full Name *</label><input class="input" required placeholder="Your name"></div>
            <div><label class="label">Phone *</label><input class="input" required placeholder="Your phone"></div>
            <div><label class="label">Email *</label><input class="input" required type="email" placeholder="you@example.com"></div>
            <div><label class="label">Address</label><input class="input" placeholder="Your address"></div>
          </div>
          <div style="margin-bottom:12px"><label class="label">Why do you want to adopt?</label><textarea class="input textarea" placeholder="Tell the shelter about your home and experience..."></textarea></div>
          <button type="submit" class="btn btn-primary w-full">Submit Adoption Request <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></button>
        </form>
      </div>`;
  } else {
    actionsEl.innerHTML = `
      <div class="modal-adopt-form w-full" style="width:100%">
        <div class="form-header"><h3 class="font-semibold">Request a Callback</h3><button class="btn btn-ghost btn-sm" onclick="renderAnimalModal(selectedAnimal)"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel</button></div>
        <form onsubmit="submitCallback(event)" style="margin-top:12px">
          <div style="margin-bottom:12px"><label class="label">Phone Number *</label><input class="input" required placeholder="Your phone number"></div>
          <div style="margin-bottom:12px"><label class="label">Preferred Time</label><select class="input select"><option>Morning (9am - 12pm)</option><option>Afternoon (12pm - 4pm)</option><option>Evening (4pm - 7pm)</option></select></div>
          <button type="submit" class="btn btn-primary w-full">Request Callback <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></button>
        </form>
      </div>`;
  }
}

function submitAdopt(e) {
  e.preventDefault();
  showToast('success', `Adoption request sent for ${selectedAnimal.name}! The shelter will contact you soon.`);
  closeAnimalModal();
}

function submitCallback(e) {
  e.preventDefault();
  showToast('success', 'Callback request sent! The shelter will call you shortly.');
  closeAnimalModal();
}

function closeAnimalModal(e) {
  if (e && e.target !== e.currentTarget) return;
  document.getElementById('animal-modal').style.display = 'none';
  document.body.style.overflow = '';
  selectedAnimal = null;
}

/* ===== REPORTS ===== */
async function loadReports() {
  allReports = await apiGet('reports.php');
  renderReportsList();
  const now = new Date().toISOString().slice(0, 16);
  const form = document.getElementById('report-form');
  if (form) { form.reset(); form.querySelector('[name="occurred_at"]').value = now; }
}

function renderReportsList(filter = '') {
  const filtered = filter ? allReports.filter(r => r.tracking_id.toLowerCase().includes(filter.toLowerCase())) : allReports;
  document.getElementById('reports-count').textContent = allReports.length;
  const container = document.getElementById('reports-list');
  if (filtered.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:48px 16px;color:var(--text-muted)"><p style="font-size:32px;margin-bottom:8px">📄</p><p style="font-weight:600;font-size:14px">No reports found</p><p style="font-size:13px">Reports will appear here once submitted.</p></div>';
    return;
  }
  const statusCfg = { pending: { label: 'Pending', cls: 'badge-neutral' }, assigned: { label: 'Assigned', cls: 'badge-info' }, in_progress: { label: 'In Progress', cls: 'badge-warning' }, completed: { label: 'Completed', cls: 'badge-success' } };
  container.innerHTML = filtered.map(r => {
    const cfg = statusCfg[r.status] || statusCfg.pending;
    return `
    <div class="report-item">
      <div class="flex-between" style="margin-bottom:8px">
        <button class="report-tracking" onclick="copyTrackingId('${r.tracking_id}', this)">${r.tracking_id} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
        <span class="badge ${cfg.cls}">${cfg.label}</span>
      </div>
      <div class="report-location"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${r.location}</div>
      <p class="report-meta">${r.animal_type} &middot; ${formatDate(r.occurred_at)}</p>
      ${r.description ? `<p class="report-desc">${r.description}</p>` : ''}
      <p class="report-time">${timeAgo(r.created_at)}</p>
    </div>`;
  }).join('');
}

function filterReports(val) { renderReportsList(val); }

function copyTrackingId(id, btn) {
  navigator.clipboard.writeText(id);
  btn.innerHTML = `${id} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--success-500)" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
  setTimeout(() => { btn.innerHTML = `${id} <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`; }, 2000);
}

async function submitReport(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  if (!data.location) { showToast('error', 'Please fill in the required fields'); return; }
  if (data.occurred_at) data.occurred_at = new Date(data.occurred_at).toISOString();
  data.status = 'pending';

  const btn = document.getElementById('report-submit-btn');
  btn.disabled = true; btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10"/></svg> Submitting...';

  const result = await apiPost('reports.php', data);
  if (result.error) {
    showToast('error', 'Failed to submit report. Please try again.');
  } else {
    allReports.unshift(result);
    renderReportsList();
    showToast('success', `Report submitted! Tracking ID: ${result.tracking_id}`);
    form.reset();
    form.querySelector('[name="occurred_at"]').value = new Date().toISOString().slice(0, 16);
    document.getElementById('report-image-preview').style.display = 'none';
  }
  btn.disabled = false; btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Submit Report';
}

/* ===== ALERTS ===== */
async function loadAlerts() {
  allAlerts = await apiGet('alerts.php');
  renderAlertsList();
  initSeverityGrid();
  initSafetyTips();
  const now = new Date().toISOString().slice(0, 16);
  const form = document.getElementById('alert-form');
  if (form) { form.reset(); form.querySelector('[name="sighted_at"]').value = now; }
}

function initSeverityGrid() {
  const levels = ['low', 'medium', 'high', 'critical'];
  document.getElementById('severity-grid').innerHTML = levels.map(s => {
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    return `<button type="button" class="chip chip-default severity-chip ${severitySelection === s ? 'chip-active' : ''}" onclick="selectSeverity('${s}')">${label}</button>`;
  }).join('');
}

function selectSeverity(s) {
  severitySelection = s;
  initSeverityGrid();
}

function renderAlertsList() {
  const sorted = [...allAlerts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.severity] || 0) - (order[b.severity] || 0);
  });
  document.getElementById('alerts-count').textContent = `${allAlerts.length} total`;

  const cfg = {
    low: { variant: 'badge-success', label: 'Low' },
    medium: { variant: 'badge-warning', label: 'Medium' },
    high: { variant: 'badge-danger', label: 'High' },
    critical: { variant: 'badge-danger', label: 'Critical' },
  };

  const container = document.getElementById('alerts-list');
  if (sorted.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:64px 16px;color:var(--text-muted)"><p style="font-size:36px;margin-bottom:12px">⚠️</p><p style="font-weight:600">No active alerts</p><p style="font-size:14px">The area is currently clear of wildlife alerts.</p></div>';
    return;
  }

  container.innerHTML = sorted.map(a => {
    const c = cfg[a.severity] || cfg.medium;
    return `
    <div class="alert-item">
      <div class="alert-card ${a.severity}">
        <div class="alert-header">
          <div class="alert-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--${a.severity === 'critical' || a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'success'}-600)" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            <div>
              <h3 class="alert-animal">${a.animal_type}</h3>
              <div class="alert-location"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${a.location}</div>
            </div>
          </div>
          <div class="alert-badges">
            <span class="badge ${c.variant}">${c.label}</span>
            ${a.verified
              ? '<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--success-600);font-weight:500"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Verified</span>'
              : '<span style="display:flex;align-items:center;gap:4px;font-size:11px;color:var(--text-muted);font-weight:500"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Unverified</span>'
            }
          </div>
        </div>
        ${a.description ? `<p class="alert-desc">${a.description}</p>` : ''}
        <div class="alert-footer">
          <span class="alert-time">Sighted ${formatDate(a.sighted_at)}</span>
          <span class="alert-time">${timeAgo(a.created_at)}</span>
        </div>
        <div class="alert-safety">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--secondary-500)" stroke-width="2" style="flex-shrink:0;margin-top:2px"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <p><strong>Safety:</strong> Avoid the area. Keep pets and children indoors. Do not approach.</p>
        </div>
      </div>
    </div>`;
  }).join('');
}

function initSafetyTips() {
  const tips = [
    { title: 'Stay Calm & Observe', text: 'Do not panic. Slowly back away while keeping eyes on the animal without direct eye contact.', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' },
    { title: 'Do Not Approach', text: 'Never approach or corner a wild animal. Maintain at least 100 feet of distance.', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' },
    { title: 'Make Yourself Big', text: 'For predators, raise your arms and speak firmly. Do not run — it triggers chase instinct.', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
    { title: 'Alert Authorities', text: 'Report sightings immediately so others in the area can be warned and kept safe.', icon: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z' },
  ];
  document.getElementById('safety-tips').innerHTML = tips.map(t => `
    <div class="safety-tip">
      <div class="safety-tip-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-600)" stroke-width="2"><path d="${t.icon}"/></svg></div>
      <div><p class="safety-tip-title">${t.title}</p><p class="safety-tip-text">${t.text}</p></div>
    </div>
  `).join('');
}

async function submitAlert(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  if (!data.animal_type || !data.location) { showToast('error', 'Please fill in the required fields'); return; }
  if (data.sighted_at) data.sighted_at = new Date(data.sighted_at).toISOString();
  data.severity = severitySelection;
  data.verified = false;

  const btn = document.getElementById('alert-submit-btn');
  btn.disabled = true; btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10"/></svg> Submitting...';

  const result = await apiPost('alerts.php', data);
  if (result.error) {
    showToast('error', 'Failed to submit alert');
  } else {
    allAlerts.unshift(result);
    renderAlertsList();
    showToast('success', 'Alert submitted! It will be reviewed by authorities before publishing.');
    form.reset();
    form.querySelector('[name="sighted_at"]').value = new Date().toISOString().slice(0, 16);
  }
  btn.disabled = false; btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Submit Alert';
}

/* ===== PROFILE ===== */
function loadProfile() {
  const favCount = favorites.size;
  document.getElementById('profile-stats').innerHTML = [
    { label: 'Adoption Requests', value: 3, color: 'var(--danger)', bg: 'var(--danger-50)', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
    { label: 'Reports Submitted', value: 7, color: 'var(--secondary)', bg: 'var(--secondary-50)', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
    { label: 'Alerts Shared', value: 2, color: 'var(--accent)', bg: 'var(--accent-50)', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
    { label: 'Favorites', value: favCount, color: 'var(--primary)', bg: 'var(--primary-50)', icon: 'circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="4" cy="8" r="2" /><path d="M12 22c-4.97 0-9-2.69-9-6v-2c0-3.31 4.03-6 9-6s9 2.69 9 6v2c0 3.31-4.03 6-9 6z' },
  ].map(s => `
    <div class="card stat-card">
      <div class="stat-icon" style="background:${s.bg}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${s.color}" stroke-width="2"><${s.icon}</svg></div>
      <div><p class="stat-value">${s.value}</p><p class="stat-label">${s.label}</p></div>
    </div>
  `).join('');

  const achievements = [
    { title: 'Animal Protector', desc: 'Adopted 1+ animal', earned: true, color: 'linear-gradient(135deg, var(--primary-400), var(--primary-600))', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { title: 'Active Volunteer', desc: 'Volunteered 10+ hours', earned: true, color: 'linear-gradient(135deg, var(--danger-400), var(--danger-600))', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
    { title: 'Top Reporter', desc: 'Submitted 5+ reports', earned: true, color: 'linear-gradient(135deg, var(--secondary-400), var(--secondary-600))', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
    { title: 'Community Helper', desc: 'Helped 20+ people', earned: false, color: 'linear-gradient(135deg, var(--accent-400), var(--accent-600))', icon: 'M12 15a7 7 0 100-14 7 7 0 000 14z' },
  ];
  document.getElementById('achievements-grid').innerHTML = achievements.map(a => `
    <div class="achievement-card ${a.earned ? 'earned' : 'locked'}">
      <div class="achievement-icon" style="background:${a.earned ? a.color : 'linear-gradient(135deg, #94a3b8, #64748b)'}"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><${a.icon}</svg></div>
      <p class="achievement-title">${a.title}</p>
      <p class="achievement-desc">${a.desc}</p>
      ${a.earned ? '<span class="badge badge-success" style="margin-top:8px"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg> Earned</span>' : ''}
    </div>
  `).join('');

  const settings = [
    { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email', enabled: true, icon: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z' },
    { key: 'sms', label: 'SMS Alerts', desc: 'Text messages for urgent alerts', enabled: true, icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
    { key: 'dark', label: 'Dark Mode', desc: 'Switch to dark theme', enabled: false, icon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z' },
    { key: 'location', label: 'Location Sharing', desc: 'Share location for nearby alerts', enabled: true, icon: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z' },
    { key: 'emergency', label: 'Emergency Notifications', desc: 'Critical wildlife alerts in your area', enabled: true, icon: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9' },
  ];
  document.getElementById('settings-list').innerHTML = settings.map(s => `
    <div class="setting-item">
      <div class="setting-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><path d="${s.icon}"/></svg></div>
      <div class="setting-info"><p class="setting-label">${s.label}</p><p class="setting-desc">${s.desc}</p></div>
      <button class="toggle ${s.enabled ? 'on' : 'off'}" onclick="toggleSetting(this)" role="switch" aria-checked="${s.enabled}">
        <span class="toggle-knob"></span>
      </button>
    </div>
  `).join('');

  const activities = [
    { title: 'Adoption request for Bella', detail: 'Greenfield Animal Shelter', time: '2 hours ago', color: 'var(--danger-50)', textColor: 'var(--danger-500)', icon: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z' },
    { title: 'Dead animal report submitted', detail: 'Tracking: DR-2024-004', time: '1 day ago', color: 'var(--secondary-50)', textColor: 'var(--secondary-500)', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
    { title: 'Wild animal alert shared', detail: 'Black Bear at Forest Ridge', time: '2 days ago', color: 'var(--accent-50)', textColor: 'var(--accent-500)', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z' },
    { title: 'Added Luna to favorites', detail: 'Whiskers Haven', time: '3 days ago', color: 'var(--primary-50)', textColor: 'var(--primary-500)', icon: 'circle cx="11" cy="4" r="2" /><circle cx="18" cy="8" r="2" /><circle cx="4" cy="8" r="2" /><path d="M12 22c-4.97 0-9-2.69-9-6v-2c0-3.31 4.03-6 9-6s9 2.69 9 6v2c0 3.31-4.03 6-9 6z' },
    { title: 'Profile updated', detail: 'Contact information changed', time: '1 week ago', color: 'var(--bg)', textColor: 'var(--text-muted)', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7' },
  ];
  document.getElementById('activity-timeline').innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-icon" style="background:${a.color}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${a.textColor}" stroke-width="2"><${a.icon}</svg></div>
      <div class="activity-content">
        <div class="activity-header">
          <div><p class="activity-title">${a.title}</p><p class="activity-detail">${a.detail}</p></div>
          <span class="activity-time"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${a.time}</span>
        </div>
      </div>
    </div>
  `).join('');
}

function toggleSetting(btn) {
  const isOn = btn.classList.contains('on');
  btn.classList.toggle('on', !isOn);
  btn.classList.toggle('off', isOn);
  btn.setAttribute('aria-checked', !isOn);
  showToast('info', 'Setting updated');
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  loadHome();
  loadProfile();
});
