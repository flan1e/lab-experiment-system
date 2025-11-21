import React from 'react';
import './Navbar.css'

const Navbar = ({ user, onLogout }) => {
    return (
        <nav className='navbar'>
            <div>
                <h3>Лабораторный журнал</h3>
            </div>
            <div className='navbar_user'> 
                <span>Пользователь: {user.username} ({user.role})</span>
                <button onClick={onLogout}>Выйти</button>
            </div>
        </nav>
    );
};

export default Navbar;