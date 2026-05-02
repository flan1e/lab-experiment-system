import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';
import UserEditModal from '../components/UserEditModal';

const UsersManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingUser, setEditingUser] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await apiCall('/users');
                setUsers(data);
            } catch (err) {
                setError('Ошибка загрузки пользователей: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDeactivate = async (userId, isActive) => {
        if (!window.confirm(isActive ? 'Деактивировать пользователя?' : 'Активировать пользователя?')) return;

        try {
            if (isActive) {
                await apiCall(`/users/${userId}`, { method: 'DELETE' });
            } else {
                await apiCall(`/users/${userId}/activate`, { method: 'POST' }); 
            }
            const data = await apiCall('/users');
            setUsers(data);
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
    };

    const handleUserUpdated = async () => {
        const data = await apiCall('/users');
        setUsers(data);
    };

    if (loading) return <p>Загрузка пользователей...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <div style={{ padding: '20px' }}>
            <h2>Управление пользователями</h2>
            <button onClick={() => window.history.back()} style={{ marginBottom: '15px' }}>
                ← Назад
            </button>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', border: "1px solid #ddd" }}>
                <thead>
                    <tr style={{border: "1px solid #ddd"}}>
                        <th style={{border: "1px solid #ddd"}}>ID</th>
                        <th style={{border: "1px solid #ddd"}}>Логин</th>
                        <th style={{border: "1px solid #ddd"}}>ФИО</th>
                        <th style={{border: "1px solid #ddd"}}>Роль</th>
                        <th style={{border: "1px solid #ddd"}}>Статус</th>
                        <th style={{border: "1px solid #ddd"}}>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.user_id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{border: "1px solid #ddd"}}>{user.user_id}</td>
                            <td style={{border: "1px solid #ddd"}}>{user.username}</td>
                            <td style={{border: "1px solid #ddd"}}>{user.last_name} {user.first_name} {user.middle_name}</td>
                            <td style={{border: "1px solid #ddd"}}>{user.role_name}</td>
                            <td style={{border: "1px solid #ddd"}}>
                                <span style={{ color: user.is_active ? 'green' : 'red' }}>
                                    {user.is_active ? 'Активен' : 'Неактивен'}
                                </span>
                            </td>
                            <td style={{border: "1px solid #ddd"}}>
                                <button
                                    onClick={() => handleEdit(user)}
                                    style={{ marginRight: '5px', padding: '2px 6px' }}
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={() => handleDeactivate(user.user_id, user.is_active)}
                                    style={{
                                        backgroundColor: user.is_active ? '#dc3545' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        padding: '2px 6px',
                                        borderRadius: '3px'
                                    }}
                                >
                                    {user.is_active ? '🔒' : '🔓'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingUser && (
                <UserEditModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onUserUpdated={handleUserUpdated}
                />
            )}
        </div>
    );
};

export default UsersManagement;