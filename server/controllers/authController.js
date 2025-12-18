const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
    const username = (req.body.username || '').trim();
    const password = (req.body.password || '').trim();
    
    try {
        const result = await db.query('SELECT user_id, username, password_hash, role, is_active FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) return res.status(400).json({ msg: 'Неверный логин или пароль' });

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ msg: 'Пользователь деактивирован' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ msg: 'Неверный логин или пароль' });

        const token = jwt.sign(
            { user: { id: user.user_id, username: user.username,role: user.role } }, process.env.JWT_SECRET, { expiresIn: '1h' }
        );
        res.json({ 
            token, 
            user: { 
                id: user.user_id, 
                username: user.username, 
                role: user.role 
            } 
        });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера (500)', error: err.message });
    }
};