import React, { useState } from 'react';
import ApiCall from '../utils/api';
import './Login.css';

const Login = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [showWelcome, setShowWelcome] = useState(false);
    const [userName, setUserName] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const data = await ApiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            setUserName(data.user.first_name + " " + data.user.middle_name || data.user.username || username);
            setShowWelcome(true);

            setTimeout(() => {
                onLogin(data.user); 
            }, 2000);

        } catch (err) {
            setError(err.message || 'Ошибка входа');
        }
    };

    return (
        <div className='login_form'>
            <h2>Вход в систему</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit} className='login_inputs'>
                <div>
                    <input
                        type="text"
                        placeholder='Логин'
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder='Пароль'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type='submit'>Войти</button>
            </form>

            {
                showWelcome && (
                    <div className="welcome-overlay visible">
                        <h1 className="welcome-text">Добро пожаловать, {userName}!</h1>
                    </div>
                )
            }
        </div>


    );
};

export default Login;