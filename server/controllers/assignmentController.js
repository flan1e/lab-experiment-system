const db = require('../config/db');
const path = require('path');
const fs = require('fs').promises;

exports.getAssignments = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM get_assignments($1)', [req.user.role]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка загрузки заданий', error: err.message });
    }
};

exports.addAssignment = async (req, res) => {
    if (req.user.role === 'student') {
        return res.status(403).json({ msg: 'Студенты не могут создавать задания' });
    }

    const { title, description, instructions, reagent_ids } = req.body;
    
    try {
        const result = await db.query(
            'SELECT add_assignment($1, $2, $3, $4) AS id',
            [title, description, instructions || null, reagent_ids || null]
        );
        res.json({ msg: 'Задание добавлено', id: result.rows[0].id });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка создания задания', error: err.message });
    }
};

exports.getAssignmentById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(
            'SELECT * FROM get_assignment_by_id($1)',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Задание не найдено' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка загрузки задания', error: err.message });
    }
};

exports.updateAssignment = async (req, res) => {
    if (req.user.role === 'student') {
        return res.status(403).json({ msg: 'Студенты не могут редактировать задания' });
    }

    const { id } = req.params;
    const { title, description, instructions, is_active, reagent_ids } = req.body;

    try {
        await db.query(
            'SELECT update_assignment($1, $2, $3, $4, $5, $6)',
            [id, title, description, instructions || null, is_active, reagent_ids || null]
        );
        res.json({ msg: 'Задание обновлено' });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка обновления задания', error: err.message });
    }
};

exports.deleteAssignment = async (req, res) => {
    if (req.user.role === 'student') {
        return res.status(403).json({ msg: 'Студенты не могут удалять задания' });
    }

    const { id } = req.params;
    try {
        await db.query('SELECT delete_assignment($1)', [id]);
        res.json({ msg: 'Задание удалено' });
    } catch (err) {
        res.status(500).json({ msg: 'Ошибка удаления задания', error: err.message });
    }
};