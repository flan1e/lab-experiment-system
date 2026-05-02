// client/src/pages/GradesJournal.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';

const GradesJournal = () => {
    const [students, setStudents] = useState([]);
    const [expandedStudentId, setExpandedStudentId] = useState(null);

    useEffect(() => {
        const fetchGrades = async () => {
            try {
                const data = await apiCall('/statistics/grades');
                setStudents(data);
            } catch (err) {
                alert('Ошибка загрузки журнала: ' + err.message);
            }
        };
        fetchGrades();
    }, []);

    const toggleStudent = (studentId) => {
        setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Журнал оценок студентов</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f0f0f0' }}>
                        <th>ФИО</th>
                        <th>Средняя оценка</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <React.Fragment key={student.student_id}>
                            <tr
                                onClick={() => toggleStudent(student.student_id)}
                                style={{
                                    cursor: 'pointer',
                                    backgroundColor: expandedStudentId === student.student_id ? '#e6f7ff' : 'transparent'
                                }}
                            >
                                <td>
                                    {student.last_name} {student.first_name}
                                    {student.middle_name && ` ${student.middle_name}`}
                                </td>
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

                            {/* Работы студента (если раскрыт) */}
                            {expandedStudentId === student.student_id && (
                                <tr>
                                    <td colSpan="2" style={{ padding: '0' }}>
                                        <div style={{ padding: '10px', borderLeft: '2px solid #ccc', marginLeft: '20px' }}>
                                            {student.experiments.length > 0 ? (
                                                student.experiments.map(exp => (
                                                    <div
                                                        key={exp.experiment_id}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // не закрывать родительский клик
                                                            window.location.href = `/experiment/${exp.experiment_id}`;
                                                        }}
                                                        style={{
                                                            padding: '8px',
                                                            borderBottom: '1px solid #eee',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            justifyContent: 'space-between'
                                                        }}
                                                    >
                                                        <span>{exp.theme || 'Без темы'} ({new Date(exp.date_conducted).toLocaleDateString('ru-RU')})</span>
                                                        <span style={{ fontWeight: 'bold', color: exp.rating ? '#28a745' : '#6c757d' }}>
                                                            {exp.rating || '—'}
                                                        </span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p>Нет работ</p>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default GradesJournal;