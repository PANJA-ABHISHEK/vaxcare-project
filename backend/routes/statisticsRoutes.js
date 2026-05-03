const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');

router.get('/', async (req, res) => {
  try {
    const hospitalsCount = await User.countDocuments({ role: 'hospital' });
    const vaccinationsCount = await Booking.countDocuments({ status: 'Completed' });
    
    // We can assume a baseline for new apps, or just calculate dynamically if there were reviews.
    // Since we don't have a specific Review model in this snippet, let's keep satisfaction at 98, 
    // or you could calculate it based on completed bookings.
    res.json({ 
      hospitals: hospitalsCount, 
      vaccinations: vaccinationsCount, 
      satisfaction: 98 // Static for now, as review aggregate isn't available
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
