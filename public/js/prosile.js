const API_URL = 'http://localhost:5000/api';

function getToken() {
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

async function checkProfile() {
    const token = getToken();
    
    if (!token) {
        window.location.href = '/auth/login.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
            window.location.href = '/auth/login.html';
            return;
        }

        const data = await response.json();
        
        if (data.user) {
            document.getElementById('content').innerHTML = `
                <div class="success">✅ Вы авторизованы!</div>
                <div class="info">
                    <strong>ID:</strong> ${data.user.id}<br>
                    <strong>Имя:</strong> ${data.user.name}<br>
                    <strong>Email:</strong> ${data.user.email}<br>
                    <strong>Роль:</strong> ${data.user.role}<br>
                    <strong>Зарегистрирован:</strong> ${new Date(data.user.created_at).toLocaleString()}
                </div>
            `;
        } else {
            document.getElementById('content').innerHTML = `<div class="error">❌ ${data.error || 'Ошибка загрузки профиля'}</div>`;
        }
    } catch (error) {
        document.getElementById('content').innerHTML = `<div class="error">❌ Ошибка: ${error.message}</div>`;
    }
}

function logout() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
}

// Защита от зацикливания — проверяем, что мы не на странице auth
if (!getToken()) {
    window.location.href = '/auth/login.html';
} else {
    checkProfile();
}