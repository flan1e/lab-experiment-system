import React from 'react';
import { useNavigate } from 'react-router-dom';
import AuditLog from '../components/AuditLog';

const AuditPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <button onClick={() => navigate('/')} style={{ margin: '10px' }}>
                ← Назад
            </button>
            <AuditLog />
        </div>
    );
};

export default AuditPage;