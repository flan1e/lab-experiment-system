const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.registerUser = async (req, res) => {
    const { username, password, full_name, role } = req.body;
    const creatorId = parseInt(req.user.id, 10);
    const creatorRole = req.user.role;

    if (isNaN(creatorId) || creatorId <= 0) {
        return res.status(400).json({ msg: 'Некорректный ID создателя' });
    }

    if (creatorRole === 'teacher' && role !== 'student') {
        return res.status(403).json({ msg: 'Преподаватель может создавать только студентов' });
    }
    if (creatorRole === 'student') {
        return res.status(403).json({ msg: 'Недостаточно прав' });
    }

    try {
        // await db.query(`SET LOCAL app.current_user_id = ${creatorId}`);

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'SELECT add_new_user($1, $2, $3, $4, $5, $6)',
            [creatorId, creatorRole, username, hashedPassword, full_name, role]
        );

        res.json({ msg: 'Пользователь успешно создан' });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};

exports.deactivateUser = async (req, res) => {
    const { user_id } = req.params;
    const adminId = req.user.id;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Только админ может деактивировать' });
    }

    try {
        await db.query('SELECT deactivate_user($1, $2)', [adminId, user_id]);
        res.json({ msg: 'Пользователь деактивирован' });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка', error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { user_id } = req.params;
    const { full_name, role, new_password } = req.body;
    const adminId = req.user.id;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Только админ может редактировать' });
    }

    try {
        await db.query(
            'SELECT update_user($1, $2, $3, $4, $5)',
            [adminId, user_id, full_name, role, new_password || null]
        );
        res.json({ msg: 'Пользователь обновлён' });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка', error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Только администратор может просматривать пользователей' });
    }

    try {
        const result = await db.query(`
            SELECT user_id, username, full_name, role, is_active, created_at
            FROM users
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};

exports.activateUser = async (req, res) => {
    const { user_id } = req.params;
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Только админ может активировать' });
    }
    try {
        await db.query('SELECT activate_user($1, $2)', [req.user.id, user_id]);
        res.json({ msg: 'Пользователь активирован' });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка', error: err.message });
    }
};