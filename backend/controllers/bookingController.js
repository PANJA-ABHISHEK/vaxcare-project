const Booking = require('../../database/models/Booking');
const Vaccine  = require('../../database/models/Vaccine');

// GET /bookings
const getBookings = async (req, res) => {
  try {
    const { userId } = req.query;
    let query = {};
    if (userId) query.userId = userId;

    const bookings = await Booking.find(query).populate('userId').populate('vaccineId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /bookings/booked-slots
const getBookedSlots = async (req, res) => {
  try {
    const { vaccineId, date } = req.query;
    if (!vaccineId || !date)
      return res.status(400).json({ message: 'vaccineId and date required' });

    const bookings = await Booking.find({ vaccineId, date });
    const slots = bookings.map(b => b.time);
    res.status(200).json({ bookedSlots: slots });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /bookings
const createBooking = async (req, res) => {
  try {
    const { userId, vaccineId, date, time, status } = req.body;

    // Check vaccine stock before booking
    const vaccine = await Vaccine.findById(vaccineId);
    if (!vaccine) return res.status(404).json({ message: 'Vaccine not found' });
    if (vaccine.stock <= 0) return res.status(400).json({ message: 'Vaccine out of stock' });

    const newBooking = new Booking({ userId, vaccineId, date, time, status });
    await newBooking.save();

    // Decrement stock
    vaccine.stock -= 1;
    await vaccine.save();

    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /bookings/:id
const updateBooking = async (req, res) => {
  try {
    const { status, rating } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const prevStatus = booking.status;

    if (status) {
      booking.status = status;
      // If booking is cancelled or rejected (and was previously pending/accepted), restore stock
      if ((status === 'Cancelled' || status === 'Rejected') && (prevStatus === 'Pending' || prevStatus === 'Accepted')) {
        const vaccine = await Vaccine.findById(booking.vaccineId);
        if (vaccine) {
          vaccine.stock += 1;
          await vaccine.save();
        }
      }
    }

    if (rating) {
      booking.rating = rating;
      const vaccine = await Vaccine.findById(booking.vaccineId);
      if (vaccine) {
        vaccine.rating = (!vaccine.rating || vaccine.rating === 0)
          ? rating
          : Math.round((vaccine.rating + rating) / 2 * 10) / 10;
        await vaccine.save();
      }
    }

    await booking.save();
    res.status(200).json({ message: 'Booking updated', booking });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getBookings, getBookedSlots, createBooking, updateBooking };
