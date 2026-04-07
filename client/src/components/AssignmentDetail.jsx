import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';

const AssignmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const token = localStorage.getItem('token');
    let userRole = null;

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.user?.role;
        } catch (e) { }
    }

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const data = await apiCall(`/assignments/${id}`);
                setAssignment(data);
            } catch (err) {
                alert('Ошибка загрузки задания');
                navigate('/assignments');
            }
        };
        fetchAssignment();
    }, [id, navigate]);

    if (!assignment) return <div>Загрузка...</div>;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => window.history.back()} style={{ marginBottom: '15px' }}>
                ← Назад
            </button>
            <h2>{assignment.title}</h2>

            <p><strong>Описание:</strong> {assignment.description}</p>

            {assignment.instructions && (
                <p><strong>Инструкции:</strong> {assignment.instructions}</p>
            )}

            {assignment.reagents?.length > 0 && (
                <div style={{width: '200px', margin: '0 auto'}}>
                    <strong>Необходимые реагенты:</strong>
                    <ul style={{listStyle: 'none'}}>
                        {assignment.reagents.map(r => (
                            <li key={r.id}>{r.name}</li>
                        ))}
                    </ul>
                </div>
            )}

            {(userRole === 'teacher' || userRole === 'admin') && (
                <div style={{ margin: '20px auto', }}>
                    <button onClick={() => navigate(`/assignments/${id}/edit`)}>
                        Редактировать
                    </button>
                </div>
            )}
        </div>
    );
};

export default AssignmentDetail;