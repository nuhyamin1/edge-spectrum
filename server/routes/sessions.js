const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const auth = require('../middleware/auth');
const isTeacher = require('../middleware/isTeacher');

// Create a new session (teachers only)
router.post('/', auth, isTeacher, async (req, res) => {
    try {
        const { title, subject, description, dateTime, materials } = req.body;
        
        const session = new Session({
            title,
            subject,
            description,
            dateTime: new Date(dateTime),
            materials,
            teacher: req.user._id
        });

        await session.save();
        res.status(201).json(session);
    } catch (error) {
        console.error('Session creation error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all sessions (for teachers - their own sessions)
router.get('/teacher', auth, isTeacher, async (req, res) => {
    try {
        const sessions = await Session.find({ teacher: req.user._id })
            .sort({ dateTime: 'asc' });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching teacher sessions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get all available sessions (for students)
router.get('/available', auth, async (req, res) => {
    try {
        const sessions = await Session.find({ 
            dateTime: { $gt: new Date() }
        })
        .sort({ dateTime: 'asc' })
        .populate('teacher', 'name');
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching available sessions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get a specific session
router.get('/:id', auth, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate('teacher', 'name');
        
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a session (teachers only, their own sessions)
router.put('/:id', auth, isTeacher, async (req, res) => {
    try {
        const session = await Session.findOne({ 
            _id: req.params.id,
            teacher: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { title, subject, description, dateTime, materials } = req.body;
        
        // Update the session fields
        session.title = title;
        session.subject = subject;
        session.description = description;
        session.dateTime = new Date(dateTime);
        session.materials = materials;
        
        await session.save();
        res.json(session);
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete a session (teachers only, their own sessions)
router.delete('/:id', auth, isTeacher, async (req, res) => {
    try {
        const session = await Session.findOneAndDelete({
            _id: req.params.id,
            teacher: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
