import React, { useState, useEffect } from 'react';
import './Navbar.css';
import ThemeToggle from './ThemeToggle';

const Navbar = ({ user, onLogout }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobile(mobile);
            if (!mobile) setIsMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isStudent = user?.role === 'student';
    const isTeacher = user?.role === 'teacher';
    const isAdmin = user?.role === 'admin';

    // Все пункты меню по ролям
    const allMenuItems = (
        <>
            <a href="/assignments">📚 Методичка</a>
            {(isTeacher || isAdmin) && <a href="/grades">📊 Журнал</a>}
            {(isAdmin || isTeacher) && <a href="/audit">📜 Аудит</a>}
            {(isAdmin || isTeacher) && <a href="/statistics">📈 Статистика</a>}
            {(isTeacher || isAdmin) && <a href="/users">👥 Создать пользователя</a>}
            {isAdmin && <a href="/users/manage">👥 Управление пользователями</a>}
        </>
    );

    // Пункты, всегда видимые на десктопе
    const alwaysVisible = !isMobile && !isStudent ? (
        <>
            {(isTeacher) &&<a href="/assignments">📚 Методичка</a>}
            {(isTeacher) && <a href="/grades">📊 Журнал</a>}
            {isAdmin && (
                <>
                    <a href="/audit">📜 Аудит</a>
                    <a href="/statistics">📈 Статистика</a>
                    <a href="/users">👥 Создать пользователя</a>
                    <a href="/users/manage">👥 Управление пользователями</a>
                </>
            )}
            {isTeacher && <a href="/users">👥 Создать пользователя</a>}
        </>
    ) : null;

    return (
        <div className="navbar-wrapper">
            {/* <h1 className="navbar-title">Лабораторный журнал</h1> */}
            <a href="/" style={{textDecoration: 'none', color: 'var(--color)'}}><h2>Лабораторный журнал</h2></a>

            <nav className="navbar">
                {(isMobile || !isStudent) && (
                    <button
                        className="navbar-hamburger"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        aria-label="Меню"
                    >
                        ☰
                    </button>
                )}

                <div className="navbar-content">
                    {/* всегда видимая методичка + остальное по ролям */}
                    {!isMobile && (
                        <div className="navbar-links">
                            <a href="/assignments">📚 Методичка</a>
                            {isTeacher && (
                                <>
                                    <a href="/grades">📊 Журнал</a>
                                    <a href="/users">👥 Создать пользователя</a>
                                </>
                            )}
                            {isAdmin && (
                                <>
                                    <a href="/audit">📜 Аудит</a>
                                    <a href="/statistics">📈 Статистика</a>
                                    <a href="/users">👥 Создать пользователя</a>
                                    <a href="/users/manage">👥 Управление пользователями</a>
                                </>
                            )}
                        </div>
                    )}

                    <div className="navbar-user-info">
                        <ThemeToggle />
                        <span>
                            {/* Пользователь: {user?.last_name} {user?.first_name} {user?.middle_name} ({user?.role}) */}
                            Пользователь: {user?.last_name} {user?.first_name} ({user?.role})
                        </span>
                        <button onClick={onLogout} className="navbar-logout-btn">
                            Выйти
                        </button>
                    </div>
                </div>

                {/* Выпадающее меню */}
                {(isMobile || !isStudent) && isMenuOpen && (
                    <div className="navbar-mobile-menu">
                        <div className="navbar-links mobile">{allMenuItems}</div>
                    </div>
                )}
            </nav>
        </div>
    );
};

export default Navbar;