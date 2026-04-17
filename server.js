require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Простая проверка БД
const db = require('./db/index');

app.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1+1 as result');
        res.json({ 
            message: 'FitZone API работает!',
            db: '✅ подключена',
            test: rows[0].result
        });
    } catch (err) {
        res.json({ 
            message: 'FitZone API работает!',
            db: '❌ ошибка: ' + err.message
        });
    }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
    console.log(`Проверь БД по адресу: http://localhost:${PORT}`);
});