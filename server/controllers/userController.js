const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.registerUser = async (req, res) => {
    // const { last_name, first_name, middle_name, password, full_name, role } = req.body;
    const { username, last_name, first_name, middle_name, password, role } = req.body;
    const cleanUsername = (username || '').trim();
    const cleanPassword = (password || '').trim();
    // const cleanFullName = (full_name || '').trim();
    const cleanLastName = (last_name || '').trim();
    const cleanFirstName = (first_name || '').trim();
    const cleanMiddleName = (middle_name || '').trim();
    const creatorId = parseInt(req.user.id, 10);
    const creatorRole = req.user.role;

    if (!cleanUsername || !cleanPassword || !cleanLastName || !cleanFirstName || !cleanMiddleName) {
        return res.status(400).json({ msg: 'Все поля обязательны' });
    }

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

        const hashedPassword = await bcrypt.hash(cleanPassword, 10);

        await db.query(
            'SELECT add_new_user($1, $2, $3, $4, $5, $6, $7)',
            [creatorRole, username, hashedPassword, last_name, first_name, middle_name, role]
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
    const { last_name, first_name, middle_name, role_id, new_password } = req.body;
    const adminId = req.user.id;

    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Только админ может редактировать' });
    }

    try {
        const roleResult = await db.query(
            'SELECT role_name FROM roles WHERE role_id = $1',
            [role_id]
        );

        if (roleResult.rows.length === 0) {
            return res.status(400).json({ msg: 'Неверный ID роли' });
        }

        const roleName = roleResult.rows[0].role_name;
        console.log('Конвертировано role_id:', role_id, '→ role_name:', roleName); // ← для отладки

        await db.query(
            'SELECT update_user($1, $2, $3, $4, $5, $6, $7)',
            [adminId, user_id, last_name, first_name, middle_name, roleName, new_password || null]
        );
        res.json({ msg: 'Пользователь обновлён' });
    } catch (err) {
        console.error('❌ Update user error:', err);
        res.status(500).json({ msg: 'Ошибка', error: err.message });
    }
};

exports.getAllUsers = async (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Только администратор может просматривать пользователей' });
    }

    try {
        const result = await db.query(`
            SELECT user_id, username, last_name, first_name, middle_name, role_name, is_active, created_at
            FROM users u JOIN roles r on u.role_id = r.role_id 
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