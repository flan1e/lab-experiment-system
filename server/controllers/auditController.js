const db = require('../config/db');

exports.getAuditLog = async (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Недостаточно прав' });
    }

    try {
        const result = await db.query(`
            SELECT 
                a.log_id,
                a.operation,
                a.table_name,
                a.record_id,
                a.timestamp,
                u.username,
                u.full_name
            FROM audit_log a
            LEFT JOIN users u ON u.user_id = a.user_id
            ORDER BY a.timestamp DESC
            LIMIT 100
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};