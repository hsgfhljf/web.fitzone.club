const db = require('../db/index');
const bcrypt = require('bcrypt');

class UserModel {
    // Найти пользователя по email
    static async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    // Найти пользователя по ID
    static async findById(id) {
        const [rows] = await db.query(
            'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }

    // Создать нового пользователя
    static async create({ email, password, name }) {
        const passwordHash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            `INSERT INTO users (email, password_hash, name) 
             VALUES (?, ?, ?)`,
            [email, passwordHash, name]
        );
        
        return this.findById(result.insertId);
    }

    // Проверить пароль
    static async comparePassword(plainPassword, hash) {
        return bcrypt.compare(plainPassword, hash);
    }
}

module.exports = UserModel;