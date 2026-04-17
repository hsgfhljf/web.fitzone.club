const db = require('../db/index');

// Получить все тренировки (публичный)
async function getAllTrainings(req, res) {
    try {
        const [rows] = await db.query(`
            SELECT * FROM trainings
            ORDER BY date_time ASC
        `);
        res.json({ trainings: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения тренировок' });
    }
}

// Получить одну тренировку по ID (публичный)
async function getTrainingById(req, res) {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`SELECT * FROM trainings WHERE id = ?`, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Тренировка не найдена' });
        }
        
        res.json({ training: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка получения тренировки' });
    }
}

// Создать тренировку (только авторизованные)
async function createTraining(req, res) {
    try {
        const { title, description, type, trainer_id, date_time, duration_minutes, max_seats, price } = req.body;
        
        if (!title || !date_time || !max_seats) {
            return res.status(400).json({ error: 'Название, дата/время и количество мест обязательны' });
        }
        
        const [result] = await db.query(`
            INSERT INTO trainings (title, description, type, trainer_id, date_time, duration_minutes, max_seats, available_seats, price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [title, description, type, trainer_id, date_time, duration_minutes, max_seats, max_seats, price || 0]);
        
        const [newTraining] = await db.query(`SELECT * FROM trainings WHERE id = ?`, [result.insertId]);
        
        res.status(201).json({ 
            message: 'Тренировка создана успешно',
            training: newTraining[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка создания тренировки' });
    }
}

// Обновить тренировку (только авторизованные)
async function updateTraining(req, res) {
    try {
        const { id } = req.params;
        const { title, description, type, trainer_id, date_time, duration_minutes, max_seats, price } = req.body;
        
        const [existing] = await db.query(`SELECT * FROM trainings WHERE id = ?`, [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Тренировка не найдена' });
        }
        
        await db.query(`
            UPDATE trainings 
            SET title = ?, description = ?, type = ?, trainer_id = ?, date_time = ?, 
                duration_minutes = ?, max_seats = ?, price = ?
            WHERE id = ?
        `, [title, description, type, trainer_id, date_time, duration_minutes, max_seats, price, id]);
        
        res.json({ message: 'Тренировка обновлена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка обновления тренировки' });
    }
}

// Удалить тренировку (только авторизованные)
async function deleteTraining(req, res) {
    try {
        const { id } = req.params;
        
        const [existing] = await db.query(`SELECT * FROM trainings WHERE id = ?`, [id]);
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Тренировка не найдена' });
        }
        
        await db.query(`DELETE FROM trainings WHERE id = ?`, [id]);
        
        res.json({ message: 'Тренировка удалена' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Ошибка удаления тренировки' });
    }
}

// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
module.exports = {
    getAllTrainings,
    getTrainingById,
    createTraining,
    updateTraining,
    deleteTraining
};