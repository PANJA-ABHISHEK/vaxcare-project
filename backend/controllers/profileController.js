const bcrypt = require('bcrypt');
const User   = require('../models/User');

// ── GET /profile ────────────────────────────────────────────────
// Returns the logged-in user's profile (password excluded)
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId, { password: 0 });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── PUT /profile ────────────────────────────────────────────────
// Updates allowed profile fields. Role and email uniqueness are enforced.
const updateProfile = async (req, res) => {
  try {
    const { name, email, phone, age, gender, location, address,
            governmentId, description, profileImage, timings } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent email duplication by another account
    if (email && email !== user.email) {
      const existing = await User.findOne({ email });
      if (existing) return res.status(400).json({ message: 'Email already in use by another account.' });
      user.email = email;
    }

    // Capture old name to update related vaccines if changed
    const oldName = user.name;
    const oldLocation = user.location;

    // Update fields that are present in request body (undefined = untouched)
    if (name         !== undefined) user.name         = name;
    if (phone        !== undefined) user.phone        = phone;
    if (age          !== undefined) user.age          = age;
    if (gender       !== undefined) user.gender       = gender;
    if (location     !== undefined) user.location     = location;
    if (address      !== undefined) user.address      = address;
    if (governmentId !== undefined) user.governmentId = governmentId;
    if (description  !== undefined) user.description  = description;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (timings      !== undefined) user.timings      = timings;

    // Role is NEVER modifiable by the user
    await user.save();

    // If hospital name or location changed, cascade-update all their existing vaccines
    if (user.role === 'hospital' && (oldName !== user.name || oldLocation !== user.location)) {
      const Vaccine = require('../models/Vaccine');
      await Vaccine.updateMany(
        { hospitalName: oldName },
        { $set: { hospitalName: user.name, location: user.location } }
      );
    }

    const updated = user.toObject();
    delete updated.password;
    res.status(200).json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// ── PUT /profile/password ────────────────────────────────────────
// Validates current password, then saves newly hashed password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: 'Both current and new password are required.' });
    if (newPassword.length < 6)
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });

    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getProfile, updateProfile, changePassword };
