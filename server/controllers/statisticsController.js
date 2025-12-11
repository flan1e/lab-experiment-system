const db = require('../config/db');

exports.getStatistics = async (req, res) => {
    if (req.user.role !== 'admin' && req.user.role !== 'teacher') {
        return res.status(403).json({ msg: 'Недостаточно прав' });
    }

    try {
        const result = await db.query('SELECT * FROM get_statistics()');
        
        const total = result.rows.length > 0 ? parseInt(result.rows[0].total_experiments) : 0;
        const byUser = result.rows.map(row => ({
            full_name: row.user_full_name,
            role: row.user_role,
            count: parseInt(row.experiments_count)
        }));

        res.json({ total, byUser });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};