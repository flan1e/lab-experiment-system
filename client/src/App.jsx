import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ExperimentList from './components/ExperimentList';
import ExperimentForm from './components/ExperimentForm';
import Navbar from './components/Navbar';

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setUser({ id: 1, username: 'ivanov', role: 'student' });
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
        <div>
            <Navbar user={user} onLogout={handleLogout} />
            <ExperimentForm />
            <ExperimentList />
        </div>
    );
}

export default App;