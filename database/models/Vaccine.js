const mongoose = require('mongoose');

const vaccineSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  doctorName:   { type: String, required: true },
  experience:   { type: String, required: true },
  stock:        { type: Number, required: true },
  hospitalName: { type: String, required: true },
  location:     { type: String, required: false },
  rating:       { type: Number, default: 0 }
});

module.exports = mongoose.model('Vaccine', vaccineSchema);
