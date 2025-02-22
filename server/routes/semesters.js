const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const isTeacher = require('../middleware/isTeacher');
const Semester = require('../models/Semester');

// Get all semesters
router.get('/', auth, async (req, res) => {
    try {
        const semesters = await Semester.find().sort({ year: -1, startDate: -1 });
        res.json(semesters);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create a new semester (admin/teacher only)
router.post('/', auth, isTeacher, async (req, res) => {
    try {
        const { year, term, startDate, endDate } = req.body;

        // Validate dates
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        // Check for existing semester in same period
        const existingSemester = await Semester.findOne({ year, term });
        if (existingSemester) {
            return res.status(400).json({ error: 'Semester already exists for this period' });
        }

        const semester = new Semester({
            year,
            term,
            startDate: new Date(startDate),
            endDate: new Date(endDate)
        });

        await semester.save();
        res.status(201).json(semester);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get current semester
router.get('/current', auth, async (req, res) => {
    try {
        const currentDate = new Date();
        const currentSemester = await Semester.findOne({
            startDate: { $lte: currentDate },
            endDate: { $gte: currentDate }
        });

        if (!currentSemester) {
            return res.status(404).json({ error: 'No active semester found' });
        }

        res.json(currentSemester);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get semester by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({ error: 'Semester not found' });
        }
        res.json(semester);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update semester (admin/teacher only)
router.put('/:id', auth, isTeacher, async (req, res) => {
    try {
        const { year, term, startDate, endDate } = req.body;

        // Validate dates
        if (new Date(startDate) >= new Date(endDate)) {
            return res.status(400).json({ error: 'End date must be after start date' });
        }

        const semester = await Semester.findByIdAndUpdate(
            req.params.id,
            {
                year,
                term,
                startDate: new Date(startDate),
                endDate: new Date(endDate)
            },
            { new: true }
        );

        if (!semester) {
            return res.status(404).json({ error: 'Semester not found' });
        }

        res.json(semester);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete semester (admin/teacher only)
router.delete('/:id', auth, isTeacher, async (req, res) => {
    try {
        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({ error: 'Semester not found' });
        }

        // Check if semester has associated sessions
        const Session = require('../models/Session');
        const sessionCount = await Session.countDocuments({ semester: req.params.id });
        if (sessionCount > 0) {
            return res.status(400).json({ 
                error: 'Cannot delete semester with associated sessions' 
            });
        }

        await semester.remove();
        res.json({ message: 'Semester deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router; 