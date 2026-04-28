const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ── Core fields (used by existing auth/booking system) ──────────
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  role:         { type: String, required: true, enum: ['patient', 'hospital'] },
  location:     { type: String },
  governmentId: { type: String },
  age:          { type: Number },
  gender:       { type: String },
  timings:      { type: Object, default: null },  // hospital working hours per day

  // ── Profile extension fields (backward-compatible, all optional) ─
  phone:        { type: String },
  address:      { type: String },         // full address (separate from city location)
  description:  { type: String },         // hospital: about section
  profileImage: { type: String },         // base64 data-URI or URL
});

module.exports = mongoose.model('User', userSchema);
