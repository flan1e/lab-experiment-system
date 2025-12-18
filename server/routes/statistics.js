const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const statisticsController = require('../controllers/statisticsController');
const checkUserActive = require('../middleware/checkUserActive');

router.get('/', auth, statisticsController.getStatistics);
router.get('/report', auth, checkUserActive, statisticsController.getStatisticsReport);

module.exports = router;