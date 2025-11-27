const db = require('../config/db');

exports.addExperiment = async (req, res) => {
    const { date_conducted, description, observations, reagents } = req.body;
    const user_id = parseInt(req.user.id, 10);

    console.log('req.user:', req.user);
    console.log('req.user.id:', req.user?.id);
    console.log('user_id (parsed):', user_id);

    try {
        if (isNaN(user_id) || user_id <= 0) {
            return res.status(401).json({ msg: 'Недопустимый или отсутствующий user_id' });
        }

        if (!Array.isArray(reagents) || reagents.length === 0) {
            return res.status(400).json({ msg: 'reagents должен быть непустым массивом' });
        }

        const reagent_ids = reagents.map(r => parseInt(r.reagent_id, 10));
        const amounts = reagents.map(r => parseFloat(r.amount));
        const units = reagents.map(r => r.unit.trim());

        if (reagent_ids.some(id => isNaN(id))) {
            return res.status(400).json({ msg: 'reagent_id должен быть числом' });
        }
        if (amounts.some(amt => isNaN(amt))) {
            return res.status(400).json({ msg: 'amount должен быть числом' });
        }

        // ✅ PostgreSQL не позволяет использовать $1 в SET LOCAL
        // ✅ Но user_id — строго проверенное число → безопасно
        await db.query(`SET LOCAL app.current_user_id = ${user_id}`);

        const result = await db.query(
            'SELECT add_experiment($1, $2, $3, $4, $5, $6, $7) AS experiment_id',
            [user_id, date_conducted, description, observations, reagent_ids, amounts, units]
        );

        res.json({ msg: '✅ Эксперимент добавлен', id: result.rows[0].experiment_id });
    } catch (err) {
        console.error('Ошибка в addExperiment:', err.message);
        res.status(500).json({ msg: '❌ Ошибка сервера', error: err.message });
    }
};

exports.getExperiments = async (req, res) => {
    const { user_id, date_from, date_to, reagent_id } = req.query;
    try {
        const result = await db.query(
            'SELECT * FROM get_experiments($1, $2, $3, $4)',
            [user_id || null, date_from || null, date_to || null, reagent_id || null]
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ msg: '❌ Ошибка сервера', error: err.message });
    }
};

exports.updateExperiment = async (req, res) => {
    const { id } = req.params;
    const { date_conducted, description, observations, reagents } = req.body;
    const user_id = parseInt(req.user.id, 10);

    try {
        if (isNaN(user_id) || user_id <= 0) {
            return res.status(400).json({ msg: 'Некорректный user_id' });
        }

        await db.query(`SET LOCAL app.current_user_id = ${user_id}`);

        const reagent_ids = reagents.map(r => parseInt(r.reagent_id, 10));
        const amounts = reagents.map(r => parseFloat(r.amount));
        const units = reagents.map(r => r.unit.trim());

        if (reagent_ids.some(id => isNaN(id))) {
            return res.status(400).json({ msg: 'reagent_id должен быть числом' });
        }
        if (amounts.some(amt => isNaN(amt))) {
            return res.status(400).json({ msg: 'amount должен быть числом' });
        }

        await db.query(
            'SELECT update_experiment($1, $2, $3, $4, $5, $6, $7, $8)',
            [user_id, id, date_conducted, description, observations, reagent_ids, amounts, units]
        );
        res.json({ msg: '✅ Эксперимент обновлён' });
    } catch (err) {
        res.status(500).json({ msg: '❌ Ошибка сервера', error: err.message });
    }
};

exports.deleteExperiment = async (req, res) => {
    const { id } = req.params;
    const user_id = parseInt(req.user.id, 10);

    try {
        if (isNaN(user_id) || user_id <= 0) {
            return res.status(400).json({ msg: 'Некорректный user_id' });
        }

        await db.query(`SET LOCAL app.current_user_id = ${user_id}`);
        await db.query('SELECT delete_experiment($1, $2)', [user_id, id]);
        res.json({ msg: '✅ Эксперимент удалён' });
    } catch (err) {
        res.status(500).json({ msg: '❌ Ошибка сервера', error: err.message });
    }
};