import React from 'react';
import { useNavigate } from 'react-router-dom';
import UserForm from '../components/UserForm';
import './UsersPage.css'

const UsersPage = ({ user }) => {
    const navigate = useNavigate();

    return (
        <div className='add_user_form'>
            <h2>Управление пользователями</h2>
            <button onClick={() => navigate('/')}>
                ← Назад
            </button>
            <UserForm user={user} />
        </div>
    );
};

export default UsersPage;