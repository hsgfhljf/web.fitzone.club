const mysql = require('mysql2');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
    // Продакшен на Render
    pool = mysql.createPool({
        connectionString: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
} else {
    // Локальная разработка (XAMPP)
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'fitzone_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

const promisePool = pool.promise();
module.exports = promisePool;