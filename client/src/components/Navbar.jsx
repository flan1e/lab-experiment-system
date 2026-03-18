import React from 'react';
import './Navbar.css';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ user, onLogout }) => {
    const isTeacherOrAdmin = user?.role === 'teacher' || user?.role === 'admin';
    const isAdmin = user?.role === 'admin';

    return (
        <nav className="navbar">
            {/* <h3>Лабораторный журнал</h3> */}
            <a href="/" style={{fontSize: '20px', color: 'var(--color)', textDecoration: 'none'}}>Лабораторный журнал</a>
            <div className='navbar-under'>
                <div className="navbar-links">
                    <a href="/assignments">📚 Методичка</a>

                    {isTeacherOrAdmin && (
                        <>
                            <a href="/grades">📊 Журнал</a>
                            <a href="/audit">📜 Аудит</a>
                            <a href="/statistics">📈 Статистика</a>
                            <a href="/users">👥 Создать пользователя</a>
                        </>
                    )}

                    {isAdmin && (
                        <a href="/users/manage" style={{ marginLeft: '15px' }}>
                            👥 Управление пользователями
                        </a>
                    )}
                </div>

                <div className="navbar-user-info">
                    <ThemeToggle />
                    <span>
                        Пользователь: {user?.last_name} {user?.first_name} ({user?.role})
                    </span>
                    <button onClick={onLogout} className="navbar-logout-btn">
                        Выйти
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;