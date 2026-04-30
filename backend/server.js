require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const connectDB      = require('./config/db');
const authRoutes     = require('./routes/authRoutes');
const vaccineRoutes  = require('./routes/vaccineRoutes');
const bookingRoutes  = require('./routes/bookingRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const profileRoutes  = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ──────────────────────────────────────────
connectDB();

// ── Global Middleware ───────────────────────────────────────────
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500", "https://vaxcare-project.vercel.app"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve frontend/ as the static root — HTML, CSS, and JS are served from here
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ──────────────────────────────────────────────────
// Auth routes handle POST /signup and POST /login internally
app.use('/',          authRoutes);
app.use('/vaccines',  vaccineRoutes);
app.use('/bookings',  bookingRoutes);
app.use('/hospitals', hospitalRoutes);
app.use('/profile',   profileRoutes);
app.use('/',          notificationRoutes);

// ── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`  POST   http://localhost:${PORT}/signup`);
  console.log(`  POST   http://localhost:${PORT}/login`);
  console.log(`  GET    http://localhost:${PORT}/vaccines`);
  console.log(`  GET    http://localhost:${PORT}/bookings`);
  console.log(`  GET    http://localhost:${PORT}/hospitals`);
});
