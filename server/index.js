const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const experimentRoutes = require('./routes/experiments');
const userRoutes = require('./routes/users');
const auditRoutes = require('./routes/audit');

const app = express();
const PORT = process.env.PORT || 5000;

dotenv.config();
app.use(
    cors({
        origin: ['http://localhost:5173']  
    })
);
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/experiments', experimentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/audit', auditRoutes);

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});