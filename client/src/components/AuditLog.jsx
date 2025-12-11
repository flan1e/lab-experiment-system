import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';
import './AuditLog.css';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const data = await apiCall('/audit');
                setLogs(data);
            } catch (err) {
                alert('Ошибка загрузки журнала: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <p>Загрузка журнала...</p>;

    return (
        <div>
            <h2>Журнал аудита</h2>
            <table style={{borderCollapse: 'collapse'}}>
                <thead>
                    <tr>
                        <th style={{border: '1px solid gray'}}>Время</th>
                        <th style={{border: '1px solid gray'}}>Операция</th>
                        <th style={{border: '1px solid gray'}}>Таблица</th>
                        <th style={{border: '1px solid gray'}}>Запись ID</th>
                        <th style={{border: '1px solid gray'}}>Пользователь</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.log_id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td>{new Date(log.timestamp).toLocaleString('ru-RU')}</td>
                            <td>
                                <span style={{color: log.operation === 'INSERT' ? 'green' :log.operation === 'UPDATE' ? 'blue' : 'red'}}>
                                    {log.operation}
                                </span>
                            </td>
                            <td>{log.table_name}</td>
                            <td>{log.record_id}</td>
                            <td>{log.full_name || log.username || '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {logs.length === 0 && <p>Нет записей</p>}
        </div>
    );
};

export default AuditLog;