import React from 'react';
import './Navbar.css'

const Navbar = ({ user, onLogout }) => {
    return (
        <nav className='navbar'>
            <div>
                <h3>Лабораторный журнал</h3>
                {user.role === 'teacher' || user.role === 'admin' ? (
                    <a href="/audit" style={{ marginLeft: '15px' }}>
                        📜 Аудит
                    </a>
                ) : null}
            </div>
            <div className='navbar_user'>
                <span>Пользователь: {user.username} ({user.role})</span>
                <button onClick={onLogout}>Выйти</button>
                {user.role === 'teacher' || user.role === 'admin' ? (
                    <a href="/users">Управление пользователями</a>
                ) : null}
            </div>
        </nav>
    );
};

export default Navbar;