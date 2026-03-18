import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';
import { Navigate, useNavigate } from 'react-router-dom';

const GradesJournal = () => {
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const data = await apiCall('/statistics/grades');
                setGrades(data);
            } catch (err) {
                alert('Ошибка загрузки журнала: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchGrades();
    }, []);

    if (loading) return <p>Загрузка журнала...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <button onClick={() => navigate('/')}>← Назад</button>
            <h2>Журнал оценок студентов</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: 'var(--bg)' }}>
                        <th>ID студента</th>
                        <th>ФИО</th>
                        <th>Средняя оценка</th>
                    </tr>
                </thead>
                <tbody>
                    {grades.length > 0 ? (
                        grades.map(student => (
                            <tr key={student.student_id} style={{ borderBottom: '1px solid #ddd' }}>
                                <td>{student.student_id}</td>
                                <td>{student.last_name} {student.first_name} {student.middle_name}</td>
                                <td>
                                    {student.average_rating ? (
                                        <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                                            {student.average_rating}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#6c757d' }}>—</span>
                                    )}
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan="3" style={{ textAlign: 'center' }}>Нет данных</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default GradesJournal;