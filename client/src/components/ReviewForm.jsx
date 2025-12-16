import React, { useState } from 'react';
import apiCall from '../utils/api';

const ReviewForm = ({ experimentId, user, onReviewAdded }) => {
    const [rating, setRating] = useState(3);
    const [comment, setComment] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await apiCall('/reviews', {
                method: 'POST',
                body: JSON.stringify({ experiment_id: experimentId, rating, comment })
            });
            alert('✅ Оценка сохранена');
            if (onReviewAdded) onReviewAdded();
        } catch (err) {
            alert('❌ Ошибка: ' + err.message);
        }
    };

    if (user.role !== 'teacher' && user.role !== 'admin') {
        return null;
    }

    return (
        <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>Оценить эксперимент</h3>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Оценка: </label>
                    <select value={rating} onChange={(e) => setRating(Number(e.target.value))} required>
                        {[1, 2, 3, 4, 5].map(num => (
                            <option key={num} value={num}>{num} {num === 5 ? '⭐' : ''}</option>
                        ))}
                    </select>
                </div>
                <div style={{ marginTop: '10px' }}>
                    <label>Комментарий: </label>
                    <textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Ваш комментарий..."
                        style={{ width: '100%', height: '80px' }}
                    />
                </div>
                <button type="submit" style={{ marginTop: '10px' }}>Сохранить оценку</button>
            </form>
        </div>
    );
};

export default ReviewForm;