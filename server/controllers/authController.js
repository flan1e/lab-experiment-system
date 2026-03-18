const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.login = async (req, res) => {
    const username = (req.body.username || '').trim();
    const password = (req.body.password || '').trim();

    try {
        const result = await db.query(`
            SELECT 
                u.user_id,
                u.username,
                u.password_hash,
                u.last_name,
                u.first_name,
                u.middle_name,
                r.role_name,  
                u.is_active
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.username = $1
        `, [username]);

        if (result.rows.length === 0) {
            return res.status(400).json({ msg: 'Неверный логин или пароль' });
        }

        const user = result.rows[0];

        if (!user.is_active) {
            return res.status(403).json({ msg: 'Пользователь деактивирован' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Неверный логин или пароль' });
        }

        const token = jwt.sign(
            {
                user: {
                    id: user.user_id,
                    username: user.username,
                    role: user.role_name
                }
            },
            process.env.JWT_SECRET,
            { expiresIn: '999h' }
        );

        res.json({
            token,
            user: {
                id: user.user_id,
                username: user.username,
                last_name: user.last_name,
                first_name: user.first_name,
                middle_name: user.middle_name,
                role: user.role_name  
            }
        });
    } catch (err) {
        console.error('Ошибка авторизации:', err.message);
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};