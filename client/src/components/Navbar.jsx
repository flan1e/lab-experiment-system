import React from 'react';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
    return (
        <nav className="navbar">
            <h3>Лабораторный журнал</h3>
            <div className='navbar-under'>
                <div className="navbar-links">
                    {user.role === 'teacher' || user.role === 'admin' ? (
                        <>
                            <a href="/audit">📜 Аудит</a>
                            <a href="/statistics">📊 Статистика</a>
                            <a href="/users">👥 Создать пользователя</a>
                        </>
                    ) : null}
                </div>
                <div className="navbar-user-info">
                    <span>Пользователь: {user.username} ({user.role})</span>
                    <button onClick={onLogout} className="navbar-logout-btn">
                        Выйти
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;