const API_URL = 'http://localhost:5000/api';

function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleSpan = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleSpan.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleSpan.textContent = '👁️';
    }
}

function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    errorEl.textContent = message;
    errorEl.classList.add('show');
}

function showAlert(type, message) {
    const alertEl = document.getElementById('alert');
    alertEl.className = `alert alert-${type} show`;
    alertEl.textContent = message;
    setTimeout(() => alertEl.classList.remove('show'), 5000);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    const submitBtn = document.getElementById('submitBtn');
    
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    
    let hasError = false;
    if (!email || !validateEmail(email)) {
        showError('emailError', 'Введите корректный email');
        hasError = true;
    }
    if (!password || password.length < 6) {
        showError('passwordError', 'Пароль должен быть не менее 6 символов');
        hasError = true;
    }
    if (hasError) return;
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Вход...';
    showAlert('info', 'Проверка данных...');
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            if (rememberMe) {
                localStorage.setItem('token', data.token);
            } else {
                sessionStorage.setItem('token', data.token);
            }
            localStorage.setItem('userName', data.user.name);
            showAlert('success', '✅ Успешный вход!');
            setTimeout(() => window.location.href = '/', 1000);
        } else {
            showAlert('error', '❌ ' + (data.error || 'Ошибка входа'));
            submitBtn.disabled = false;
            submitBtn.textContent = 'Войти';
        }
    } catch (error) {
        showAlert('error', '❌ Ошибка подключения к серверу');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Войти';
    }
}

async function register() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    
    document.querySelectorAll('.error-message').forEach(el => el.classList.remove('show'));
    
    let hasError = false;
    if (!name || name.length < 2) {
        showError('nameError', 'Имя должно содержать минимум 2 символа');
        hasError = true;
    }
    if (!email || !validateEmail(email)) {
        showError('emailError', 'Введите корректный email');
        hasError = true;
    }
    if (!password || password.length < 6) {
        showError('passwordError', 'Пароль должен быть не менее 6 символов');
        hasError = true;
    }
    if (hasError) return;
    
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Регистрация...';
    showAlert('info', 'Создание аккаунта...');
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('userName', data.user.name);
            showAlert('success', '✅ Регистрация успешна!');
            setTimeout(() => window.location.href = '/', 1000);
        } else {
            showAlert('error', '❌ ' + (data.error || 'Ошибка регистрации'));
            submitBtn.disabled = false;
            submitBtn.textContent = 'Зарегистрироваться';
        }
    } catch (error) {
        showAlert('error', '❌ Ошибка подключения к серверу');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Зарегистрироваться';
    }
}

function forgotPassword(event) {
    event.preventDefault();
    showAlert('info', '📧 Функция восстановления пароля будет доступна позже.');
}

// Проверка авторизации на страницах auth
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (token && window.location.pathname.includes('/auth/')) {
    window.location.href = '/';
}

// Вход по Enter
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (loginForm) loginForm.addEventListener('keypress', e => { if (e.key === 'Enter') login(); });
    if (registerForm) registerForm.addEventListener('keypress', e => { if (e.key === 'Enter') register(); });
});