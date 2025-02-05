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

// Get users by role (requires authentication)
router.get('/', auth, async (req, res) => {
  try {
    const { role } = req.query;
    
    // Only teachers can fetch student list
    if (role === 'student' && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied. Only teachers can view student list.' });
    }

    const query = role ? { role } : {};
    const users = await User.find(query)
      .select('name email role') // Only send necessary fields
      .sort({ name: 1 }); // Sort by name

    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users', error: error.message });
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