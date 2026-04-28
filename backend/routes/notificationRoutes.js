const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, getUpcomingReminder, deleteNotification } = require('../controllers/notificationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/notifications', authenticateToken, authorizeRole('patient'), getNotifications);
router.put('/notifications/:id/read', authenticateToken, authorizeRole('patient'), markAsRead);
router.delete('/notifications/:id', authenticateToken, authorizeRole('patient'), deleteNotification);
router.get('/reminders/upcoming', authenticateToken, authorizeRole('patient'), getUpcomingReminder);

module.exports = router;
