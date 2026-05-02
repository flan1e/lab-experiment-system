import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import apiCall from '../utils/api';

const ExperimentList = ({ onRefresh, user }) => {
    const [experiments, setExperiments] = useState([]);
    const [loading, setLoading] = useState(true);


    const [filters, setFilters] = useState({
        user_search: '',
        date_from: '',
        date_to: '',
        reagent_id: '',
        unrated_only: false
    });

    const fetchExperiments = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.user_search) params.append('user_search', filters.user_search);
            if (filters.date_from) params.append('date_from', filters.date_from);
            if (filters.date_to) params.append('date_to', filters.date_to);
            if (filters.reagent_id) params.append('reagent_id', filters.reagent_id);
            if (filters.unrated_only) params.append('unrated_only', 'true');

            const data = await apiCall(`/experiments?${params.toString()}`);
            setExperiments(data);
        } catch (err) {
            alert('Ошибка загрузки экспериментов');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchExperiments();
        if (onRefresh) onRefresh.current = fetchExperiments;
    }, [fetchExperiments, onRefresh]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const truncateText = (text, maxLength = 100) => {
        if (!text) return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    };

    return (
        <div style={{ marginTop: '30px' }}>
            <h2>Список экспериментов</h2>

            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Поиск по ФИО или ID студента..."
                        value={filters.user_search}
                        onChange={(e) => handleFilterChange('user_search', e.target.value)}
                        style={{ padding: '6px', width: '200px' }}
                    />
                    <input
                        type="date"
                        value={filters.date_from}
                        onChange={(e) => handleFilterChange('date_from', e.target.value)}
                        style={{ padding: '6px' }}
                    />
                    <input
                        type="date"
                        value={filters.date_to}
                        onChange={(e) => handleFilterChange('date_to', e.target.value)}
                        style={{ padding: '6px' }}
                    />
                    <input
                        type="number"
                        placeholder="ID реагента"
                        value={filters.reagent_id}
                        onChange={(e) => handleFilterChange('reagent_id', e.target.value)}
                        style={{ padding: '6px', width: '120px' }}
                    />
                    <label>
                        <input
                            type="checkbox"
                            checked={filters.unrated_only}
                            onChange={(e) => handleFilterChange('unrated_only', e.target.checked)}
                        />
                        Только неоценённые
                    </label>
                    <button onClick={fetchExperiments} style={{ padding: '6px 12px' }}>
                        Применить
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Загрузка...</p>
            ) : experiments.length === 0 ? (
                <p>Нет экспериментов</p>
            ) : (
                experiments.map(exp => (
                    <div key={exp.experiment_id} style={{
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        padding: '15px',
                        marginBottom: '15px'
                    }}>
                        <Link to={`/experiment/${exp.experiment_id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
                            <h3>{exp.theme || 'Без темы'}</h3>
                        </Link>
                        <p><strong>Дата:</strong> {new Date(exp.date_conducted).toLocaleDateString('ru-RU')}</p>
                        <p><strong>Автор:</strong> {exp.last_name} {exp.first_name} {exp.middle_name} (ID: {exp.user_id})</p>
                        

                        <p><strong>Описание:</strong> {truncateText(exp.description)}</p>
                        <p><strong>Наблюдения:</strong> {truncateText(exp.observations)}</p>

                        {!exp.has_review && user.role !== 'student' && (
                            <span style={{ 
                                background: '#fff8e1', 
                                color: '#ff9800', 
                                padding: '2px 6px', 
                                borderRadius: '4px',
                                fontSize: '0.9em'
                            }}>
                                ⚠️ Не оценено
                            </span>
                        )}
                    </div>
                ))
            )}
        </div>
    );
};

export default ExperimentList;