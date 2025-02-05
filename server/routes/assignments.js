const express = require('express');
const router = express.Router();
const Assignment = require('../src/models/Assignment');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../src/models/User'); // Add this line

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/assignments';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.docx', '.ppt', '.pptx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and PPT files are allowed.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Create a new assignment (Teacher only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    // Log the received data
    console.log('Creating assignment with data:', req.body);

    // Validate required fields
    const { title, description, dueDate, studentId } = req.body;
    if (!title || !description || !dueDate || !studentId) {
      console.log('Missing required fields:', {
        title: !!title,
        description: !!description,
        dueDate: !!dueDate,
        studentId: !!studentId
      });
      return res.status(400).json({ 
        message: 'Missing required fields',
        required: ['title', 'description', 'dueDate', 'studentId'],
        received: req.body 
      });
    }

    // Validate student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      console.log('Invalid student ID:', studentId);
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    // Validate date format
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      console.log('Invalid date format:', dueDate);
      return res.status(400).json({ message: 'Invalid date format' });
    }

    const assignment = new Assignment({
      title,
      description,
      dueDate: parsedDate,
      teacherId: req.user._id,
      studentId,
      status: 'pending'
    });

    console.log('Saving assignment:', assignment);
    await assignment.save();
    console.log('Assignment saved successfully');
    
    res.status(201).json(assignment);
  } catch (error) {
    console.error('Assignment creation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: Object.keys(error.errors).reduce((acc, key) => {
          acc[key] = error.errors[key].message;
          return acc;
        }, {})
      });
    }
    res.status(400).json({ 
      message: 'Error creating assignment',
      error: error.message,
      details: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    });
  }
});

// Submit assignment (Student only)
router.post('/:id/submit', auth, upload.single('file'), async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Only students can submit assignments' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.studentId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only submit your own assignments' });
    }

    assignment.submissionType = req.file ? 'file' : 'link';
    assignment.submissionContent = req.file ? req.file.path : req.body.link;
    assignment.fileOriginalName = req.file ? req.file.originalname : null;
    assignment.status = 'submitted';
    assignment.submittedAt = new Date();

    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Review assignment (Teacher only)
router.post('/:id/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can review assignments' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review your own assignments' });
    }

    const { status, mark, feedback, rejectionReason } = req.body;
    
    assignment.status = status;
    assignment.mark = mark;
    assignment.feedback = feedback;
    assignment.rejectionReason = rejectionReason;

    await assignment.save();
    res.json(assignment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all assignments for a teacher
router.get('/teacher', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignments = await Assignment.find({ teacherId: req.user._id })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all assignments for a student
router.get('/student', auth, async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const assignments = await Assignment.find({ studentId: req.user._id })
      .populate('teacherId', 'name email')
      .sort({ createdAt: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('studentId', 'name email');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user has access to this assignment
    if (req.user.role === 'student' && assignment.studentId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (req.user.role === 'teacher' && assignment.teacherId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
