const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');
const User   = require('../../database/models/User');

// POST /signup
const signup = async (req, res) => {
  try {
    const { name, email, password, role, location, governmentId, age, gender } = req.body;

    if (!name || !email || !password || !role)
      return res.status(400).json({ message: 'All fields are required' });
    if (!/\S+@\S+\.\S+/.test(email))
      return res.status(400).json({ message: 'Invalid email format' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name, email, password: hashedPassword, role,
      location:     location     || undefined,
      governmentId: governmentId || undefined,
      age:          age          || undefined,
      gender:       gender       || undefined,
    });
    await newUser.save();

    const token = jwt.sign(
      { userId: newUser._id, role: newUser.role, name: newUser.name },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { _id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role, location: newUser.location }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /login
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role)
      return res.status(400).json({ message: 'All fields are required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    if (user.role !== role)
      return res.status(401).json({ message: 'Role mismatch. Please select the correct role.' });

    const token = jwt.sign(
      { userId: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, location: user.location }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { signup, login };
