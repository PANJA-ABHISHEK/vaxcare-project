require('dotenv').config({ path: './backend/.env' });
const mongoose = require('mongoose');
const Booking = require('../backend/models/Booking');
const Vaccine = require('../backend/models/Vaccine');
const User = require('../backend/models/User');

const dummyNames = [
  "Aarav Sharma", "Priya Patel", "Rohan Gupta", "Ananya Singh", "Vikram Reddy",
  "Neha Desai", "Arjun Nair", "Kavya Iyer", "Rahul Verma", "Sanya Kapoor",
  "Amit Kumar", "Pooja Joshi", "Siddharth Rao", "Divya Menon", "Karan Mehta",
  "Meera Chowdhury", "Aditya Sen", "Riya Das", "Varun Bhatia", "Sneha Pillai"
];

const realisticReviews = [
  { rating: 5, review: "Very smooth experience. The staff was professional and the vaccination was quick." },
  { rating: 5, review: "Excellent facility. Was in and out in 15 minutes. Highly recommended!" },
  { rating: 4, review: "Good service, but I had to wait a bit longer than my appointment time." },
  { rating: 5, review: "Doctor was very reassuring. No pain at all during the shot." },
  { rating: 4, review: "Clean hospital and polite staff. Will come back for my next dose." },
  { rating: 5, review: "Very well organized vaccination drive. Thanks to the entire team." },
  { rating: 3, review: "Average experience. The waiting area was quite crowded." },
  { rating: 5, review: "Seamless process from booking to getting the certificate. Great app!" },
  { rating: 4, review: "Overall good. The nurse explained the possible side effects clearly." },
  { rating: 5, review: "Felt very safe and hygienic. 5 stars for the hospital." },
  { rating: 5, review: "Got my shot without any hassle. Very efficient." },
  { rating: 4, review: "Friendly staff. Parking was a bit of an issue though." }
];

async function seed() {
  try {
    await mongoose.connect('mongodb://panja_abhishek:Abhi%40123456789@ac-vm31qyw-shard-00-00.fm1ctoz.mongodb.net:27017,ac-vm31qyw-shard-00-01.fm1ctoz.mongodb.net:27017,ac-vm31qyw-shard-00-02.fm1ctoz.mongodb.net:27017/vaxcare?ssl=true&replicaSet=atlas-qt1xag-shard-0&authSource=admin&retryWrites=true&w=majority');
    console.log('Connected to DB Atlas');

    // 1. Ensure we have dummy users
    let dummyUsers = [];
    for (const name of dummyNames) {
      const email = name.toLowerCase().replace(' ', '.') + '@mock.com';
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({
          name,
          email,
          password: 'password123',
          role: 'patient',
          location: 'Bangalore'
        });
        await user.save();
      }
      dummyUsers.push(user);
    }
    console.log(`Prepared ${dummyUsers.length} dummy users.`);

    // 2. Fetch all vaccines
    const vaccines = await Vaccine.find();
    console.log(`Found ${vaccines.length} vaccines.`);

    // 3. For each vaccine, delete old mock bookings and add new ones
    let addedCount = 0;
    for (const vax of vaccines) {
      // Clean old mock bookings for this vaccine
      const mockUserIds = dummyUsers.map(u => u._id);
      await Booking.deleteMany({ vaccineId: vax._id, userId: { $in: mockUserIds } });

      // Generate 3 to 7 reviews for this vaccine
      const numReviews = Math.floor(Math.random() * 5) + 3; 
      
      const shuffledUsers = [...dummyUsers].sort(() => 0.5 - Math.random());
      
      let totalRating = 0;

      for (let i = 0; i < numReviews; i++) {
        const user = shuffledUsers[i];
        const reviewData = realisticReviews[Math.floor(Math.random() * realisticReviews.length)];
        
        const hasText = Math.random() > 0.2; 
        
        const booking = new Booking({
          userId: user._id,
          vaccineId: vax._id,
          date: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
          time: '10:00 AM',
          status: 'Completed',
          rating: reviewData.rating,
          review: hasText ? reviewData.review : undefined,
          doseNumber: 1,
          totalDoses: vax.dosesRequired || 1
        });

        await booking.save();
        totalRating += reviewData.rating;
        addedCount++;
      }

      const avg = totalRating / numReviews;
      vax.rating = Math.round(avg * 10) / 10;
      await vax.save();
    }

    console.log(`Successfully added ${addedCount} realistic reviews across all vaccines!`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
