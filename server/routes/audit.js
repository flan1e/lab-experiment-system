const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const auditController = require('../controllers/auditController');

router.get('/', auth, auditController.getAuditLog);

module.exports = router;