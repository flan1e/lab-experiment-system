import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';


const AssignmentsPage = () => {
    const [assignments, setAssignments] = useState([]);
    const token = localStorage.getItem('token');
    let userRole = null;
    const navigate = useNavigate();

    if (token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userRole = payload.user?.role;
        } catch (e) { }
    }

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

    return (
        <div style={{ padding: '20px' }}>
            <h2>Методичка</h2>
            <div style={{ width:'90%', display: 'flex', flexDirection: 'column', margin: '0 auto', alignItems:'center', gap: '10px'}}>

                <button onClick={() => navigate('/')} style={{width: 'fit-content'}}>← Назад</button>

                {(userRole === 'teacher' || userRole === 'admin') && (
                    <Link to="/assignments/new" style={{ marginBottom: '20px', display: 'inline-block' }}>
                        <button>+ Новое задание</button>
                    </Link>
                )}
            </div>

            <div style={{ marginTop: '20px' }}>
                {assignments.map(a => (
                    <div key={a.assignment_id} style={{
                        padding: '12px',
                        borderBottom: '1px solid #eee',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',

                    }}>
                        <Link to={`/assignments/${a.assignment_id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
                            {a.title}
                        </Link>

                        {(userRole === 'teacher' || userRole === 'admin') && (
                            <div>
                                <Link to={`/assignments/${a.assignment_id}/edit`} style={{ marginRight: '10px' }}>
                                    ✏️
                                </Link>
                                <button
                                    onClick={async () => {
                                        if (window.confirm('Удалить задание?')) {
                                            try {
                                                await apiCall(`/assignments/${a.assignment_id}`, {
                                                    method: 'DELETE',
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                                setAssignments(prev => prev.filter(x => x.assignment_id !== a.assignment_id));
                                            } catch (err) {
                                                alert('Ошибка удаления');
                                            }
                                        }
                                    }}
                                    style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}
                                >
                                    🗑️
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssignmentsPage;