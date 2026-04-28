/**
 * database/scripts/seed.js
 * Run with: node database/scripts/seed.js
 *
 * Utility script — wipe all collections in the vaxcare database.
 * Useful for a clean production start.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const User    = require('../models/User');
const Vaccine = require('../models/Vaccine');
const Booking = require('../models/Booking');

async function wipeAll() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas');

  await User.deleteMany({});
  await Vaccine.deleteMany({});
  await Booking.deleteMany({});

  console.log('All collections wiped successfully.');
  await mongoose.disconnect();
}

wipeAll().catch(err => { console.error(err); process.exit(1); });
