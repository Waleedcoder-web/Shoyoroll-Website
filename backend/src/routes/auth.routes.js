const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.post('/login', authController.login);
router.get('/verify', requireAuth, authController.verify);

module.exports = router;
