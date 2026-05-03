const Vaccine = require('../models/Vaccine');
const Booking = require('../models/Booking');
const User    = require('../models/User');

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
        if (hospital) {
          if (hospital.location) {
            obj.location = hospital.location;
            await Vaccine.findByIdAndUpdate(v._id, { location: hospital.location });
          }
          obj.hospitalId = hospital._id.toString();
        }
      } else if (obj.hospitalName) {
        const hospital = await User.findOne({ name: obj.hospitalName, role: 'hospital' });
        if (hospital) obj.hospitalId = hospital._id.toString();
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
    let { name, doctorName, experience, stock, hospitalName, location, rating, cost, dosesRequired, daysBetweenDoses } = req.body;

    if (!location || location.trim() === '' || location === 'Not specified') {
      const hospital = await User.findOne({ name: hospitalName, role: 'hospital' });
      if (hospital && hospital.location) location = hospital.location;
    }

    const newVaccine = new Vaccine({ 
      name, doctorName, experience, stock, hospitalName, location, rating, 
      cost: cost || 0,
      dosesRequired: dosesRequired || 1,
      daysBetweenDoses: daysBetweenDoses || 0
    });
    await newVaccine.save();
    res.status(201).json({ message: 'Vaccine listing added successfully', vaccine: newVaccine });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /vaccines/:id
const updateVaccine = async (req, res) => {
  try {
    const { stockIncrement, stock, name, doctorName, experience, cost, dosesRequired, daysBetweenDoses } = req.body;
    const vaccine = await Vaccine.findById(req.params.id);
    if (!vaccine) return res.status(404).json({ message: 'Vaccine not found' });

    // Stock updates (legacy shortcut)
    if (stockIncrement !== undefined) {
      vaccine.stock += parseInt(stockIncrement);
    } else if (stock !== undefined) {
      vaccine.stock = parseInt(stock);
    }

    // Full-field edits
    if (name !== undefined)             vaccine.name             = name;
    if (doctorName !== undefined)       vaccine.doctorName       = doctorName;
    if (experience !== undefined)       vaccine.experience       = experience;
    if (cost !== undefined)             vaccine.cost             = parseFloat(cost);
    if (dosesRequired !== undefined)    vaccine.dosesRequired    = parseInt(dosesRequired);
    if (daysBetweenDoses !== undefined) vaccine.daysBetweenDoses = parseInt(daysBetweenDoses);

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
