import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiCall from '../utils/api';

const AssignmentEditForm = () => {
    const { id } = useParams(); // undefined при создании
    const navigate = useNavigate();
    const isNew = !id;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [is_active, setIsActive] = useState(true);
    const [reagent_ids, setReagentIds] = useState('');

    // Загрузка при редактировании
    useEffect(() => {
        if (!isNew) {
            const load = async () => {
                const data = await apiCall(`/assignments/${id}`);
                setTitle(data.title);
                setDescription(data.description);
                setInstructions(data.instructions || '');
                setIsActive(data.is_active);
                setReagentIds(data.reagents.map(r => r.id).join(','));
            };
            load();
        }
    }, [id, isNew]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const reagents = reagent_ids
            .split(',')
            .map(id => id.trim())
            .filter(id => id)
            .map(id => parseInt(id));

        try {
            if (isNew) {
                await apiCall('/assignments', {
                    method: 'POST',
                    body: JSON.stringify({
                        title, description, instructions, reagent_ids: reagents
                    })
                });
            } else {
                await apiCall(`/assignments/${id}`, {
                    method: 'PUT',
                    body: JSON.stringify({
                        title, description, instructions, is_active, reagent_ids: reagents
                    })
                });
            }
            navigate('/assignments');
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2>{isNew ? 'Новое задание' : 'Редактировать задание'}</h2>
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
                        rows="4"
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
                {!isNew && (
                    <div style={{ marginBottom: '10px' }}>
                        <label>
                            <input
                                type="checkbox"
                                checked={is_active}
                                onChange={(e) => setIsActive(e.target.checked)}
                            />
                            Активное (видно студентам)
                        </label>
                    </div>
                )}
                <div style={{ marginBottom: '15px' }}>
                    <label>ID реагентов (через запятую):</label>
                    <input
                        type="text"
                        value={reagent_ids}
                        onChange={(e) => setReagentIds(e.target.value)}
                        placeholder="1, 3, 5"
                        style={{ width: '100%', padding: '5px' }}
                    />
                </div>
                <button type="submit">Сохранить</button>
                <button type="button" onClick={() => navigate('/assignments')} style={{ marginLeft: '10px' }}>
                    Отмена
                </button>
            </form>
        </div>
    );
};

export default AssignmentEditForm;