import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ExperimentDetail from './components/ExperimentDetail';
import ExperimentEdit from './components/ExperimentEdit';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import './App.css'

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser(payload.user);
            } catch (err) {
                console.error('Не удалось расшифровать токен', err);
                localStorage.removeItem('token');
            }
        }
    }, []);

    const handleLogin = (userData) => {
        setUser(userData);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    return (
        <Router>
            <div className='app'>
                <Navbar user={user} onLogout={handleLogout} className='app_navbar' />
                <Routes>
                    <Route path="/" element={<Dashboard user={user} />} />
                    <Route path="/experiment/:id" element={<ExperimentDetail user={user} />} />
                    <Route path="/experiment/:id/edit" element={<ExperimentEdit user={user} />} />
                    <Route path="/users" element={<UsersPage user={user} />} />
                    <Route path="/audit" element={<AuditPage />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;