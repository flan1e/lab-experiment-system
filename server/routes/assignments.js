const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkUserActive = require('../middleware/checkUserActive');
const assignmentController = require('../controllers/assignmentController');

router.get('/', auth, checkUserActive, assignmentController.getAssignments);
router.post('/', auth, checkUserActive, assignmentController.addAssignment);

router.get('/:id', auth, checkUserActive, assignmentController.getAssignmentById);

router.put('/:id', auth, checkUserActive, assignmentController.updateAssignment);
router.delete('/:id', auth, checkUserActive, assignmentController.deleteAssignment);

module.exports = router;