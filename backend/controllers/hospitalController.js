const User    = require('../../database/models/User');
const Vaccine  = require('../../database/models/Vaccine');
const Booking  = require('../../database/models/Booking');

// GET /hospitals
const getHospitals = async (req, res) => {
  try {
    const { location } = req.query;
    let query = { role: 'hospital' };
    if (location && location.trim() !== '') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    const hospitals = await User.find(query, { password: 0 });

    const hospitalsWithRating = await Promise.all(hospitals.map(async (h) => {
      const vaccines = await Vaccine.find({ hospitalName: h.name });
      const vaccineIds = vaccines.map(v => v._id);

      const ratedBookings = vaccineIds.length > 0
        ? await Booking.find({ vaccineId: { $in: vaccineIds }, rating: { $exists: true, $ne: null } })
        : [];

      let avgRating = 0;
      if (ratedBookings.length > 0) {
        const total = ratedBookings.reduce((sum, b) => sum + (b.rating || 0), 0);
        avgRating = Math.round((total / ratedBookings.length) * 10) / 10;
      }

      return { ...h.toObject(), avgRating, reviewCount: ratedBookings.length };
    }));

    hospitalsWithRating.sort((a, b) => b.avgRating - a.avgRating);
    res.status(200).json(hospitalsWithRating);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /hospitals/:name/timings
const getTimings = async (req, res) => {
  try {
    const hospital = await User.findOne({ name: req.params.name, role: 'hospital' });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    res.status(200).json({ timings: hospital.timings || null });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /hospitals/:name/timings
const saveTimings = async (req, res) => {
  try {
    const hospital = await User.findOne({ name: req.params.name, role: 'hospital' });
    if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
    hospital.timings = req.body.timings;
    await hospital.save();
    res.status(200).json({ message: 'Timings saved', timings: hospital.timings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getHospitals, getTimings, saveTimings };
