import React, { useState, useEffect } from 'react';
import apiCall from '../utils/api';

const AuditLog = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        date_from: '',
        date_to: '',
        user_id: '',
        operation: ''
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.user_id) params.append('user_id', filters.user_id);
            if (filters.operation) params.append('operation', filters.operation);

            const url = `/audit${params.toString() ? '?' + params.toString() : ''}`;
            const data = await apiCall(url);
            setLogs(data);
        } catch (err) {
            alert('Ошибка загрузки журнала: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchLogs();
    };

    const handleClearFilters = () => {
        setFilters({ date_from: '', date_to: '', user_id: '', operation: '' });
        apiCall('/audit')
            .then(setLogs)
            .catch(() => alert('Ошибка загрузки'))
            .finally(() => setLoading(false));
    };

    if (loading) return <p>Загрузка журнала...</p>;

    return (
        <div style={{ padding: '20px' }} className='audit'>
            <h2>Журнал аудита</h2>

            <form onSubmit={handleFilterSubmit} style={{ marginBottom: '20px', padding: '15px', borderRadius: '8px' }}>
                <h3>Фильтрация</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <label>Дата с: </label>
                        <input
                            type="date"
                            name="date_from"
                            value={filters.date_from}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <label>Дата по: </label>
                        <input
                            type="date"
                            name="date_to"
                            value={filters.date_to}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <label>ID пользователя: </label>
                        <input
                            type="number"
                            name="user_id"
                            value={filters.user_id}
                            onChange={handleFilterChange}
                            min="1"
                            style={{ width: '100px' }}
                        />
                    </div>
                    <div>
                        <label>Операция: </label>
                        <select
                            name="operation"
                            value={filters.operation}
                            onChange={handleFilterChange}
                            style={{ width: '150px' }}
                        >
                            <option value="">Все</option>
                            <option value="INSERT">INSERT</option>
                            <option value="UPDATE">UPDATE</option>
                            <option value="DELETE">DELETE</option>
                            <option value="CREATE_USER">CREATE_USER</option>
                            <option value="CREATE_REVIEW">CREATE_REVIEW</option>
                            <option value="UPDATE_REVIEW">UPDATE_REVIEW</option>
                        </select>
                    </div>
                    <div>
                        <button type="submit">Применить</button>
                        <button type="button" onClick={handleClearFilters} style={{ marginLeft: '10px' }}>
                            Сбросить
                        </button>
                    </div>
                </div>
            </form>

            <table style={{margin: '0 auto', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th>Время</th>
                        <th>Операция</th>
                        <th>Таблица</th>
                        <th>Запись ID</th>
                        <th>Пользователь</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log.log_id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td>{new Date(log.timestamp).toLocaleString('ru-RU')}</td>
                            <td>
                                <span style={{
                                    color: log.operation.includes('INSERT') ? 'green' :
                                           log.operation.includes('UPDATE') ? 'blue' :
                                           log.operation.includes('DELETE') ? 'red' : 'black'
                                }}>
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