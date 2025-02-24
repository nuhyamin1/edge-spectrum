const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update a document in a collection
router.put('/collections/:collectionName/:id', auth, isAdmin, async (req, res) => {
  try {
    const collection = mongoose.connection.db.collection(req.params.collectionName);
    const result = await collection.updateOne(
      { _id: new mongoose.Types.ObjectId(req.params.id) },
      { $set: req.body }
    );
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

// Create admin user
router.post('/create-admin', auth, isAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create new admin user
    const admin = new User({
      name,
      email,
      password,
      role: 'admin',
      isAdmin: true,
      isEmailVerified: true // Admin accounts are pre-verified
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully'
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

module.exports = router;
