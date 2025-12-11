import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiCall from '../utils/api';
import '../components/experimentList.css';

const ExperimentList = ({ onRefresh, user }) => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({
        user_id: '',
        date_from: '',
        date_to: '',
        reagent_id: ''
    });

    const fetchExperiments = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.user_id) params.append('user_id', filters.user_id);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.reagent_id) params.append('reagent_id', filters.reagent_id);

            const url = `/experiments${params.toString() ? '?' + params.toString() : ''}`;
            const data = await apiCall(url);
            setExperiments(data);
        } catch (err) {
            alert('Ошибка загрузки экспериментов');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExperiments();
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchExperiments();
    };

    const handleClearFilters = () => {
        setFilters({ user_id: '', date_from: '', date_to: '', reagent_id: '' });
        setLoading(true);
        apiCall('/experiments')
            .then(data => setExperiments(data))
            .catch(() => alert('Ошибка загрузки'))
            .finally(() => setLoading(false));
    };

    if (onRefresh) {
        onRefresh.current = fetchExperiments;
    }

    if (loading) return <p>Загрузка...</p>;

    return (
        <div className='experimentList_all'>
            <h2>Список экспериментов</h2>
            <form className='experimentList_validation_form' onSubmit={handleFilterSubmit}>
                <h3>Фильтрация</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <div>
                        <label>Пользователь (ID): </label>
                        <input
                            type="number"
                            name="user_id"
                            value={filters.user_id}
                            onChange={handleFilterChange}
                            placeholder="1"
                            min="1"
                            style={{ width: '80px' }}
                        />
                    </div>
                    <div>
                        <label>Дата с: </label>
                        <input
                            type="date"
                            name="date_from"
                            value={filters.date_from}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <label>Дата по: </label>
                        <input
                            type="date"
                            name="date_to"
                            value={filters.date_to}
                            onChange={handleFilterChange}
                        />
                    </div>
                    <div>
                        <label>Реагент (ID): </label>
                        <input
                            type="number"
                            name="reagent_id"
                            value={filters.reagent_id}
                            onChange={handleFilterChange}
                            placeholder="3"
                            min="1"
                            style={{ width: '80px' }}
                        />
                    </div>
                    <div>
                        <button type="submit">Применить</button>
                        <button type="button" onClick={handleClearFilters} style={{ marginLeft: '10px' }}>
                            Сбросить
                        </button>
                    </div>
                </div>
            </form>

            <table className='experimentList_table'>
                <thead className='experimentList_table_legend'>
                    <tr>
                        <th>ID</th>
                        <th>Дата</th>
                        <th>Описание</th>
                        <th>Наблюдения</th> 
                        <th>Провёл</th>
                    </tr>
                </thead>
                <tbody>
                    {experiments.map(exp => {
                        // if (!user) return null;
                        const canView = user.role === 'student' ? (exp.user_id == user.id) : true;
                        return (
                            <tr 
                                key={exp.experiment_id} 
                                onClick={() => canView && (window.location.href = `/experiment/${exp.experiment_id}`)}
                                style={{ 
                                    cursor: canView ? 'pointer' : 'not-allowed',
                                    opacity: canView ? 1 : 0.5 
                                }}
                            >
                                <td className='experiment_id'>{exp.experiment_id}</td>
                                <td>{new Date(exp.date_conducted).toLocaleDateString('ru-RU')}</td>
                                <td>{exp.description}</td>
                                <td>{exp.observations}</td> 
                                <td className='experiment_name'>{exp.user_full_name}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {experiments.length === 0 && <p>Нет экспериментов</p>}
        </div>
    );
};

export default ExperimentList;