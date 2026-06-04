const db = require('../db/index');

// Получить все бронирования текущего пользователя
async function getUserBookings(req, res) {
    try {
        const userId = req.user.id;
        const [rows] = await db.query(`
            SELECT b.*, t.title, t.date_time, t.duration_minutes, t.price, t.type 
            FROM bookings b
            JOIN trainings t ON b.training_id = t.id
            WHERE b.user_id = ? AND b.status = 'confirmed'
            ORDER BY t.date_time ASC
        `, [userId]);
        res.json({ bookings: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения бронирований' });
    }
}

// Создать бронирование
async function createBooking(req, res) {
    try {
        const userId = req.user.id;
        const { trainingId } = req.body;
        
        if (!trainingId) {
            return res.status(400).json({ error: 'ID тренировки обязателен' });
        }
        
        // Проверяем существование тренировки и свободные места
        const [training] = await db.query(
            'SELECT * FROM trainings WHERE id = ?',
            [trainingId]
        );
        
        if (training.length === 0) {
            return res.status(404).json({ error: 'Тренировка не найдена' });
        }
        
        const trainingData = training[0];
        if (trainingData.available_seats <= 0) {
            return res.status(400).json({ error: 'Нет свободных мест на эту тренировку' });
        }
        
        // Проверяем, не забронировал ли пользователь уже эту тренировку
        const [existing] = await db.query(
            'SELECT * FROM bookings WHERE user_id = ? AND training_id = ? AND status = "confirmed"',
            [userId, trainingId]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Вы уже записаны на эту тренировку' });
        }
        
        // Создаём бронирование
        await db.query(
            'INSERT INTO bookings (user_id, training_id) VALUES (?, ?)',
            [userId, trainingId]
        );
        
        // Уменьшаем количество свободных мест
        await db.query(
            'UPDATE trainings SET available_seats = available_seats - 1 WHERE id = ?',
            [trainingId]
        );
        
        res.status(201).json({ message: 'Вы успешно записаны на тренировку!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка создания бронирования' });
    }
}

// Отменить бронирование
async function cancelBooking(req, res) {
    try {
        const userId = req.user.id;
        const { bookingId } = req.params;
        
        const [booking] = await db.query(
            'SELECT * FROM bookings WHERE id = ? AND user_id = ? AND status = "confirmed"',
            [bookingId, userId]
        );
        
        if (booking.length === 0) {
            return res.status(404).json({ error: 'Бронирование не найдено' });
        }
        
        // Обновляем статус бронирования
        await db.query(
            'UPDATE bookings SET status = "cancelled" WHERE id = ?',
            [bookingId]
        );
        
        // Возвращаем место
        await db.query(
            'UPDATE trainings SET available_seats = available_seats + 1 WHERE id = ?',
            [booking[0].training_id]
        );
        
        res.json({ message: 'Запись отменена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка отмены бронирования' });
    }
}

module.exports = { getUserBookings, createBooking, cancelBooking };