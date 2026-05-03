const mongoose = require('mongoose');
const Booking = require('../backend/models/Booking');
const User = require('../backend/models/User');
const Vaccine = require('../backend/models/Vaccine');

const dummyNames = [
  "Aarav Sharma", "Priya Patel", "Rohan Gupta", "Ananya Singh", "Vikram Reddy",
  "Neha Desai", "Arjun Nair", "Kavya Iyer", "Rahul Verma", "Sanya Kapoor",
  "Amit Kumar", "Pooja Joshi", "Siddharth Rao", "Divya Menon", "Karan Mehta",
  "Meera Chowdhury", "Aditya Sen", "Riya Das", "Varun Bhatia", "Sneha Pillai"
];

async function cleanup() {
  try {
    await mongoose.connect('mongodb://panja_abhishek:Abhi%40123456789@ac-vm31qyw-shard-00-00.fm1ctoz.mongodb.net:27017,ac-vm31qyw-shard-00-01.fm1ctoz.mongodb.net:27017,ac-vm31qyw-shard-00-02.fm1ctoz.mongodb.net:27017/vaxcare?ssl=true&replicaSet=atlas-qt1xag-shard-0&authSource=admin&retryWrites=true&w=majority');
    console.log('Connected to DB Atlas');

    const dummyEmails = dummyNames.map(name => name.toLowerCase().replace(' ', '.') + '@mock.com');
    const dummyUsers = await User.find({ email: { $in: dummyEmails } });
    const dummyUserIds = dummyUsers.map(u => u._id);

    // Delete bookings made by these dummy users
    const bookingRes = await Booking.deleteMany({ userId: { $in: dummyUserIds } });
    console.log(`Deleted ${bookingRes.deletedCount} dummy bookings`);

    // Delete the dummy users
    const userRes = await User.deleteMany({ _id: { $in: dummyUserIds } });
    console.log(`Deleted ${userRes.deletedCount} dummy users`);

    // Recalculate average rating for all vaccines based ONLY on genuine reviews
    const vaccines = await Vaccine.find();
    for (const vax of vaccines) {
        const bookings = await Booking.find({ vaccineId: vax._id, rating: { $exists: true, $gt: 0 } });
        if (bookings.length > 0) {
            const sum = bookings.reduce((acc, b) => acc + b.rating, 0);
            vax.rating = Math.round((sum / bookings.length) * 10) / 10;
        } else {
            vax.rating = 0; // or reset to default
        }
        await vax.save();
    }
    console.log('Recalculated genuine vaccine ratings');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();
