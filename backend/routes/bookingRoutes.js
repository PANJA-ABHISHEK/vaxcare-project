const express = require('express');
const router  = express.Router();
const { getBookings, getBookedSlots, createBooking, updateBooking } = require('../controllers/bookingController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// NOTE: /booked-slots must be registered before /:id to avoid param collision
router.get('/booked-slots', authenticateToken, getBookedSlots);
router.get('/',             authenticateToken, getBookings);
router.post('/',            authenticateToken, authorizeRole('patient'), createBooking);
router.put('/:id',          authenticateToken, updateBooking);

module.exports = router;
