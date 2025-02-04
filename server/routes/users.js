const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../src/models/User');
const multer = require('multer');

// Configure multer for memory storage instead of disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

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
      // Convert the image buffer to base64 string
      const base64Image = req.file.buffer.toString('base64');
      updates.profilePicture = {
        data: `data:${req.file.mimetype};base64,${base64Image}`,
        contentType: req.file.mimetype
      };
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