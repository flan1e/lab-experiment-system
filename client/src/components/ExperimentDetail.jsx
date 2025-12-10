import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';
import '../components/ExperimentDetail.css';

const ExperimentDetail = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [experiment, setExperiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchExperiment = async () => {
            try {
                const data = await apiCall(`/experiments/${id}`);
                if (data.length > 0) {
                    setExperiment(data[0]);
                } else {
                    setError('Эксперимент не найден');
                }
            } catch (err) {
                setError('Ошибка загрузки эксперимента');
            } finally {
                setLoading(false);
            }
        };
        fetchExperiment();
    }, [id]);

    const handleDelete = async () => {
        if (!window.confirm('Вы уверены, что хотите удалить этот эксперимент?')) return;

        try {
            await apiCall(`/experiments/${id}`, {
                method: 'DELETE'
            });
            alert('✅ Эксперимент удалён');
            navigate('/');
        } catch (err) {
            alert('❌ Ошибка удаления: ' + err.message);
        }
    };

    const handleEdit = () => {
        navigate(`/experiment/${id}/edit`);
    };

    if (loading) return <p>Загрузка...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    const canEditOrDelete = 
        user.role === 'admin' || 
        user.role === 'teacher' || 
        (user.role === 'student' && experiment && experiment.user_id == user.id);

    return (
        <div className='experimentDetail'>
            <h1>Эксперимент #{experiment.experiment_id}</h1>
            <p><strong>Дата:</strong> {experiment.date_conducted}</p>
            <p><strong>Описание:</strong> {experiment.description}</p>
            <p><strong>Наблюдения:</strong> {experiment.observations}</p>
            <p><strong>Провёл:</strong> {experiment.user_full_name} (ID: {experiment.user_id})</p>

            <h3>Реагенты ({experiment.reagents?.length || 0})</h3>
            {experiment.reagents && experiment.reagents.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                    {experiment.reagents.map((r, i) => (
                        <li key={i} style={{ marginBottom: '8px' }}>
                            <strong>{r.name}</strong>: {r.amount} {r.unit}
                            {r.reagent_id && (
                                <span style={{ color: '#666', marginLeft: '10px' }}>
                                    (ID: {r.reagent_id})
                                </span>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>Нет реагентов</p>
            )}

            <div className='buttons_panel'>
                <button onClick={() => navigate('/')}>← Назад </button>
                {canEditOrDelete && (
                    <button onClick={handleEdit}>🖊️ Редактировать эксперимент</button>
                )}
                {canEditOrDelete && (
                    <button onClick={handleDelete} className='buttons_panel_delete'>🗑️ Удалить</button>
                )}
            </div>
        </div>
    );
};

export default ExperimentDetail;