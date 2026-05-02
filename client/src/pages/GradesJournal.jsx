import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';

const GradesJournal = () => {
    const [students, setStudents] = useState([]);
    const [expandedStudentId, setExpandedStudentId] = useState(null);

    const [search, setSearch] = useState('');
    const [minRating, setMinRating] = useState('');
    const [maxRating, setMaxRating] = useState('');
    const [sortBy, setSortBy] = useState('average_rating');
    const [sortOrder, setSortOrder] = useState('DESC');

    const fetchGrades = async () => {
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (minRating) params.append('minRating', minRating);
            if (maxRating) params.append('maxRating', maxRating);
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);

            const url = `/statistics/grades?${params.toString()}`;
            const data = await apiCall(url);
            setStudents(data);
        } catch (err) {
            alert('Ошибка загрузки журнала: ' + err.message);
        }
    };

    useEffect(() => {
        fetchGrades();
    }, [search, minRating, maxRating, sortBy, sortOrder]);

    const toggleStudent = (studentId) => {
        setExpandedStudentId(expandedStudentId === studentId ? null : studentId);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Журнал оценок студентов</h2>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'var(--bg)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center'}}>
                    <p>Фильтрация:</p>
                    <input
                        type="text"
                        placeholder="Поиск по ФИО..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{ padding: '6px', width: '200px' }}
                    />
                    <input
                        type="number"
                        placeholder="Оценка от"
                        min="1"
                        max="5"
                        value={minRating}
                        onChange={(e) => setMinRating(e.target.value)}
                        style={{ padding: '6px', width: '100px' }}
                    />
                    <input
                        type="number"
                        placeholder="Оценка до"
                        min="1"
                        max="5"
                        value={maxRating}
                        onChange={(e) => setMaxRating(e.target.value)}
                        style={{ padding: '6px', width: '100px' }}
                    />
                    <p>Сортировка:</p>
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{background: 'var(--bg)', color: 'var(--color)'}}>
                        <option value="average_rating">По оценке</option>
                        <option value="last_name">По ФИО</option>
                    </select>
                    <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} style={{background: 'var(--bg)', color: 'var(--color)'}}>
                        <option value="DESC">↓</option>
                        <option value="ASC">↑</option>
                    </select>
                    <button onClick={fetchGrades} style={{ padding: '6px 12px' }}>Применить</button>
                </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: 'var(--bg)' }}>
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
                                    backgroundColor: expandedStudentId === student.student_id ? 'var(--bg)' : 'transparent'
                                }}
                            >
                                <td>
                                    {student.last_name} {student.first_name}
                                    {student.middle_name && ` ${student.middle_name}`}
                                </td>
                                <td>
                                    {student.average_rating > 0 ? (
                                        <span style={{ fontWeight: 'bold', color: '#28a745' }}>
                                            {student.average_rating}
                                        </span>
                                    ) : (
                                        <span style={{ color: '#6c757d' }}>—</span>
                                    )}
                                </td>
                            </tr>

                            {expandedStudentId === student.student_id && (
                                <tr>
                                    <td colSpan="2" style={{ padding: '0' }}>
                                        <div style={{ padding: '10px', borderLeft: '2px solid #ccc', marginLeft: '20px' }}>
                                            {student.experiments.length > 0 ? (
                                                student.experiments.map(exp => (
                                                    <div
                                                        key={exp.experiment_id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
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