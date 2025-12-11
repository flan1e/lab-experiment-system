import React from 'react';
import { useNavigate } from 'react-router-dom';
import Statistics from '../components/Statistics';

const StatisticsPage = () => {
    const navigate = useNavigate();

    return (
        <div>
            <button onClick={() => navigate('/')} style={{ margin: '10px' }}>
                ← Назад
            </button>
            <Statistics />
        </div>
    );
};

export default StatisticsPage;