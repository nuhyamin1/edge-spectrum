const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');
const Semester = require('../models/Semester');
const bcrypt = require('bcryptjs');

// Get all collections in the database
router.get('/collections', auth, isAdmin, async (req, res) => {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({ success: true, collections: collections.map(col => col.name) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get documents from a specific collection
router.get('/collections/:collectionName', auth, isAdmin, async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection(req.params.collectionName);
    const documents = await collection.find({}).toArray();
    res.json({ success: true, documents });
  } catch (error) {
    console.error('Failed to fetch documents:', {
      collection: req.params.collectionName,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a document in a collection
router.put('/collections/:collectionName/:id', auth, isAdmin, async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection(req.params.collectionName);
    
    // Validate ObjectId
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(req.params.id);
    } catch (err) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid document ID format' 
      });
    }

    // Check if document exists first
    const existingDoc = await collection.findOne({ _id: objectId });
    if (!existingDoc) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Sanitize update object and handle nested ObjectIds
    const sanitizedUpdate = {};
    for (const [key, value] of Object.entries(req.body)) {
      if (!key.startsWith('$')) {
        // Convert string ObjectIds to actual ObjectIds
        if (typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value)) {
          try {
            sanitizedUpdate[key] = new mongoose.Types.ObjectId(value);
          } catch (err) {
            sanitizedUpdate[key] = value;
          }
        } else {
          sanitizedUpdate[key] = value;
        }
      }
    }

    // Log the update attempt
    console.log('Attempting document update:', {
      collection: req.params.collectionName,
      documentId: req.params.id,
      updateData: sanitizedUpdate
    });

    const result = await collection.findOneAndUpdate(
      { _id: objectId },
      { $set: sanitizedUpdate },
      { 
        returnDocument: 'after',
        returnOriginal: false
      }
    );

    if (!result) {
      return res.status(404).json({ success: false, message: 'Update failed - document may have been deleted' });
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Document update error:', {
      collection: req.params.collectionName,
      documentId: req.params.id,
      updateData: sanitizedUpdate,
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      success: false, 
      message: error.message,
      details: error.stack 
    });
  }
});

// Delete a document from a collection
router.delete('/collections/:collectionName/:id', auth, isAdmin, async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection(req.params.collectionName);
    const result = await collection.deleteOne({ 
      _id: new mongoose.Types.ObjectId(req.params.id) 
    });
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create user
router.post('/users', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate role
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be student, teacher, or admin'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role,
      isAdmin: role === 'admin',
      isEmailVerified: true // Users created by admin are pre-verified
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get database stats
router.get('/stats', auth, isAdmin, async (req, res) => {
  try {
    const stats = await mongoose.connection.db.stats();
    const collectionsStats = {};
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const count = await mongoose.connection.db
        .collection(collection.name)
        .countDocuments();
      collectionsStats[collection.name] = count;
    }

    res.json({
      success: true,
      stats: {
        ...stats,
        collectionsCount: collectionsStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Create semester
router.post('/semesters', auth, isAdmin, async (req, res) => {
  try {
    const { year, term, startDate, endDate } = req.body;

    // Validate required fields
    if (!year || !term || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: year, term, startDate, endDate'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format'
      });
    }

    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Validate year matches start date
    if (start.getFullYear() !== year) {
      return res.status(400).json({
        success: false,
        message: 'Year must match with start date year'
      });
    }

    // Check for overlapping semesters
    const overlapping = await Semester.findOne({
      $or: [
        { 
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ]
    });

    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: 'Date range overlaps with an existing semester'
      });
    }

    const semester = new Semester({
      year,
      term,
      startDate: start,
      endDate: end
    });

    await semester.save();

    res.status(201).json({
      success: true,
      message: 'Semester created successfully',
      semester
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
