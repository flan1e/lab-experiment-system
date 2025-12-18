// client/src/pages/StatisticsPage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Statistics from '../components/Statistics';
import apiCall from '../utils/api'; // для получения токена

const StatisticsPage = () => {
    const navigate = useNavigate();

    const downloadReport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:5000/api/statistics/report', {
                headers: {
                    'x-auth-token': token,
                    'Accept': 'text/plain'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Ошибка ${response.status}: ${errorText}`);
            }

            const reportText = await response.text();
            const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `statistics_report_${new Date().toISOString().slice(0, 10)}.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            alert('Ошибка скачивания отчёта: ' + err.message);
            console.error('Ошибка:', err);
        }
    };

    return (
        <div>
            <button onClick={() => navigate('/')} style={{ margin: '10px' }}>
                ← Назад
            </button>
            <Statistics />
            
            <div style={{ padding: '20px' }}>
                <button 
                    onClick={downloadReport}
                    style={{ 
                        padding: '8px 16px', 
                        backgroundColor: '#007bff', 
                        color: 'white', 
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    📄 Скачать текстовый отчёт
                </button>
            </div>
        </div>
    );
};

export default StatisticsPage;