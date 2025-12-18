import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiCall from '../utils/api';
import MendeleevTable from './MendeleevTable';
import '../components/ExperimentsEdit.css'

const ExperimentEdit = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        date_conducted: '',
        description: '',
        observations: '',
        reagents: [{ reagent_id: '', amount: '', unit: 'г' }]
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExperiment = async () => {
            try {
                const data = await apiCall(`/experiments/${id}`);
                if (data.length > 0) {
                    const exp = data[0];
                    setFormData({
                        date_conducted: exp.date_conducted,
                        description: exp.description || '',
                        observations: exp.observations || '',
                        reagents: exp.reagents && exp.reagents.length > 0
                            ? exp.reagents.map(r => ({
                                reagent_id: r.reagent_id,
                                amount: r.amount,
                                unit: r.unit
                            }))
                            : [{ reagent_id: '', amount: '', unit: 'г' }]
                    });
                }
            } catch (err) {
                alert('Ошибка загрузки');
            } finally {
                setLoading(false);
            }
        };
        fetchExperiment();
    }, [id]);

    const addReagent = () => {
        setFormData(prev => ({
            ...prev,
            reagents: [...prev.reagents, { reagent_id: '', amount: '', unit: 'г' }]
        }));
    };

    const removeReagent = (index) => {
        if (formData.reagents.length <= 1) return;
        const newReagents = [...formData.reagents];
        newReagents.splice(index, 1);
        setFormData(prev => ({ ...prev, reagents: newReagents }));
    };

    const updateReagent = (index, field, value) => {
        const newReagents = [...formData.reagents];
        newReagents[index][field] = value;
        setFormData(prev => ({ ...prev, reagents: newReagents }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiCall(`/experiments/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    date_conducted: formData.date_conducted,
                    description: formData.description,
                    observations: formData.observations,
                    reagents: formData.reagents.map(r => ({
                        reagent_id: parseInt(r.reagent_id, 10),
                        amount: parseFloat(r.amount),
                        unit: r.unit
                    }))
                })
            });
            alert('✅ Изменения сохранены');
            navigate(`/experiment/${id}`);
        } catch (err) {
            alert('❌ Ошибка: ' + err.message);
        }
    };

    if (loading) return <p>Загрузка...</p>;

    return (
        <div>
            <h1>Редактировать эксперимент #{id}</h1>
            <form onSubmit={handleSubmit} className='edit_form'>
                <div className='edit_form_date'>
                    <label>Дата: </label>
                    <input
                        type="date"
                        value={formData.date_conducted}
                        onChange={(e) => setFormData({ ...formData, date_conducted: e.target.value })}
                        required
                    />
                </div>
                <div className='edit_form_desc'>
                    <label>Описание: </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        required
                    />
                </div>
                <div className='edit_form_obs'>
                    <label>Наблюдения: </label>
                    <textarea
                        value={formData.observations}
                        onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    />
                </div>
                <h3>Реагенты</h3>
                <div style={{ marginTop: '20px', marginBottom: '20px' }}>
                    <MendeleevTable />
                </div>
                {formData.reagents.map((r, i) => (
                    <div key={i} style={{ display: 'flex', height: "25px", gap: "10px", margin: '0 auto' }}>
                        <input
                            type="number"
                            placeholder="ID реагента"
                            value={r.reagent_id}
                            onChange={(e) => updateReagent(i, 'reagent_id', e.target.value)}
                            required
                            min="1"
                            style={{ width: '120px' }}
                        />
                        <input
                            type="number"
                            placeholder="Количество"
                            value={r.amount}
                            onChange={(e) => updateReagent(i, 'amount', e.target.value)}
                            required
                            min="0"
                            step="0.01"
                            style={{ width: '120px' }}
                        />
                        <select value={r.unit} onChange={(e) => updateReagent(i, 'unit', e.target.value)}>
                            <option value="г">г</option>
                            <option value="мл">мл</option>
                        </select>
                        <button type="button" onClick={() => removeReagent(i)} disabled={formData.reagents.length <= 1}
                            style={{ background: '#c82333' }}>  </button>
                    </div>
                ))}
                <button type="button" onClick={addReagent} style={{ marginTop: '10px' }}> + Добавить реагент </button>
                <div className='edit_form_buttons'>
                    <button type="submit">Сохранить</button>
                    <button type="button" onClick={() => navigate(`/experiment/${id}`)}>Отмена</button>
                </div>
            </form>
        </div>
    );
};

export default ExperimentEdit;