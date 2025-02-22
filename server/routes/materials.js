const express = require('express');
const router = express.Router();
const Material = require('../models/Material');
const auth = require('../middleware/auth');
const isTeacher = require('../middleware/isTeacher');

// Create a new material (teachers only)
router.post('/', auth, isTeacher, async (req, res) => {
  try {
    const material = new Material({
      ...req.body,
      createdBy: req.user._id
    });
    await material.save();
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all materials
router.get('/', auth, async (req, res) => {
  try {
    const materials = await Material.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single material
router.get('/:id', auth, async (req, res) => {
  try {
    const material = await Material.findById(req.params.id)
      .populate('createdBy', 'name');
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a material (teachers only)
router.patch('/:id', auth, isTeacher, async (req, res) => {
  try {
    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    );
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json(material);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a material (teachers only)
router.delete('/:id', auth, isTeacher, async (req, res) => {
  try {
    const material = await Material.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });
    if (!material) {
      return res.status(404).json({ error: 'Material not found' });
    }
    res.json({ message: 'Material deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add this new route for getting materials (works for both teachers and students)
router.get('/list', auth, async (req, res) => {
  try {
    const materials = await Material.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json(materials);
  } catch (error) {
    console.error('Error fetching materials:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
