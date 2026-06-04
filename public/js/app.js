const API_URL = 'http://localhost:5000/api';
const STORAGE_KEYS = {
    TOKEN: 'fitzone_token',
    USER: 'fitzone_user',
    FAVORITES: 'fitzone_favorites'
};

// ========== Утилиты ==========
function getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

function setToken(token) {
    if (token) localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    else localStorage.removeItem(STORAGE_KEYS.TOKEN);
}

function getUser() {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
}

function setUser(user) {
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.USER);
}

function isAuthenticated() {
    return !!getToken();
}

function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    navigateTo('home');
    updateAuthUI();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function formatDateTime(dateTime) {
    if (!dateTime) return 'Дата не указана';
    const date = new Date(dateTime);
    return date.toLocaleString('ru-RU', {
        day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
    });
}

function getTypeIcon(type) {
    const icons = { 'yoga': '🧘', 'crossfit': '🏋️', 'aerobic': '💃', 'gym': '🏃' };
    return icons[type] || '🏋️‍♂️';
}

function getTypeName(type) {
    const names = { 'yoga': 'Йога', 'crossfit': 'Кроссфит', 'aerobic': 'Аэробика', 'gym': 'Тренажёрный зал' };
    return names[type] || type;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db';
    notification.style.cssText = `
        position: fixed; bottom: 20px; right: 20px; padding: 15px 25px;
        background: ${bgColor}; color: white; border-radius: 10px;
        z-index: 1001; animation: fadeIn 0.3s ease; box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function showSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Загрузка данных...</p></div>';
    }
}

function hideSpinner(containerId, content) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = content;
    }
}

// ========== Избранное ==========
function getFavorites() {
    const fav = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    return fav ? JSON.parse(fav) : [];
}

function saveFavorites(favorites) {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
}

function addToFavorites(trainingId) {
    const favorites = getFavorites();
    if (!favorites.includes(trainingId)) {
        favorites.push(trainingId);
        saveFavorites(favorites);
        showNotification('Добавлено в избранное ❤️', 'success');
    }
}

function removeFromFavorites(trainingId) {
    let favorites = getFavorites();
    favorites = favorites.filter(id => id !== trainingId);
    saveFavorites(favorites);
    showNotification('Удалено из избранного 💔', 'info');
}

function isFavorite(trainingId) {
    return getFavorites().includes(trainingId);
}

function toggleFavorite(trainingId) {
    if (!isAuthenticated()) {
        showNotification('Войдите, чтобы добавить в избранное', 'error');
        return;
    }
    if (isFavorite(trainingId)) removeFromFavorites(trainingId);
    else addToFavorites(trainingId);
    
    // Обновляем текущую страницу
    const currentPage = document.querySelector('.nav a.active')?.dataset.page || 'home';
    loadPage(currentPage);
}

// ========== UI компоненты ==========
function updateAuthUI() {
    const authSection = document.getElementById('authSection');
    const user = getUser();
    
    if (isAuthenticated() && user) {
        authSection.innerHTML = `
            <div class="user-info">
                <div class="avatar">${user.name?.charAt(0).toUpperCase() || 'U'}</div>
                <span class="user-name">${escapeHtml(user.name)}</span>
                <button class="btn-logout" onclick="logout()">Выйти</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <div class="auth-buttons">
                <button class="btn-login" onclick="showAuthModal('login')">Войти</button>
                <button class="btn-login" onclick="showAuthModal('register')" style="background:#27ae60">Регистрация</button>
            </div>
        `;
    }
}

// ========== Модальное окно авторизации ==========
function showAuthModal(mode) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <h2>${mode === 'login' ? 'Вход' : 'Регистрация'}</h2>
            <div id="authAlert" class="alert"></div>
            ${mode === 'register' ? `<input type="text" id="regName" placeholder="Имя" class="auth-input">` : ''}
            <input type="email" id="authEmail" placeholder="Email" class="auth-input">
            <input type="password" id="authPassword" placeholder="Пароль" class="auth-input">
            <button class="btn-submit" onclick="submitAuth('${mode}')">${mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</button>
            <button class="btn-cancel" onclick="this.closest('.modal').remove()">Закрыть</button>
        </div>
    `;
    document.body.appendChild(modal);
}

async function submitAuth(mode) {
    const email = document.getElementById('authEmail')?.value;
    const password = document.getElementById('authPassword')?.value;
    const name = document.getElementById('regName')?.value;
    const alertDiv = document.getElementById('authAlert');
    
    if (!email || !password) {
        alertDiv.innerHTML = 'Заполните все поля';
        alertDiv.className = 'alert alert-error show';
        return;
    }
    
    if (mode === 'register' && (!name || name.length < 2)) {
        alertDiv.innerHTML = 'Имя должно содержать минимум 2 символа';
        alertDiv.className = 'alert alert-error show';
        return;
    }
    
    try {
        const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
        const body = mode === 'login' ? { email, password } : { email, password, name };
        
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            setToken(data.token);
            setUser(data.user);
            document.querySelector('.modal')?.remove();
            updateAuthUI();
            navigateTo('home');
            showNotification(mode === 'login' ? 'Добро пожаловать!' : 'Регистрация успешна!', 'success');
        } else {
            alertDiv.innerHTML = data.error || data.errors?.join(', ') || 'Ошибка';
            alertDiv.className = 'alert alert-error show';
        }
    } catch (error) {
        alertDiv.innerHTML = 'Ошибка подключения к серверу';
        alertDiv.className = 'alert alert-error show';
    }
}

// ========== Страницы ==========
async function loadPage(page) {
    const content = document.getElementById('pageContent');
    
    const pages = {
        home: () => renderHome(),
        schedule: () => renderSchedule(),
        favorites: () => renderFavorites(),
        profile: () => renderProfile()
    };
    
    if (pages[page]) await pages[page]();
    else await renderHome();
}

async function renderHome() {
    const container = document.getElementById('pageContent');
    container.innerHTML = `
        <div class="hero">
            <h1>Стань сильнее с FitZone</h1>
            <p>Профессиональные тренировки, лучшие тренеры и современное оборудование</p>
        </div>
        <div class="container">
            <h2 class="section-title">🔥 Популярные тренировки</h2>
            <div id="trainingsGrid" class="trainings-grid">
                <div class="loading"><div class="spinner"></div><p>Загрузка тренировок...</p></div>
            </div>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/trainings`);
        const data = await response.json();
        const trainings = data.trainings || [];
        const grid = document.getElementById('trainingsGrid');
        if (trainings.length === 0) {
            grid.innerHTML = '<div class="empty">📭 Нет доступных тренировок</div>';
        } else {
            grid.innerHTML = renderTrainingsGrid(trainings.slice(0, 6));
        }
    } catch (error) {
        document.getElementById('trainingsGrid').innerHTML = '<div class="error">❌ Ошибка загрузки. <button onclick="renderHome()">Повторить</button></div>';
    }
}

function renderTrainingsGrid(trainings) {
    return trainings.map(t => `
        <div class="training-card" onclick="viewTraining(${t.id})">
            <div class="card-image">${getTypeIcon(t.type)}</div>
            <div class="card-content">
                <div style="display: flex; justify-content: space-between;">
                    <span class="card-type">${getTypeName(t.type)}</span>
                    <button class="favorite-btn ${isFavorite(t.id) ? 'active' : ''}" 
                        onclick="event.stopPropagation(); toggleFavorite(${t.id})">
                        ${isFavorite(t.id) ? '❤️' : '🤍'}
                    </button>
                </div>
                <div class="card-title">${escapeHtml(t.title)}</div>
                <div class="card-details">⏰ ${formatDateTime(t.date_time)}</div>
                <div class="card-price">${t.price || 0} $</div>
                <button class="btn-book" onclick="event.stopPropagation(); viewTraining(${t.id})">Подробнее</button>
            </div>
        </div>
    `).join('');
}

async function renderSchedule() {
    const container = document.getElementById('pageContent');
    container.innerHTML = `
        <div class="container">
            <h1 class="section-title">📅 Расписание тренировок</h1>
            <div class="filters">
                <input type="text" id="searchInput" placeholder="🔍 Поиск..." class="filter-input">
                <select id="typeFilter" class="filter-select">
                    <option value="">Все типы</option>
                    <option value="yoga">Йога</option>
                    <option value="crossfit">Кроссфит</option>
                    <option value="aerobic">Аэробика</option>
                    <option value="gym">Тренажёрный зал</option>
                </select>
                <input type="date" id="dateFilter" class="filter-input">
                <button class="btn-filter" onclick="applyScheduleFilters()">Применить</button>
                <button class="btn-filter-reset" onclick="resetScheduleFilters()">Сбросить</button>
            </div>
            <div id="scheduleGrid" class="trainings-grid">
                <div class="loading"><div class="spinner"></div><p>Загрузка расписания...</p></div>
            </div>
        </div>
    `;
    
    await loadScheduleData();
}

let scheduleTrainings = [];

async function loadScheduleData() {
    try {
        const response = await fetch(`${API_URL}/trainings`);
        const data = await response.json();
        scheduleTrainings = data.trainings || [];
        applyScheduleFilters();
    } catch (error) {
        document.getElementById('scheduleGrid').innerHTML = '<div class="error">❌ Ошибка загрузки. <button onclick="loadScheduleData()">Повторить</button></div>';
    }
}

function applyScheduleFilters() {
    const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const type = document.getElementById('typeFilter')?.value || '';
    const date = document.getElementById('dateFilter')?.value || '';
    
    let filtered = [...scheduleTrainings];
    if (search) filtered = filtered.filter(t => t.title.toLowerCase().includes(search));
    if (type) filtered = filtered.filter(t => t.type === type);
    if (date) filtered = filtered.filter(t => t.date_time?.startsWith(date));
    
    const grid = document.getElementById('scheduleGrid');
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty">📭 Нет тренировок по выбранным фильтрам</div>';
    } else {
        grid.innerHTML = renderScheduleGrid(filtered);
    }
}

function resetScheduleFilters() {
    if (document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
    if (document.getElementById('typeFilter')) document.getElementById('typeFilter').value = '';
    if (document.getElementById('dateFilter')) document.getElementById('dateFilter').value = '';
    applyScheduleFilters();
}

function renderScheduleGrid(trainings) {
    return trainings.map(t => `
        <div class="training-card" onclick="viewTraining(${t.id})">
            <div class="card-image">${getTypeIcon(t.type)}</div>
            <div class="card-content">
                <div style="display: flex; justify-content: space-between;">
                    <span class="card-type">${getTypeName(t.type)}</span>
                    <button class="favorite-btn ${isFavorite(t.id) ? 'active' : ''}" 
                        onclick="event.stopPropagation(); toggleFavorite(${t.id})">
                        ${isFavorite(t.id) ? '❤️' : '🤍'}
                    </button>
                </div>
                <div class="card-title">${escapeHtml(t.title)}</div>
                <div class="card-details">⏰ ${formatDateTime(t.date_time)}</div>
                <div class="card-price">${t.price || 0} $</div>
                <div class="card-seats ${t.available_seats <= 3 ? 'low' : ''}">🪑 Свободно: ${t.available_seats}/${t.max_seats}</div>
                <button class="btn-book" onclick="event.stopPropagation(); viewTraining(${t.id})">Подробнее</button>
            </div>
        </div>
    `).join('');
}

async function renderFavorites() {
    const container = document.getElementById('pageContent');
    container.innerHTML = `
        <div class="container">
            <h1 class="section-title">❤️ Избранные тренировки</h1>
            <div id="favoritesGrid" class="trainings-grid">
                <div class="loading"><div class="spinner"></div><p>Загрузка избранного...</p></div>
            </div>
        </div>
    `;
    
    if (!isAuthenticated()) {
        document.getElementById('favoritesGrid').innerHTML = `
            <div class="empty">🔒 Войдите, чтобы видеть избранное<br>
            <button class="btn-login" onclick="showAuthModal('login')" style="margin-top:15px">Войти</button></div>
        `;
        return;
    }
    
    const favoritesIds = getFavorites();
    if (favoritesIds.length === 0) {
        document.getElementById('favoritesGrid').innerHTML = '<div class="empty">💔 У вас пока нет избранных тренировок</div>';
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/trainings`);
        const data = await response.json();
        const allTrainings = data.trainings || [];
        const favoritesTrainings = allTrainings.filter(t => favoritesIds.includes(t.id));
        const grid = document.getElementById('favoritesGrid');
        if (favoritesTrainings.length === 0) {
            grid.innerHTML = '<div class="empty">💔 Избранные тренировки не найдены</div>';
        } else {
            grid.innerHTML = renderScheduleGrid(favoritesTrainings);
        }
    } catch (error) {
        document.getElementById('favoritesGrid').innerHTML = '<div class="error">❌ Ошибка загрузки</div>';
    }
}

async function renderProfile() {
    const container = document.getElementById('pageContent');
    
    if (!isAuthenticated()) {
        container.innerHTML = `
            <div class="container" style="text-align:center; padding:60px">
                <h2>🔒 Доступ ограничен</h2>
                <p>Войдите, чтобы просмотреть профиль</p>
                <button class="btn-login" onclick="showAuthModal('login')" style="margin-top:15px">Войти</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="container">
            <div id="profileContent" class="profile-card" style="text-align:center">
                <div class="loading"><div class="spinner"></div><p>Загрузка профиля...</p></div>
            </div>
        </div>
    `;
    
    try {
        const token = getToken();
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.status === 401) {
            logout();
            renderProfile();
            return;
        }
        
        const data = await response.json();
        const user = data.user;
        
        document.getElementById('profileContent').innerHTML = `
            <div class="profile-header">
                <div class="avatar-large">${user.name?.charAt(0).toUpperCase() || 'U'}</div>
                <h2>${escapeHtml(user.name)}</h2>
                <p>${escapeHtml(user.email)}</p>
            </div>
            <div class="profile-info">
                <div class="info-row"><span>🆔 ID:</span><span>${user.id}</span></div>
                <div class="info-row"><span>👤 Роль:</span><span>${user.role === 'admin' ? 'Администратор' : 'Пользователь'}</span></div>
                <div class="info-row"><span>📅 Регистрация:</span><span>${new Date(user.created_at).toLocaleDateString()}</span></div>
            </div>
            <button class="btn-logout" onclick="logout()" style="width:100%">Выйти из аккаунта</button>
        `;
    } catch (error) {
        document.getElementById('profileContent').innerHTML = '<div class="error">❌ Ошибка загрузки профиля</div>';
    }
}

function viewTraining(id) {
    navigateTo('training', id);
}

async function renderTraining(id) {
    const container = document.getElementById('pageContent');
    container.innerHTML = `
        <div class="container">
            <div id="trainingContent" style="max-width:600px; margin:0 auto">
                <div class="loading"><div class="spinner"></div><p>Загрузка тренировки...</p></div>
            </div>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/trainings/${id}`);
        const data = await response.json();
        const t = data.training;
        
        document.getElementById('trainingContent').innerHTML = `
            <button class="btn-back" onclick="navigateTo('schedule')">← Назад к расписанию</button>
            <div class="detail-card">
                <div class="detail-icon">${getTypeIcon(t.type)}</div>
                <h1>${escapeHtml(t.title)}</h1>
                <div class="detail-type">${getTypeName(t.type)}</div>
                <div class="detail-info">
                    <div><strong>📅 Дата и время:</strong> ${formatDateTime(t.date_time)}</div>
                    <div><strong>⏱️ Длительность:</strong> ${t.duration_minutes || 60} мин</div>
                    <div><strong>👨‍🏫 Тренер:</strong> ${escapeHtml(t.trainer_name) || 'Не назначен'}</div>
                    <div><strong>🪑 Места:</strong> ${t.available_seats} / ${t.max_seats}</div>
                    <div><strong>📝 Описание:</strong> ${escapeHtml(t.description) || 'Описание отсутствует'}</div>
                </div>
                <div class="detail-price">${t.price || 0} $</div>
                <button class="btn-book" onclick="showNotification('Запись временно недоступна', 'info')">
                    📝 Записаться на тренировку
                </button>
                <button class="favorite-btn-large ${isFavorite(t.id) ? 'active' : ''}" 
                    onclick="toggleFavorite(${t.id})">
                    ${isFavorite(t.id) ? '❤️ В избранном' : '🤍 В избранное'}
                </button>
            </div>
        `;
    } catch (error) {
        document.getElementById('trainingContent').innerHTML = '<div class="error">❌ Тренировка не найдена</div>';
    }
}

// ========== Навигация ==========
function navigateTo(page, param = null) {
    history.pushState({ page, param }, '', `/${page}${param ? `?id=${param}` : ''}`);
    loadPageContent(page, param);
    
    document.querySelectorAll('.nav a').forEach(link => {
        if (link.dataset.page === page) link.classList.add('active');
        else link.classList.remove('active');
    });
}

async function loadPageContent(page, param = null) {
    const pages = ['home', 'schedule', 'favorites', 'profile', 'training'];
    if (!pages.includes(page)) page = 'home';
    
    if (page === 'training' && param) await renderTraining(param);
    else if (page === 'home') await renderHome();
    else if (page === 'schedule') await renderSchedule();
    else if (page === 'favorites') await renderFavorites();
    else if (page === 'profile') await renderProfile();
}

function handleRoute() {
    const path = window.location.pathname;
    if (path === '/' || path === '/home') navigateTo('home');
    else if (path === '/schedule') navigateTo('schedule');
    else if (path === '/favorites') navigateTo('favorites');
    else if (path === '/profile') navigateTo('profile');
    else if (path.startsWith('/training')) {
        const id = new URLSearchParams(window.location.search).get('id');
        navigateTo('training', id);
    }
    else navigateTo('home');
}

// ========== Инициализация ==========
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    handleRoute();
    
    document.querySelectorAll('.nav a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.dataset.page);
        });
    });
});

window.onpopstate = () => handleRoute();

// Глобальные функции
window.logout = logout;
window.showAuthModal = showAuthModal;
window.submitAuth = submitAuth;
window.toggleFavorite = toggleFavorite;
window.viewTraining = viewTraining;
window.navigateTo = navigateTo;
window.applyScheduleFilters = applyScheduleFilters;
window.resetScheduleFilters = resetScheduleFilters;
window.renderHome = renderHome;
window.loadScheduleData = loadScheduleData;