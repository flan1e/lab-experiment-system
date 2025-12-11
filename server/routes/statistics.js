const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const statisticsController = require('../controllers/statisticsController');

router.get('/', auth, statisticsController.getStatistics);

module.exports = router;