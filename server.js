require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const authRoutes = require('./routes/auth');
const trainingsRoutes = require('./routes/trainings');
const bookingsRoutes = require('./routes/bookings');

app.use('/api/auth', authRoutes);
app.use('/api/trainings', trainingsRoutes);
app.use('/api/bookings', bookingsRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Все не-API маршруты отдаём index.html (для SPA)
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});

// Обработка 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// ТОЛЬКО ОДНО ОБЪЯВЛЕНИЕ PORT (удали другие, если есть)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Сервер запущен на порту ${PORT}`);
});