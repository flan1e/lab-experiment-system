const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const experimentController = require('../controllers/experimentController');

router.get('/', auth, experimentController.getExperiments);
router.get('/:id', auth, experimentController.getExperimentById);
router.post('/', auth, experimentController.addExperiment);
router.put('/:id', auth, experimentController.updateExperiment);
router.delete('/:id', auth, experimentController.deleteExperiment);

module.exports = router;