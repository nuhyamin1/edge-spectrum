const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');
const fs = require('fs');

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/uploads/materials');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Created upload directory:', uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Clean the filename to remove special characters
    const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '-');
    const uniqueFileName = Date.now() + '-' + cleanFileName;
    console.log('Generated filename:', uniqueFileName);
    cb(null, uniqueFileName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Upload image endpoint
router.post('/image', auth, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('File uploaded successfully:', req.file);
    
    // Return the URL for the uploaded image
    const imageUrl = `/uploads/materials/${req.file.filename}`;
    console.log('Generated image URL:', imageUrl);
    
    // Verify file exists
    const filePath = path.join(__dirname, '../public', imageUrl);
    if (!fs.existsSync(filePath)) {
      console.error('File not found after upload:', filePath);
      return res.status(500).json({ error: 'File not saved correctly' });
    }
    
    res.json({ url: imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
