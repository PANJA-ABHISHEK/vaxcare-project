const mongoose = require('mongoose');

const vaccineSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  doctorName:   { type: String, required: true },
  experience:   { type: String, required: true },
  stock:        { type: Number, required: true },
  hospitalName: { type: String, required: true },
  location:     { type: String, required: false },
  cost:         { type: Number, required: true, min: 0, default: 0 },
  rating:       { type: Number, default: 0 },
  dosesRequired: { type: Number, default: 1 },
  daysBetweenDoses: { type: Number, default: 0 }
});

module.exports = mongoose.model('Vaccine', vaccineSchema);
