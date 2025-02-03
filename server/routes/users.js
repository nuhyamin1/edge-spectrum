const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../src/models/User');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', 'uploads', 'profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    console.log('Profile update request received:', req.body);
    console.log('User ID:', req.user._id);
    
    const updates = {
      name: req.body.name,
      email: req.body.email,
      aboutMe: req.body.aboutMe
    };

    if (req.file) {
      console.log('Profile picture uploaded:', req.file.filename);
      updates.profilePicture = `/uploads/profile-pictures/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      console.error('User not found:', req.user._id);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Profile updated successfully:', user);
    res.json({ user });
  } catch (error) {
    console.error('Profile update error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Error updating profile' });
  }
});

module.exports = router;