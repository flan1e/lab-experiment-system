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