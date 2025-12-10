import React, {useState} from 'react';
import ApiCall from '../utils/api';
import './Login.css';

const Login = ({onLogin}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await ApiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({username, password})
            });
            localStorage.setItem('token', data.token);
            onLogin(data.user);
        } catch (err) {
            setError(err.message || 'Ошибка входа');
        }
    };

    return (
        <div class='login_form'>
            <h2>Вход в систему</h2>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <form onSubmit={handleSubmit} class='login_inputs'>
                <div>
                    <input type="text" placeholder='Логин' value={username} onChange={(e) => setUsername(e.target.value)} required/>
                </div>
                <div>
                    <input type="password" placeholder='Пароль' value={password} onChange={(e) => setPassword(e.target.value)} required/>
                </div>
                <button type='submit'>Войти</button>
            </form>
        </div>
    );
};

export default Login;