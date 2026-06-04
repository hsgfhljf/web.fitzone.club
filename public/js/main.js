const API_URL = 'http://localhost:5000/api';
let currentTrainingId = null;

// Получить токен
function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Проверка авторизации
function isAuthenticated() {
    return !!getToken();
}

// Выход
function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
}

// Обновить секцию авторизации в шапке
function updateAuthSection() {
    const authSection = document.getElementById('authSection');
    const token = getToken();
    const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName');
    
    if (token && userName) {
        authSection.innerHTML = `
            <div class="user-info">
                <div class="avatar">${userName.charAt(0).toUpperCase()}</div>
                <span class="user-name">${escapeHtml(userName)}</span>
                <button class="btn-logout" onclick="logout()">Выйти</button>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <div class="auth-buttons">
                <a href="/auth/login.html" class="btn-login">Войти</a>
                <a href="/auth/register.html" class="btn-login" style="background:#27ae60">Регистрация</a>
            </div>
        `;
    }
}

// Загрузка тренировок
async function loadTrainings() {
    const container = document.getElementById('trainingsContainer');
    
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Загрузка тренировок...</p>
        </div>
    `;
    
    try {
        const response = await fetch(`${API_URL}/trainings`);
        
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        const data = await response.json();
        const trainings = data.trainings || [];
        
        if (trainings.length === 0) {
            container.innerHTML = `
                <div class="empty">
                    <p>📭 Пока нет доступных тренировок</p>
                    <p>Загляните позже!</p>
                </div>
            `;
        } else {
            renderTrainings(trainings);
        }
    } catch (error) {
        container.innerHTML = `
            <div class="error">
                <p>❌ Не удалось загрузить тренировки</p>
                <button onclick="loadTrainings()">Повторить</button>
            </div>
        `;
    }
}

// Отображение карточек
function renderTrainings(trainings) {
    const container = document.getElementById('trainingsContainer');
    
    container.innerHTML = `
        <div class="trainings-grid">
            ${trainings.map(training => `
                <div class="training-card" onclick="viewTraining(${training.id})">
                    <div class="card-image">${getTypeIcon(training.type)}</div>
                    <div class="card-content">
                        <span class="card-type">${getTypeName(training.type)}</span>
                        <div class="card-title">${escapeHtml(training.title)}</div>
                        <div class="card-details">
                            <div>⏰ ${formatDateTime(training.date_time)}</div>
                            <div>👨‍🏫 ${escapeHtml(training.trainer_name || 'Тренер не назначен')}</div>
                            <div>⏱️ ${training.duration_minutes || 60} мин</div>
                        </div>
                        <div class="card-price">${training.price || 0} $</div>
                        <div class="card-seats ${training.available_seats <= 3 ? 'low' : ''}">
                            🪑 Свободно мест: ${training.available_seats} / ${training.max_seats}
                        </div>
                        <button class="btn-book" onclick="event.stopPropagation(); openBookingModal(${training.id}, '${escapeHtml(training.title)}')" 
                            ${training.available_seats <= 0 ? 'disabled' : ''}>
                            ${training.available_seats <= 0 ? '❌ Нет мест' : '📝 Записаться'}
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function getTypeIcon(type) {
    const icons = { 'yoga': '🧘', 'crossfit': '🏋️', 'aerobic': '💃', 'gym': '🏃' };
    return icons[type] || '🏋️‍♂️';
}

function getTypeName(type) {
    const names = { 'yoga': 'Йога', 'crossfit': 'Кроссфит', 'aerobic': 'Аэробика', 'gym': 'Тренажёрный зал' };
    return names[type] || type;
}

function formatDateTime(dateTime) {
    if (!dateTime) return 'Дата не указана';
    const date = new Date(dateTime);
    return date.toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function viewTraining(id) {
    window.location.href = `/training.html?id=${id}`;
}

function openBookingModal(trainingId, title) {
    if (!isAuthenticated()) {
        sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
        window.location.href = '/auth/login.html';
        return;
    }
    
    currentTrainingId = trainingId;
    document.getElementById('modalTrainingTitle').innerHTML = `<strong>${title}</strong>`;
    document.getElementById('bookingModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('bookingModal').style.display = 'none';
    currentTrainingId = null;
}

async function confirmBooking() {
    if (!currentTrainingId) return;
    
    const token = getToken();
    if (!token) {
        window.location.href = '/auth/login.html';
        return;
    }
    
    closeModal();
    showNotification('⏳ Отправка запроса...', 'info');
    
    // TODO: когда будет готов эндпоинт /api/bookings
    showNotification('✅ Запись на тренировку временно недоступна. Функция в разработке.', 'warning');
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db';
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${bgColor};
        color: white;
        border-radius: 10px;
        z-index: 1001;
        animation: fadeIn 0.3s ease;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    updateAuthSection();
    loadTrainings();
});

window.onclick = function(event) {
    const modal = document.getElementById('bookingModal');
    if (event.target === modal) closeModal();
}