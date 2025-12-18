import React, { useState } from 'react';
import apiCall from '../utils/api';
import MendeleevTable from './MendeleevTable';
import './ExperimentForm.css'

const ExperimentForm = ({ onExperimentAdded }) => {
    const [date, setDate] = useState('');
    const [desc, setDesc] = useState('');
    const [obs, setObs] = useState('');
    const [reagents, setReagents] = useState([{ reagent_id: '', amount: '', unit: 'г' }]);

    const addReagent = () => {
        setReagents([...reagents, { reagent_id: '', amount: '', unit: 'г' }]);
    };

    const removeReagent = (index) => {
        if (reagents.length <= 1) return;
        const newReagents = [...reagents];
        newReagents.splice(index, 1);
        setReagents(newReagents);
    };

    const updateReagent = (index, field, value) => {
        const newReagents = [...reagents];
        newReagents[index][field] = value;
        setReagents(newReagents);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiCall('/experiments', {
                method: 'POST',
                body: JSON.stringify({
                    date_conducted: date,
                    description: desc,
                    observations: obs,
                    reagents: reagents.map(r => ({
                        reagent_id: parseInt(r.reagent_id),
                        amount: parseFloat(r.amount),
                        unit: r.unit
                    }))
                })
            });
            alert('Эксперимент добавлен');

            setDate('');
            setDesc('');
            setObs('');
            setReagents([{ reagent_id: '', amount: '', unit: 'г' }]);

            if (onExperimentAdded) {
                onExperimentAdded();
            }
        } catch (err) {
            alert('Ошибка: ' + err.message);
        }
    };


    return (
        <div className='experiment_form_all'>
            <h2>Добавить эксперимент</h2>
            <form onSubmit={handleSubmit} className='experiment_form'>
                <div className='experiment_form_desc'>
                    <label>Дата: </label>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
                <div className='experiment_form_desc'>
                    <label>Описание: </label>
                    <textarea value={desc} onChange={(e) => setDesc(e.target.value)} required></textarea>
                </div>
                <div className='experiment_form_desc'>
                    <label>Наблюдения: </label>
                    <textarea value={obs} onChange={(e) => setObs(e.target.value)} required></textarea>
                </div>
                <h3>Реагенты</h3>
                <div style={{ marginTop: '20px' }}>
                    <MendeleevTable />
                </div>
                {reagents.map((r, i) => (
                    <div key={i} className='experiment_form_reagents'>
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
                        <button type="button" onClick={() => removeReagent(i)} disabled={reagents.length <= 1}> X </button>
                    </div>
                ))}
                <button type='button' onClick={addReagent}>Добавить реагент</button>
                <button type='submit'>Сохранить</button>
            </form>
        </div>
    );
};

export default ExperimentForm;