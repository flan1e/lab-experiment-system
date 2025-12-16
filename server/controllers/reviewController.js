const db = require('../config/db');

exports.addReview = async (req, res) => {
    const { experiment_id, rating, comment } = req.body;
    const reviewerId = parseInt(req.user.id, 10);
    const reviewerRole = req.user.role;

    if (isNaN(reviewerId) || reviewerId <= 0) {
        return res.status(400).json({ msg: 'Некорректный ID пользователя' });
    }

    if (reviewerRole !== 'teacher' && reviewerRole !== 'admin') {
        return res.status(403).json({ msg: 'Только преподаватели и администраторы могут ставить оценки' });
    }

    if (rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'Оценка должна быть от 1 до 5' });
    }

    try {
        await db.query(
            'SELECT add_or_update_review($1, $2, $3, $4)',
            [experiment_id, reviewerId, rating, comment || null]
        );
        res.json({ msg: 'Оценка сохранена' });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};

exports.getReviewByExperiment = async (req, res) => {
    const { experiment_id } = req.params;
    try {
        const result = await db.query(`
            SELECT 
                r.rating,
                r.comment,
                r.created_at,
                u.full_name AS reviewer_name,
                u.role AS reviewer_role
            FROM experiment_reviews r
            JOIN users u ON u.user_id = r.reviewer_id
            WHERE r.experiment_id = $1
        `, [experiment_id]);
        res.json(result.rows[0] || null);
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};