// Валидация email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Валидация пароля (мин 6 символов)
function isValidPassword(password) {
    return password && password.length >= 6;
}

// Валидация имени (не пустое, минимум 2 буквы)
function isValidName(name) {
    return name && name.trim().length >= 2;
}

// Валидация регистрации
function validateRegister(data) {
    const errors = [];
    
    if (!isValidEmail(data.email)) {
        errors.push('Некорректный email');
    }
    if (!isValidPassword(data.password)) {
        errors.push('Пароль должен быть не менее 6 символов');
    }
    if (!isValidName(data.name)) {
        errors.push('Имя должно содержать минимум 2 символа');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// Валидация логина
function validateLogin(data) {
    const errors = [];
    
    if (!isValidEmail(data.email)) {
        errors.push('Некорректный email');
    }
    if (!data.password || data.password.length === 0) {
        errors.push('Пароль обязателен');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateRegister,
    validateLogin
};