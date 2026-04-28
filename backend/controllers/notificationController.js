const Notification = require('../models/Notification');
const Booking = require('../models/Booking');

// GET /notifications
// Get all notifications for the logged-in user
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'bookingId',
        populate: { path: 'vaccineId' }
      });
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /notifications/:id/read
// Mark a notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /reminders/upcoming
// Get the next upcoming vaccine booking for the user
const getUpcomingReminder = async (req, res) => {
  try {
    // Find bookings that are 'Pending' or 'Accepted' and date is >= today
    const today = new Date();
    // Format today to YYYY-MM-DD
    const todayStr = today.toISOString().split('T')[0];
    
    const upcomingBookings = await Booking.find({
      userId: req.user.userId,
      status: 'Accepted',
      date: { $gte: todayStr }
    })
    .sort({ date: 1, time: 1 }) // Sort by date and time ascending
    .limit(1)
    .populate('vaccineId');

    if (upcomingBookings.length === 0) {
      return res.status(200).json(null);
    }
    
    const upcoming = upcomingBookings[0];
    // Populate hospital name (which is stored in Vaccine model, but we need to verify)
    
    res.status(200).json(upcoming);

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /notifications/:id
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // Ensure the notification belongs to the user
    if (notification.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await notification.deleteOne();
    res.status(200).json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getNotifications, markAsRead, getUpcomingReminder, deleteNotification };
