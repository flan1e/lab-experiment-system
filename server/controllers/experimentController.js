const db = require('../config/db');

exports.addExperiment = async (req, res) => {
    const { date_condacted, description, observations, reagents } = req.body;
    const user_id = req.user.id;

    try {
        await db.query('SET LOCAL app.current_user_id = $1', [user_id]);

        const reagent_ids = reagents.map(r => r.reagent_id);
        const amounts = reagents.map(r => r.amount);
        const units = reagents.map(r => r.unit);

        const result = await db.query(
            'SELECT add_experiment($1, $2, $3, $4, $5, $6, $7) AS experiment_id',
            [user_id, date_conducted, description, observations, reagent_ids, amounts, units]
        );
        res.json({ msg: 'Эксперимент добавлен', id: result.rows[0].experiment_id });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
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
        res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
    }
};

exports.updateExperiment = async (req, res) => {
    const { id } = req.params;
    const { date_conducted, description, observation, reagents } = req.body;
    const user_id = req.user.id;

    try {
        await db.query('SET LOCAL app.current_user_id = $1', [user_id]);

        const reagent_ids = reagents.map(r => r.reagent_id);
        const amounts = reagents.map(r => r.amount);
        const units = reagents.map(r => r.unit);

        await db.query(
            'SELECT update_experiment($1, $2, $3, $4, $5, $6, $7, $8)',
            [user_id, id, date_conducted, description, observations, reagent_ids, amounts, units]
        );
        res.json({ msg: 'Эсперимент обновлён' });
    } catch (err) {
        res.status(500).json({msg: 'Ошибка сервера', error: err.message});
    }
};

exports.deleteExperiment = async (req, res) => {
    const {id} = req.params;
    const user_id = req.user.id;

    try {
        await db.query('SET LOCAL app.current_user_id = $1', [user_id]);
        await db.query('SELECT delete_experiment($1, $2', [user_id, id]);
        res.json({msg: 'Эксперимент удалён'});
    } catch (err) {
        res.status(500).json({msg: 'Ошибка сервера', error: err.message});
    }
};