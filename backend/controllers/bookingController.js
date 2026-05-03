const Booking = require('../models/Booking');
const Vaccine = require('../models/Vaccine');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /bookings
const getBookings = async (req, res) => {
  try {
    const { userId, vaccineId } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    if (vaccineId) query.vaccineId = vaccineId;

    const bookings = await Booking.find(query).populate('userId').populate('vaccineId');

    // Enrich with hospital details (governmentId, etc.) based on vaccineId.hospitalName
    const enrichedBookings = await Promise.all(bookings.map(async (b) => {
      const obj = b.toObject();
      if (obj.vaccineId && obj.vaccineId.hospitalName) {
        const hospital = await User.findOne({ name: obj.vaccineId.hospitalName, role: 'hospital' }, { password: 0 });
        if (hospital) {
          obj.hospitalDetails = {
            id: hospital._id,
            governmentId: hospital.governmentId || 'N/A',
            location: hospital.location || 'N/A',
            address: hospital.address || 'N/A'
          };
        }
      }
      return obj;
    }));

    res.status(200).json(enrichedBookings);
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

    const bookings = await Booking.find({ 
      vaccineId, 
      date, 
      status: { $nin: ['Cancelled', 'Rejected'] } 
    });
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

    // Validate that the date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDate = new Date(date + 'T00:00:00');
    if (bookingDate < today) {
      return res.status(400).json({ message: 'Cannot book an appointment in the past.' });
    }

    // Validate if the booking is for today, the time must be in the future
    if (bookingDate.getTime() === today.getTime() && time) {
      const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
      const parts = time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (parts) {
        let h = parseInt(parts[1]);
        const m = parseInt(parts[2]);
        const period = parts[3].toUpperCase();
        if (period === 'PM' && h !== 12) h += 12;
        if (period === 'AM' && h === 12) h = 0;
        if ((h * 60 + m) <= nowMinutes) {
          return res.status(400).json({ message: 'Cannot book a past time slot for today.' });
        }
      }
    }

    // Calculate Dose Number
    const previousBookings = await Booking.find({ 
      userId, 
      vaccineId, 
      status: { $nin: ['Cancelled', 'Rejected'] } 
    });
    const doseNumber = previousBookings.length + 1;
    const totalDoses = vaccine.dosesRequired || 1;

    if (doseNumber > totalDoses) {
      return res.status(400).json({ message: `You have already completed the required doses (${totalDoses}) for this vaccine.` });
    }

    const newBooking = new Booking({ userId, vaccineId, date, time, status, doseNumber, totalDoses });
    await newBooking.save();

    // Decrement stock
    vaccine.stock -= 1;
    await vaccine.save();

    // Create notification for the patient
    const doseText = totalDoses > 1 ? ` (Dose ${doseNumber} of ${totalDoses})` : '';
    const notification = new Notification({
      userId,
      bookingId: newBooking._id,
      title: 'Booking Submitted',
      message: `Your booking request for ${vaccine.name}${doseText} on ${date} has been submitted and is pending hospital approval.`,
      appointmentDate: date,
      appointmentTime: time
    });
    await notification.save();

    // Create notification for the hospital
    const hospital = await User.findOne({ name: vaccine.hospitalName, role: 'hospital' });
    if (hospital) {
      const patient = await User.findById(userId);
      const patientName = patient ? patient.name : 'A patient';
      const hospNotif = new Notification({
        userId: hospital._id,
        bookingId: newBooking._id,
        type: 'booking',
        title: 'New Booking Request',
        message: `${patientName} has booked an appointment for ${vaccine.name} on ${date} at ${time}. Please accept or reject this booking in your dashboard.`,
        appointmentDate: date,
        appointmentTime: time
      });
      await hospNotif.save();
      
      // Emit real-time notification to hospital via Socket.IO
      if (req.io) {
        req.io.to(hospital._id.toString()).emit('newBookingNotification', {
          notification: hospNotif,
          bookingId: newBooking._id
        });
      }
    }

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

    // Authorization: ensure the requester owns this booking or is a hospital admin
    const isOwner    = booking.userId.toString() === req.user.userId;
    const isHospital = req.user.role === 'hospital';

    if (!isOwner && !isHospital) {
      return res.status(403).json({ message: 'Access denied. You can only modify your own bookings.' });
    }

    // Patients can only cancel their own bookings (not accept/reject/complete)
    if (isOwner && !isHospital && status && status !== 'Cancelled') {
      return res.status(403).json({ message: 'Patients can only cancel their bookings.' });
    }

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
        // Sweep and delete any pending notifications/reminders linked to this booking
        await Notification.deleteMany({ bookingId: booking._id });
      }

      // If accepted, send the confirmation/reminders
      if (status === 'Accepted' && prevStatus === 'Pending') {
        const vaccine = await Vaccine.findById(booking.vaccineId);
        if (vaccine) {
          const doseText = booking.totalDoses > 1 ? ` (Dose ${booking.doseNumber || 1} of ${booking.totalDoses})` : '';
          const notification = new Notification({
            userId: booking.userId,
            bookingId: booking._id,
            title: 'Booking Accepted & Reminder',
            message: `📅 Reminder: Your vaccination appointment for ${vaccine.name}${doseText} is scheduled for ${booking.date}. Please arrive on time.`,
            appointmentDate: booking.date,
            appointmentTime: booking.time
          });
          await notification.save();

          // If there is a next dose, create a separate follow-up reminder notification
          if ((booking.doseNumber || 1) < booking.totalDoses && vaccine.daysBetweenDoses > 0) {
            const nextDoseDate = new Date(booking.date);
            nextDoseDate.setDate(nextDoseDate.getDate() + vaccine.daysBetweenDoses);
            const nextDoseStr = nextDoseDate.toISOString().split('T')[0];
            
            const followUpNotif = new Notification({
              userId: booking.userId,
              title: 'Next Dose Reminder',
              message: `Reminder: Your next dose (Dose ${(booking.doseNumber || 1) + 1} of ${booking.totalDoses}) for ${vaccine.name} will be due around ${nextDoseStr}. Please remember to book it as the date approaches.`
            });
            await followUpNotif.save();
          }
        }
      }

      // If completed, send the completed notification
      if (status === 'Completed' && prevStatus !== 'Completed') {
        const vaccine = await Vaccine.findById(booking.vaccineId);
        if (vaccine) {
          const notification = new Notification({
            userId: booking.userId,
            bookingId: booking._id,
            title: 'Vaccination Completed',
            message: `You successfully completed the vaccination for ${vaccine.name}. You can now download your certificate and leave a review and rating.`,
            appointmentDate: booking.date,
            appointmentTime: booking.time
          });
          await notification.save();
        }
      }
    }

    if (rating) {
      booking.rating = rating;
      if (req.body.review) booking.review = req.body.review;
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
