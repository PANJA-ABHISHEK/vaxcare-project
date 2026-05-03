require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors    = require('cors');
const path    = require('path');
const http    = require('http');
const { Server } = require('socket.io');

const connectDB      = require('./config/db');
const authRoutes     = require('./routes/authRoutes');
const vaccineRoutes  = require('./routes/vaccineRoutes');
const bookingRoutes  = require('./routes/bookingRoutes');
const hospitalRoutes = require('./routes/hospitalRoutes');
const profileRoutes  = require('./routes/profileRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes  = require('./routes/messageRoutes');
const chatbotRoutes  = require('./routes/chatbotRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');

const app  = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Socket.io initialization
const io = new Server(server, {
  cors: {
    origin: ["http://127.0.0.1:5000", "http://localhost:5000", "https://vaxcare-project.vercel.app"],
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join a private room based on userId for private messages
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('sendMessage', (data) => {
    // data should contain { senderId, receiverId, message, timestamp }
    // Emit the message to the receiver's room
    io.to(data.receiverId).emit('receiveMessage', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ── Connect to MongoDB ──────────────────────────────────────────
connectDB();

// ── Global Middleware ───────────────────────────────────────────
app.use(cors({
  origin: ["http://127.0.0.1:5000", "http://localhost:5000", "https://vaxcare-project.vercel.app"],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Prevent browser from caching HTML/JS files (serve fresh on every reload)
app.use((req, res, next) => {
  if (req.path.endsWith('.html') || req.path.endsWith('.js') || req.path === '/') {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
});

// Serve frontend/ as the static root — HTML, CSS, and JS are served from here
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Make io accessible to route handlers via req.io
app.use((req, res, next) => { req.io = io; next(); });

// ── API Routes ──────────────────────────────────────────────────
// Auth routes handle POST /signup and POST /login internally
app.use('/',          authRoutes);
app.use('/vaccines',  vaccineRoutes);
app.use('/bookings',  bookingRoutes);
app.use('/hospitals', hospitalRoutes);
app.use('/profile',   profileRoutes);
app.use('/',          notificationRoutes);
app.use('/messages',  messageRoutes);
app.use('/chatbot',   chatbotRoutes);
app.use('/statistics', statisticsRoutes);
// ── Start Server ────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`  POST   http://localhost:${PORT}/signup`);
  console.log(`  POST   http://localhost:${PORT}/login`);
  console.log(`  GET    http://localhost:${PORT}/vaccines`);
  console.log(`  GET    http://localhost:${PORT}/bookings`);
  console.log(`  GET    http://localhost:${PORT}/hospitals`);
});
