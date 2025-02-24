const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Session = require('../models/Session');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const isTeacher = require('../middleware/isTeacher');
const socketService = require('../services/socket');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/sessions');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-powerpoint',
            'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        ];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, and PPTX files are allowed.'));
        }
    }
});

// Get session file
router.get('/:sessionId/files/:filename', auth, async (req, res) => {
    try {
        const session = await Session.findById(req.params.sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const file = session.files.find(f => f.filename === req.params.filename);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const filePath = path.resolve(file.path);

        try {
            // Read file as buffer
            const fileBuffer = await fs.readFile(filePath);
            
            // Set response headers
            res.setHeader('Content-Type', file.mimetype);
            res.setHeader('Content-Disposition', `attachment; filename="${file.originalname}"`);
            
            // Send file buffer
            res.send(fileBuffer);
        } catch (error) {
            console.error('Error reading file:', error);
            res.status(404).json({ error: 'File not found on server' });
        }
    } catch (error) {
        console.error('Error serving file:', error);
        res.status(500).json({ error: 'Error serving file' });
    }
});

// Get all available sessions (for students)
router.get('/available', auth, async (req, res) => {
    try {
        console.log('Fetching available sessions...');
        const currentDate = new Date();
        console.log('Current date:', currentDate);
        
        const sessions = await Session.find({ 
            dateTime: { $gt: currentDate }
        })
        .populate('teacher', 'name email')
        .populate('enrolledStudents', '_id')
        .sort({ dateTime: 'asc' })
        .lean();

        // Add default status for sessions that don't have one
        const processedSessions = sessions.map(session => ({
            ...session,
            status: session.status || 'scheduled'
        }));

        console.log('Found sessions:', processedSessions.length);
        res.json(processedSessions);
    } catch (error) {
        console.error('Error fetching available sessions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch available sessions',
            details: error.message 
        });
    }
});

// Get enrolled sessions for a student
router.get('/enrolled', auth, async (req, res) => {
    try {
        const sessions = await Session.find({
            enrolledStudents: req.user._id,
            dateTime: { $gt: new Date() }
        })
        .sort({ dateTime: 'asc' })
        .populate('teacher', 'name email')
        .lean();
        
        // Add default status for sessions that don't have one
        const processedSessions = sessions.map(session => ({
            ...session,
            status: session.status || 'scheduled'
        }));
        
        res.json(processedSessions);
    } catch (error) {
        console.error('Error fetching enrolled sessions:', error);
        res.status(500).json({ error: error.message });
    }
});

// Create a new session (teachers only)
router.post('/', auth, isTeacher, upload.array('files'), async (req, res) => {
    try {
        const { title, subject, description, dateTime, materials, duration, gracePeriod, semester, externalLinks } = req.body;
        
        // Validate required fields
        if (!duration || duration < 1) {
            return res.status(400).json({ error: 'Duration must be at least 1 minute' });
        }

        if (!gracePeriod || gracePeriod < 0) {
            return res.status(400).json({ error: 'Grace period must be 0 or more minutes' });
        }

        if (!semester) {
            return res.status(400).json({ error: 'Semester is required' });
        }

        // Process external links
        let parsedExternalLinks = [];
        if (externalLinks) {
            try {
                parsedExternalLinks = JSON.parse(externalLinks);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid external links format' });
            }
        }

        // Process uploaded files
        const files = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            path: file.path,
            mimetype: file.mimetype
        })) : [];

        const session = new Session({
            title,
            subject,
            description,
            dateTime: new Date(dateTime),
            duration,
            gracePeriod,
            materials,
            semester,
            teacher: req.user._id,
            status: 'scheduled',
            externalLinks: parsedExternalLinks,
            files
        });

        await session.save();
        
        // Populate teacher information
        await session.populate('teacher', 'name email');
        
        // Emit socket event for real-time update
        const io = socketService.getIO();
        io.emit('sessionUpdate', {
            type: 'sessionCreated',
            session: {
                ...session.toObject(),
                enrolledStudents: [] // Initialize empty array for new session
            }
        });

        res.status(201).json(session);
    } catch (error) {
        // Clean up uploaded files if session creation fails
        if (req.files) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Error cleaning up file:', unlinkError);
                }
            }
        }
        console.error('Session creation error:', error);
        res.status(400).json({ error: error.message });
    }
});

// Get all sessions (with role-based filtering)
router.get('/', auth, async (req, res) => {
    try {
        let query = {};
        
        // For teachers, only show their sessions
        if (req.user.role === 'teacher') {
            query.teacher = req.user._id;
        }
        
        const sessions = await Session.find(query)
            .populate('teacher', 'name email')
            .populate('enrolledStudents', '_id name email profilePicture')
            .sort({ dateTime: 'desc' })
            .lean();

        // Add default status and process dates for each session
        const processedSessions = sessions.map(session => ({
            ...session,
            status: session.status || 'scheduled'
        }));

        res.json(processedSessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ 
            error: 'Failed to fetch sessions',
            details: error.message 
        });
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

// Get specific session by ID
router.get('/:id', auth, async (req, res) => {
    try {
        const session = await Session.findById(req.params.id)
            .populate('teacher', 'name email')
            .populate('enrolledStudents', 'name email profilePicture')
            .lean();

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Add default status if not present
        const processedSession = {
            ...session,
            status: session.status || 'scheduled'
        };

        res.json(processedSession);
    } catch (error) {
        console.error('Error fetching session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update a session (teachers only, their own sessions)
router.put('/:id', auth, isTeacher, upload.array('files'), async (req, res) => {
    try {
        const session = await Session.findOne({ 
            _id: req.params.id,
            teacher: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const { title, subject, description, dateTime, materials, externalLinks } = req.body;
        
        // Process external links
        let parsedExternalLinks = [];
        if (externalLinks) {
            try {
                parsedExternalLinks = JSON.parse(externalLinks);
            } catch (error) {
                return res.status(400).json({ error: 'Invalid external links format' });
            }
        }

        // Process new files
        const newFiles = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalname: file.originalname,
            path: file.path,
            mimetype: file.mimetype
        })) : [];

        // Update the session fields
        session.title = title;
        session.subject = subject;
        session.description = description;
        session.dateTime = new Date(dateTime);
        session.materials = materials;
        session.externalLinks = parsedExternalLinks;
        session.files = [...session.files, ...newFiles];
        
        await session.save();
        res.json(session);
    } catch (error) {
        // Clean up newly uploaded files if update fails
        if (req.files) {
            for (const file of req.files) {
                try {
                    await fs.unlink(file.path);
                } catch (unlinkError) {
                    console.error('Error cleaning up file:', unlinkError);
                }
            }
        }
        console.error('Error updating session:', error);
        res.status(400).json({ error: error.message });
    }
});

// Delete a session (teachers only, their own sessions)
router.delete('/:id', auth, isTeacher, async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            teacher: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Delete associated files
        if (session.files && session.files.length > 0) {
            for (const file of session.files) {
                try {
                    await fs.unlink(file.path);
                } catch (error) {
                    console.error(`Error deleting file ${file.path}:`, error);
                }
            }
        }

        await Session.deleteOne({ _id: session._id });

        // Emit socket event for real-time update
        const io = socketService.getIO();
        io.emit('sessionUpdate', {
            type: 'sessionDeleted',
            sessionId: session._id.toString()
        });

        res.json({ message: 'Session and associated files deleted successfully' });
    } catch (error) {
        console.error('Error deleting session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete file from session
router.delete('/:sessionId/files/:fileId', auth, isTeacher, async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.sessionId,
            teacher: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const file = session.files.id(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Delete the file from storage
        try {
            await fs.unlink(file.path);
        } catch (error) {
            console.error(`Error deleting file ${file.path}:`, error);
        }

        // Remove the file from the session
        session.files.pull(req.params.fileId);
        await session.save();

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Error deleting file:', error);
        res.status(500).json({ error: error.message });
    }
});

// Start a session (teachers only)
router.post('/:id/start', auth, isTeacher, async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            teacher: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status === 'completed') {
            return res.status(400).json({ error: 'Cannot start a completed session' });
        }

        if (session.status === 'active') {
            return res.status(400).json({ error: 'Session is already active' });
        }

        session.status = 'active';
        session.startedAt = new Date();
        await session.save();

        // Emit socket event for real-time update
        const io = socketService.getIO();
        io.emit('sessionUpdate', {
            type: 'statusUpdate',
            sessionId: session._id.toString(),
            status: 'active'
        });

        // Populate teacher and student information before sending response
        await session.populate('teacher', 'name email');
        await session.populate('enrolledStudents', 'name email profilePicture');

        res.json(session);
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ error: 'Failed to start session' });
    }
});

// End a session (teachers only)
router.post('/:id/end', auth, isTeacher, async (req, res) => {
    try {
        const session = await Session.findOne({
            _id: req.params.id,
            teacher: req.user._id
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        if (session.status !== 'active') {
            return res.status(400).json({ error: 'Can only end active sessions' });
        }

        session.status = 'completed';
        session.endedAt = new Date();
        await session.save();

        // Emit socket event for real-time update
        const io = socketService.getIO();
        io.emit('sessionUpdate', {
            type: 'statusUpdate',
            sessionId: session._id.toString(),
            status: 'completed'
        });

        // Populate teacher and student information before sending response
        await session.populate('teacher', 'name email');
        await session.populate('enrolledStudents', 'name email profilePicture');

        res.json(session);
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ error: 'Failed to end session' });
    }
});

// Get attendance for a session
router.get('/:id/attendance', auth, async (req, res) => {
    try {
        const attendance = await Attendance.find({ sessionId: req.params.id })
            .select('studentId status timestamp')
            .lean();
        res.json(attendance);
    } catch (error) {
        console.error('Error fetching attendance:', error);
        res.status(500).json({ error: 'Failed to fetch attendance records' });
    }
});

// Update attendance status
router.post('/:id/attendance', auth, async (req, res) => {
    try {
        const { studentId, status } = req.body;
        
        // First check if session exists
        const session = await Session.findById(req.params.id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // If student is not enrolled, add them
        if (!session.enrolledStudents.includes(studentId)) {
            session.enrolledStudents.push(studentId);
            await session.save();
        }

        // Update or create attendance record
        const attendance = await Attendance.findOneAndUpdate(
            { sessionId: req.params.id, studentId },
            { 
                status,
                timestamp: Date.now()
            },
            { upsert: true, new: true }
        );

        // Emit socket event for real-time update
        const io = socketService.getIO();
        io.emit('attendanceUpdate', {
            sessionId: req.params.id,
            studentId,
            status,
            timestamp: attendance.timestamp
        });

        res.json(attendance);
    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ error: 'Failed to update attendance status' });
    }
});

// Duplicate a session for a new semester
router.post('/:id/duplicate', auth, isTeacher, async (req, res) => {
    try {
        const { semesterId } = req.body;
        const originalSession = await Session.findById(req.params.id);
        
        if (!originalSession) {
            return res.status(404).json({ error: 'Original session not found' });
        }

        // Create new session with reference to original
        const newSession = new Session({
            title: originalSession.title,
            subject: originalSession.subject,
            description: originalSession.description,
            semester: semesterId,
            originalSession: originalSession._id,
            duration: originalSession.duration,
            gracePeriod: originalSession.gracePeriod,
            materials: originalSession.materials,
            externalLinks: originalSession.externalLinks,
            teacher: req.user._id,
            dateTime: req.body.dateTime // New date for the duplicated session
        });

        await newSession.save();
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sessions by semester
router.get('/semester/:semesterId', auth, async (req, res) => {
    try {
        const sessions = await Session.find({ semester: req.params.semesterId })
            .populate('teacher', 'name email')
            .populate('semester')
            .sort({ dateTime: 'asc' });
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
