const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  vaccineId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vaccine', required: true },
  date:      { type: String, required: true },
  time:      { type: String, required: true },
  status:    { type: String, default: 'Pending' },
  rating:    { type: Number }
});

module.exports = mongoose.model('Booking', bookingSchema);
