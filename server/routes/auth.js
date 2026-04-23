const express = require('express');
const { register, login, getMe, getUsersList, resetAdmin } = require('../controllers/auth');
const auth = require('../middleware/auth');
const router = express.Router();


router.post('/register', register);
router.post('/login', login);
router.get('/reset-admin', resetAdmin);
router.get('/me', auth, getMe);
router.get('/users', auth, getUsersList);


module.exports = router;
