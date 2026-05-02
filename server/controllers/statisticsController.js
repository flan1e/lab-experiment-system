const db = require('../config/db');

exports.getStatistics = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ msg: 'Недостаточно прав' });
    }

    try {
        const result = await db.query('SELECT * FROM get_statistics()');
        
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_experiments) : 0;
        const byUser = result.rows.map(row => ({
            // full_name: row.user_full_name,
            last_name: row.last_name,
            first_name: row.first_name,
            middle_name: row.middle_name,
            // role: row.user_role,
            role_name: row.role_name,
            count: parseInt(row.experiments_count)
        }));

        res.json({ total, byUser });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};

exports.getStatisticsReport = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ msg: 'Недостаточно прав' });
    }

    try {
        const result = await db.query('SELECT generate_statistics_report() AS report');
        res.set('Content-Type', 'text/plain; charset=utf-8');
        res.send(result.rows[0].report);
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};

exports.getStudentsGrades = async (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Доступ запрещён' });
    }

    try {
        const result = await db.query('SELECT * FROM get_students_grades_detailed()');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};