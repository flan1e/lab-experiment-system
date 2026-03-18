import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';
import '../components/ExperimentDetail.css';
import ReviewForm from './ReviewForm';
import { generateExperimentPDF } from '../components/ExperimentPDF';

const ExperimentDetail = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [experiment, setExperiment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [review, setReview] = useState(null);
    const [loadingReview, setLoadingReview] = useState(true);

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

    useEffect(() => {
        const fetchReview = async () => {
            try {
                const data = await apiCall(`/reviews/experiment/${id}`);
                setReview(data);
            } catch (err) {
                console.error('Ошибка загрузки отзыва', err);
            } finally {
                setLoadingReview(false);
            }
        };
        fetchReview();
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
            <p><strong>Дата:</strong> {new Date(experiment.date_conducted).toLocaleDateString('ru-RU')}</p>
            <div style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff', marginBottom: '8px'}}> 
                {experiment.theme || 'Без темы'}
            </div>
            <p><strong>Описание:</strong> {experiment.description}</p>
            <p><strong>Наблюдения:</strong> {experiment.observations}</p>
            <p><strong>Провёл:</strong> {experiment.last_name} {experiment.first_name} {experiment.middle_name && ` ${experiment.middle_name}`} (ID: {experiment.user_id})</p>

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

            {!loadingReview && review && (
                <div style={{ marginTop: '20px', padding: '15px', borderRadius: '8px' }}>
                    <h3>Оценка</h3>
                    <p><strong>Оценка:</strong> {review.rating} ⭐</p>
                    {review.comment && <p><strong>Комментарий:</strong> {review.comment}</p>}
                    <p><em>От: {review.reviewer_name} ({review.reviewer_role})</em></p>
                </div>
            )}

            <ReviewForm experimentId={id} user={user} onReviewAdded={() => {
                apiCall(`/reviews/experiment/${id}`).then(setReview);
            }} />

            <div className='buttons_panel'>
                <button onClick={() => navigate('/')}>← Назад </button>
                {canEditOrDelete && (
                    <button onClick={handleEdit}>🖊️ Редактировать эксперимент</button>
                )}
                {canEditOrDelete && (
                    <button onClick={handleDelete} className='buttons_panel_delete'>🗑️ Удалить</button>
                )}
            </div>
            <button onClick={async () => { await generateExperimentPDF(experiment); }}>
                📄 Скачать PDF
            </button>
        </div>
    );
};

export default ExperimentDetail;