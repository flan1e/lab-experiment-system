import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ExperimentDetail from './components/ExperimentDetail';
import ExperimentEdit from './components/ExperimentEdit';

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
        <Router>
            <div>
                <Navbar user={user} onLogout={handleLogout} />
                <Routes>
                    <Route path="/" element={<Dashboard user={user} />} />
                    <Route path="/experiment/:id" element={<ExperimentDetail user={user} />} />
                    <Route path="/experiment/:id/edit" element={<ExperimentEdit user={user} />} />
                </Routes>
            </div>
        </Router>
    );
}

export default App;