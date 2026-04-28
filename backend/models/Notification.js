const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  title: { type: String, required: true },
  message: { type: String, required: true },
  appointmentDate: { type: String },
  appointmentTime: { type: String },
  read: { type: Boolean, default: false },
  reminderDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
