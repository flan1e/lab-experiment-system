import React from 'react';
import './Navbar.css';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ user, onLogout }) => {
    return (
        <nav className="navbar">
            <h3>Лабораторный журнал</h3>
            <div className='navbar-under'>
                <div className="navbar-links">
                    {user.role === 'teacher' || user.role === 'admin' ? (
                        <>
                            <a href="/grades">📊 Журнал</a>
                            <a href="/audit">📜 Аудит</a>
                            <a href="/statistics">📊 Статистика</a>
                            <a href="/users">👥 Создать пользователя</a>
                        </>
                    ) : null}

                    {user.role === 'admin' && (
                        <a href="/users/manage" style={{ marginLeft: '15px' }}>
                            👥 Пользователи
                        </a>
                    )}
                </div>
                <div className="navbar-user-info">
                    <ThemeToggle></ThemeToggle>
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