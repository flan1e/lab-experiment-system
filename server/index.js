const auth = require('./middleware/auth');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const experimentRoutes = require('./routes/experiments');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');
const statisticsRoutes = require('./routes/statistics');
const reviewRoutes = require('./routes/reviews');
const checkUserActive = require('./middleware/checkUserActive');

const app = express();
const PORT = process.env.PORT || 5173;

dotenv.config();
app.use(
    cors({
        origin: ['http://localhost:5173']  
    })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/experiments', auth, checkUserActive, experimentRoutes);
app.use('/api/users', auth, checkUserActive, userRoutes);
app.use('/api/audit', auth, checkUserActive, auditRoutes);
app.use('/api/reviews', auth, checkUserActive, reviewRoutes);
app.use('/api/statistics', auth, checkUserActive, statisticsRoutes);

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});