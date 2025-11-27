import React, { useState, useEffect, useRef } from 'react';
import Login from './components/Login';
import ExperimentList from './components/ExperimentList';
import ExperimentForm from './components/ExperimentForm';
import Navbar from './components/Navbar';

function App() {
    const [user, setUser] = useState(null);
    const refreshListRef = useRef();

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
            <ExperimentForm onExperimentAdded={() => {
                if (refreshListRef.current) {
                    refreshListRef.current();
                }
            }}/>
            <ExperimentList onRefresh={refreshListRef}/>
        </div>
    );
}

export default App;