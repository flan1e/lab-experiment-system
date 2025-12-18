import React, { useState } from 'react';
import apiCall from '../utils/api';

const UserEditModal = ({ user, onClose, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        full_name: user.full_name,
        role: user.role,
        new_password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiCall(`/users/${user.user_id}`, {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            alert('✅ Пользователь обновлён');
            if (onUserUpdated) onUserUpdated();
            onClose();
        } catch (err) {
            alert('❌ Ошибка: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'gray',
                padding: '20px',
                borderRadius: '8px',
                width: '400px',
                maxHeight: '80vh',
                overflowY: 'auto'
            }}>
                <h3>Редактировать пользователя</h3>
                <p><strong>Логин:</strong> {user.username}</p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label>ФИО:</label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Роль:</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="student">Студент</option>
                            <option value="teacher">Преподаватель</option>
                            <option value="admin">Администратор</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Новый пароль (оставьте пустым, чтобы не менять):</label>
                        <input
                            type="password"
                            name="new_password"
                            value={formData.new_password}
                            onChange={handleChange}
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button type="submit" disabled={loading}>
                            {loading ? 'Сохранение...' : 'Сохранить'}
                        </button>
                        <button type="button" onClick={onClose} style={{ backgroundColor: '#6c757d', color: 'white' }}>
                            Отмена
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;