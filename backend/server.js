require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const connectDB      = require('../database/db');
const authRoutes     = require('./routes/authRoutes');
const vaccineRoutes  = require('./routes/vaccineRoutes');
const bookingRoutes  = require('./routes/bookingRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ──────────────────────────────────────────
connectDB();

// ── Global Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve frontend/ as the static root — HTML, CSS, and JS are served from here
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ── API Routes ──────────────────────────────────────────────────
// Auth routes handle POST /signup and POST /login internally
app.use('/',          authRoutes);
app.use('/vaccines',  vaccineRoutes);
app.use('/bookings',  bookingRoutes);
app.use('/hospitals', hospitalRoutes);

// ── Start Server ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`  POST   http://localhost:${PORT}/signup`);
  console.log(`  POST   http://localhost:${PORT}/login`);
  console.log(`  GET    http://localhost:${PORT}/vaccines`);
  console.log(`  GET    http://localhost:${PORT}/bookings`);
  console.log(`  GET    http://localhost:${PORT}/hospitals`);
});
