const bcrypt = require('bcryptjs');
const db = require('../config/db');

exports.registerUser = async (req, res) => {
    const { username, password, full_name, role } = req.body;
    const creatorId = req.user.id;
    const creatorRole = req.user.role;

    if (creatorRole === 'teacher' && role !== 'student') {
        return res.status(403).json({ msg: 'Преподаватель может создавать только студентов' });
    }

    if (creatorRole === 'student') {
        return res.status(403).json({ msg: 'Недостаточно прав' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await db.query(
            'SELECT add_new_user($1, $2, $3, $4, $5)',
            [creatorRole, username, hashedPassword, full_name, role]
        );

        res.json({ msg: 'Пользователь успешно создан' });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};