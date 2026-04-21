const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true },
  email:        { type: String, required: true, unique: true },
  password:     { type: String, required: true },
  role:         { type: String, required: true, enum: ['patient', 'hospital'] },
  location:     { type: String },
  governmentId: { type: String },
  age:          { type: Number },
  gender:       { type: String },
  timings:      { type: Object, default: null }  // hospital working hours per day
});

module.exports = mongoose.model('User', userSchema);
