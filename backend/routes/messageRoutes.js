const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, getConversations } = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');

router.get('/conversations/:userId', authenticateToken, getConversations);
router.post('/send', authenticateToken, sendMessage);
router.get('/:conversationId', authenticateToken, getMessages);

module.exports = router;
