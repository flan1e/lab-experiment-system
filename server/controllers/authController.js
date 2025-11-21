const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// const db = require('../config/db');
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    client_encoding: 'UTF8',
});

pool.connect((err, client, release) => {
    if (err) {
        console.error('Ошибка подключения к PostgreSQL:', err.message);
        console.error('Детали:', err);
    } else {
        console.log('Успешно подключено к PostgreSQL');
        client.query('SELECT NOW()', (err, res) => {
            if (err) {
                console.error('Ошибка выполнения запроса:', err.message);
            } else {pool
                console.log('Текущее время:', res.rows[0].now);
            }
            release();
        });
    }
});

exports.login = async (req, res) => {
    const { username, password } = req.body;
    // try {
        const result = await pool.query('SELECT user_id, username, password_hash, role FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ msg: 'Неверный логин или пароль' });

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Неверный логин или пароль' });

        const token = jwt.sign({ user: { id: user.user_id, role: user.role } }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ 
            token, 
            user: { 
                id: user.user_id, 
                username: user.username, 
                role: user.role 
            } 
        });
    // } catch (err) {
    //     res.status(500).json({ msg: 'Ошибка сервера (500)', error: err.message });
    // }
};