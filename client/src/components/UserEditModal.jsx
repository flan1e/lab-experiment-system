import React, { useState } from 'react';
import apiCall from '../utils/api';

const UserEditModal = ({ user, onClose, onUserUpdated }) => {

    // console.log('UserEditModal получил user:', user);
    // console.log('user.role_id:', user.role_id);
    // console.log('user.role:', user.role);

    const getRoleIdFromRoleName = (roleName) => {
        const roleMap = {
            'student': '1',
            'teacher': '2',
            'admin': '3'
        };
        return roleMap[roleName] || '1'; 
    };

    const [formData, setFormData] = useState({
        last_name: user.last_name,
        first_name: user.first_name,
        middle_name: user.middle_name,
        role_id: user.role_id || getRoleIdFromRoleName(user.role_name),
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
        // console.log('🚀 Отправка formData:', formData);
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
                backgroundColor: 'white',
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
                        <label>Фамилия:</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        />
                        <label>Имя:</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        />
                        <label>Отчество:</label>
                        <input
                            type="text"
                            name="middle_name"
                            value={formData.middle_name}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        />
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                        <label>Роль:</label>
                        <select
                            name="role_id"
                            value={formData.role_id}
                            onChange={handleChange}
                            required
                            style={{ width: '100%', padding: '5px' }}
                        >
                            <option value="1">Студент</option>
                            <option value="2">Преподаватель</option>
                            <option value="3">Администратор</option>
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