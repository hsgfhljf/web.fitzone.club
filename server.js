require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Раздача статических файлов (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Подключение роутов
const authRoutes = require('./routes/auth');

app.use('/api/auth', authRoutes);

// Проверка работы API
app.get('/', (req, res) => {
    res.json({ message: 'FitZone API работает!' });
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`📱 Страница входа: http://localhost:5000/auth/login.html`);
    console.log(`📱 Профиль: http://localhost:5000/profile.html`);
});