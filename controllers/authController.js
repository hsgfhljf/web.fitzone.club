const UserModel = require('../models/UserModel');
const jwt = require('jsonwebtoken');
const { validateRegister, validateLogin } = require('../utils/validation');

// Генерация JWT токена
function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Регистрация
async function register(req, res) {
    try {
        const { email, password, name } = req.body;
        
        // Валидация
        const validation = validateRegister({ email, password, name });
        if (!validation.isValid) {
            return res.status(400).json({ errors: validation.errors });
        }
        
        // Проверка, существует ли пользователь
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }
        
        // Создание пользователя
        const user = await UserModel.create({ email, password, name });
        
        // Генерация токена
        const token = generateToken(user);
        
        res.status(201).json({
            message: 'Регистрация успешна',
            token,
            user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
}

// Вход
async function login(req, res) {
    try {
        const { email, password } = req.body;
        
        // Валидация
        const validation = validateLogin({ email, password });
        if (!validation.isValid) {
            return res.status(400).json({ errors: validation.errors });
        }
        
        // Поиск пользователя
        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        // Проверка пароля
        const isPasswordValid = await UserModel.comparePassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        // Генерация токена
        const token = generateToken(user);
        
        // Возвращаем данные без password_hash
        const { password_hash, ...userData } = user;
        
        res.json({
            message: 'Вход выполнен успешно',
            token,
            user: userData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
}

// Получить текущего пользователя (по токену)
async function getMe(req, res) {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Токен не предоставлен' });
        }
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await UserModel.findById(decoded.id);
        
        if (!user) {
            return res.status(404).json({ error: 'Пользователь не найден' });
        }
        
        res.json({ user });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Неверный токен' });
        }
        res.status(500).json({ error: 'Ошибка сервера' });
    }
}

module.exports = { register, login, getMe };