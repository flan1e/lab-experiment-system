import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';

const Statistics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await apiCall('/statistics');
                setStats(data);
            } catch (err) {
                alert('Ошибка загрузки статистики: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <p>Загрузка статистики...</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Статистика</h2>
            
            <h3>Всего экспериментов: {stats.total}</h3>
            
            <h3>По пользователям:</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', border: "1px solid #ddd" }}>
                <thead>
                    <tr style={{border: "1px solid #ddd"}}>
                        <th style={{border: "1px solid #ddd"}}>Пользователь</th>
                        <th style={{border: "1px solid #ddd"}}>Роль</th>
                        <th style={{border: "1px solid #ddd"}}>Экспериментов</th>
                    </tr>
                </thead>
                <tbody>
                    {stats.byUser.map((user, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{border: "1px solid #ddd"}}>{user.last_name} {user.first_name} {user.middle_name}</td>
                            <td style={{border: "1px solid #ddd"}}>{user.role_name}</td>
                            <td style={{border: "1px solid #ddd"}}>{user.count}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Statistics;