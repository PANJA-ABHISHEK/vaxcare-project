const express = require('express');
const router  = express.Router();
const { getProfile, updateProfile, changePassword } = require('../controllers/profileController');
const { authenticateToken } = require('../middleware/auth');

// NOTE: /password must be registered before any /:param route
router.get('/',          authenticateToken, getProfile);
router.put('/',          authenticateToken, updateProfile);
router.put('/password',  authenticateToken, changePassword);

module.exports = router;
