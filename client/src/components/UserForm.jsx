import React, { useState } from 'react';
import apiCall from '../utils/api';
import './UserForm.css'

const UserForm = ({ user, onUserCreated }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        full_name: '',
        role: 'student'
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiCall('/users', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            alert('✅ Пользователь создан');
            setFormData({ username: '', password: '', full_name: '', role: 'student' });
            if (onUserCreated) onUserCreated();
        } catch (err) {
            alert('❌ Ошибка: ' + err.message);
        }
    };

    if (!user) {
        return <p>Загрузка...</p>;
    }

    const roleOptions = [];
    if (user.role === 'admin') {
        roleOptions.push({ value: 'admin', label: 'Администратор' });
        roleOptions.push({ value: 'teacher', label: 'Преподаватель' });
    }
    roleOptions.push({ value: 'student', label: 'Студент' });

    return (
        <div className='add_user'>
            <h3>Создать нового пользователя</h3>
            <form onSubmit={handleSubmit} className='add_user_form'>
                <div className='add_user_option'>
                    <label>Логин:</label>
                    <input type="text" name="username" value={formData.username} onChange={handleChange} required />
                </div>
                <div className='add_user_option'>
                    <label>Пароль:</label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required />
                </div>
                <div className='add_user_option'>
                    <label>ФИО:</label>
                    <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required />
                </div>
                <div className='add_user_option'>
                    <label>Роль:</label>
                    <select name="role" value={formData.role} onChange={handleChange} required >
                        {roleOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
                <button type="submit">Создать</button>
            </form>
        </div>
    );
};

export default UserForm;