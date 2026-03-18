const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
// const auth = require('../middleware/auth');
// const db = require('../config/db');

router.post('/login', authController.login);
// router.get('/me', auth, async (req, res) => {
//     try {
//         const result = await db.query(`
//             SELECT 
//                 u.user_id,
//                 u.username,
//                 u.last_name,
//                 u.first_name,
//                 u.middle_name,
//                 r.role_name
//             FROM users u
//             JOIN roles r ON u.role_id = r.role_id
//             WHERE u.user_id = $1
//         `, [req.user.id]);

//         if (result.rows.length === 0) {
//             return res.status(404).json({ msg: 'Пользователь не найден' });
//         }

//         const user = result.rows[0];
//         res.json({
//             id: user.user_id,
//             username: user.username,
//             last_name: user.last_name,
//             first_name: user.first_name,
//             middle_name: user.middle_name,
//             role: user.role_name
//         });
//     } catch (err) {
//         res.status(500).json({ msg: 'Ошибка сервера', error: err.message });
//     }
// });


module.exports = router;