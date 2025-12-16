const db = require('../config/db');

exports.getAuditLog = async (req, res) => {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(403).json({ msg: 'Недостаточно прав' });
    }

    const { 
        date_from, 
        date_to, 
        user_id, 
        operation 
    } = req.query;

    let query = `
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
        WHERE 1=1
    `;
    const params = [];
    let index = 1;

    if (date_from) {
        query += ` AND a.timestamp >= $${index}`;
        params.push(date_from);
        index++;
    }
    if (date_to) {
        query += ` AND a.timestamp <= $${index}`;
        params.push(date_to);
        index++;
    }
    if (user_id) {
        query += ` AND a.user_id = $${index}`;
        params.push(user_id);
        index++;
    }
    if (operation) {
        query += ` AND a.operation = $${index}`;
        params.push(operation);
        index++;
    }

    query += ` ORDER BY a.timestamp DESC LIMIT 100`;

    try {
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};