import React, { useState } from 'react';
import apiCall from '../utils/api';

const AssignmentEditForm = ({ assignment, onClose, onSave }) => {
    const [title, setTitle] = useState(assignment?.title || '');
    const [description, setDescription] = useState(assignment?.description || '');
    const [instructions, setInstructions] = useState(assignment?.instructions || '');
    const [is_active, setIsActive] = useState(assignment?.is_active ?? true);
    const [reagent_ids, setReagentIds] = useState(
        assignment?.reagents?.map(r => r.id) || []
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (assignment) {
                await apiCall(`/assignments/${assignment.assignment_id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title,
                        description,
                        instructions,
                        is_active,
                        reagent_ids
                    })
                });
            } else {
                await apiCall('/assignments', {
                    method: 'POST',
                    body: JSON.stringify({
                        title,
                        description,
                        instructions,
                        is_active,
                        reagent_ids
                    })
                });
            }
            onSave?.();
            onClose();
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                width: '600px'
            }}>
                <h3>{assignment ? 'Редактировать задание' : 'Новое задание'}</h3>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Тема:</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Описание:</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows="3"
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Инструкции (опц.):</label>
                        <textarea
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            rows="3"
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <label>Реагенты (ID через запятую):</label>
                        <input
                            type="text"
                            value={reagent_ids.join(',')}
                            // onChange={(e) => setReagentIds(e.target.value.split(',').map(id => id.trim()).filter(id => id))}
                            onChange={(e) => setReagentIds(e.target.value.split(',').map(id => id.trim()))}
                            placeholder="1, 3, 5"
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={is_active}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            Активное задание (студенты видят)
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit">Сохранить</button>
                        <button type="button" onClick={onClose}>Отмена</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignmentEditForm;