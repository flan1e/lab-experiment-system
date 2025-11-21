import React, { useState } from 'react';
import apiCall from '../utils/api';
import { useEffect } from 'react';
import './ExperimentList.css'

const ExperimentList = () => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExperiments = async () => {
            try {
                const data = await apiCall('/experiments');
                setExperiments(data);
            } catch (err) {
                alert('Ошибка загрузки экспериментов');
            } finally {
                setLoading(false);
            }
        };
        fetchExperiments();
    }, []);

    if (loading) return <p>Загрузка...</p>;

    return (
        <div className='experimentList'>
            <h2>Список экспериментов</h2>
            <table className='experimentList_table'>
                <thead>
                    <tr className='experimentList_tr'>
                        <th>ID</th>
                        <th>Дата</th>
                        <th className='experimentList_tr_desc'>Описание</th>
                        <th className='experimentList_tr_obs'>Наблюдения</th>
                        <th>Провёл</th>
                    </tr>
                </thead>
                <tbody>
                    {experiments.map(exp => (
                        <tr key={exp.experiment_id}>
                            <td className='experiment_id'>{exp.experiment_id}</td>
                            <td className='experiment_date'>{exp.date_conducted}</td>
                            <td className='experiment_desc'>{exp.description}</td>
                            <td className='experiment_obs'>{exp.observations}</td>
                            <td className='experiment_name'>{exp.user_full_name}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ExperimentList;