const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead, getUpcomingReminder, deleteNotification } = require('../controllers/notificationController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/notifications', authenticateToken, authorizeRole('patient', 'hospital'), getNotifications);
router.put('/notifications/:id/read', authenticateToken, authorizeRole('patient', 'hospital'), markAsRead);
router.delete('/notifications/:id', authenticateToken, authorizeRole('patient', 'hospital'), deleteNotification);
router.get('/reminders/upcoming', authenticateToken, authorizeRole('patient', 'hospital'), getUpcomingReminder);

module.exports = router;
