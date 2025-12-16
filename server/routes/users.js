const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

router.post('/', auth, userController.registerUser);
router.delete('/:user_id', auth, userController.deactivateUser); 
router.put('/:user_id', auth, userController.updateUser);        

module.exports = router;