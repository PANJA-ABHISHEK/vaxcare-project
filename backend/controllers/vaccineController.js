const Vaccine = require('../../database/models/Vaccine');
const Booking = require('../../database/models/Booking');
const User    = require('../../database/models/User');

// GET /vaccines
const getVaccines = async (req, res) => {
  try {
    const { location, hospitalName } = req.query;
    let query = {};
    if (location && location.trim() !== '') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }
    if (hospitalName) {
      query.hospitalName = hospitalName;
    }
    const vaccines = await Vaccine.find(query).sort({ rating: -1 });

    // Enrich location from hospital User record if missing
    const enriched = await Promise.all(vaccines.map(async (v) => {
      const obj = v.toObject();
      const missing = !obj.location || obj.location.trim() === '' || obj.location === 'Not specified';
      if (missing && obj.hospitalName) {
        const hospital = await User.findOne({ name: obj.hospitalName, role: 'hospital' });
        if (hospital && hospital.location) {
          obj.location = hospital.location;
          await Vaccine.findByIdAndUpdate(v._id, { location: hospital.location });
        }
      }
      return obj;
    }));

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /vaccines
const addVaccine = async (req, res) => {
  try {
    let { name, doctorName, experience, stock, hospitalName, location, rating } = req.body;

    if (!location || location.trim() === '' || location === 'Not specified') {
      const hospital = await User.findOne({ name: hospitalName, role: 'hospital' });
      if (hospital && hospital.location) location = hospital.location;
    }

    const newVaccine = new Vaccine({ name, doctorName, experience, stock, hospitalName, location, rating });
    await newVaccine.save();
    res.status(201).json({ message: 'Vaccine listing added successfully', vaccine: newVaccine });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /vaccines/:id
const updateVaccine = async (req, res) => {
  try {
    const { stockIncrement, stock } = req.body;
    const vaccine = await Vaccine.findById(req.params.id);
    if (!vaccine) return res.status(404).json({ message: 'Vaccine not found' });

    if (stockIncrement !== undefined) {
      vaccine.stock += parseInt(stockIncrement);
    } else if (stock !== undefined) {
      vaccine.stock = stock;
    }

    await vaccine.save();
    res.status(200).json({ message: 'Vaccine updated', vaccine });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE /vaccines/:id
const deleteVaccine = async (req, res) => {
  try {
    await Vaccine.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Vaccine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getVaccines, addVaccine, updateVaccine, deleteVaccine };
