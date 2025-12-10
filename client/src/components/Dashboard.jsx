// src/pages/Dashboard.jsx
import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import ExperimentList from '../components/ExperimentList';
import ExperimentForm from '../components/ExperimentForm';

const Dashboard = ({ user }) => { // ← получает user от App
    const refreshListRef = useRef();

    return (
        <div style={{ padding: '20px' }}>
            <h1>Лабораторный журнал</h1>
            <ExperimentForm 
                user={user} 
                onExperimentAdded={() => {
                    if (refreshListRef.current) refreshListRef.current();
                }} 
            />
            <ExperimentList 
                onRefresh={refreshListRef} 
                user={user} // ← ✅ Передаём user
            />
        </div>
    );
};

export default Dashboard;