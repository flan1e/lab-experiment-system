import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';
import AssignmentEditForm from '../components/AssignmentEditForm';
import { useNavigate } from 'react-router-dom';

const AssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const [selected, setSelected] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    const getRole = () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.user?.role;
        } catch (e) {
            return null;
        }
    };

    const userRole = getRole();

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const data = await apiCall('/assignments');
                setAssignments(data);
            } catch (err) {
                console.error('Ошибка загрузки заданий:', err);
            }
        };
        fetchAssignments();
    }, []);

    const handleSave = () => {
        setIsEditing(false);
        // Обновляем список заданий после сохранения
        const fetchAssignments = async () => {
            const data = await apiCall('/assignments');
            setAssignments(data);
        };
        fetchAssignments();
    };

    return (
        <div style={{ padding: '20px' }}>
                <h2>Методичка</h2>
                <button onClick={() => navigate('/')} style={{ margin: '10px' }}>
                    ← На главную
                </button>

                {userRole === 'teacher' || userRole === 'admin' ? (
                    <button onClick={() => setIsEditing(true)} style={{ marginBottom: '20px' }}>
                        + Новое задание
                    </button>
                ) : null}

            {/* Форма редактирования */}
            {isEditing && (
                <AssignmentEditForm
                    assignment={null}
                    onClose={() => setIsEditing(false)}
                    onSave={handleSave}
                />
            )}

            {/* Список тем */}
            <div style={{ marginBottom: '20px' }}>
                {assignments.map(a => (
                    <div
                        key={a.assignment_id}
                        onClick={() => setSelected(a)}
                        style={{
                            padding: '10px',
                            borderBottom: '1px solid #eee',
                            cursor: 'pointer',
                            fontWeight: selected?.assignment_id === a.assignment_id ? 'bold' : 'normal'
                        }}
                    >
                        {a.title}
                    </div>
                ))}
            </div>

            {/* Карточка задания */}
            {selected && !isEditing && (
                <div style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                    <h3>{selected.title}</h3>
                    <p><strong>Описание:</strong> {selected.description}</p>
                    {selected.instructions && (
                        <p><strong>Инструкции:</strong> {selected.instructions}</p>
                    )}

                    {selected.reagents?.length > 0 && (
                        <div>
                            <strong>Необходимые реагенты:</strong>
                            <ul>
                                {selected.reagents.map(r => (
                                    <li key={r.id}>{r.name}</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AssignmentsPage;