const db = require('../config/db');

const checkUserActive = async (req, res, next) => {
    try {
        const result = await db.query(
            'SELECT is_active FROM users WHERE user_id = $1',
            [req.user.id]
        );
        if (result.rows.length === 0 || !result.rows[0].is_active) {
            return res.status(403).json({ msg: 'Пользователь деактивирован' });
        }
        next();
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка проверки пользователя', error: err.message });
    }
};

module.exports = checkUserActive;