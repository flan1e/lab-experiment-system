// require('dotenv').config();

// const { Pool } = require('pg');

// const pool = new Pool({
//     user: process.env.DB_USER,
//     host: process.env.DB_HOST,
//     database: process.env.DB_NAME,
//     password: process.env.DB_PASSWORD,
//     port: process.env.DB_PORT,
// });

// pool.connect((err, client, release) => {
//     if (err) {
//         console.error('Ошибка подключения к PostgreSQL:', err.message);
//         console.error('Детали:', err);
//     } else {
//         console.log('Успешно подключено к PostgreSQL');
//         client.query('SELECT NOW()', (err, res) => {
//             if (err) {
//                 console.error('Ошибка выполнения запроса:', err.message);
//             } else {
//                 console.log('Текущее время:', res.rows[0].now);
//             }
//             release();
//         });
//     }
// });

// module.exports = {
//     query: (text, params) => pool.query(text, params),
//     func: (name, params) => pool.func(name,params)
// };