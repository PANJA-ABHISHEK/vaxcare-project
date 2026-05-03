const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.get('/:conversationId', authenticateToken, getMessages);
router.post('/send', authenticateToken, sendMessage);

module.exports = router;
