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
}).array('files', 10); // Allow up to 10 files

// Create a new assignment (Teacher only)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can create assignments' });
    }

    const { title, description, dueDate, studentId, maxFiles, maxLinks, assignToAll } = req.body;
    
    // Add validation for maxFiles and maxLinks
    if (!maxFiles || !maxLinks) {
      return res.status(400).json({ message: 'Please specify maximum number of files and links allowed' });
    }

    // Validate date format
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      console.log('Invalid date format:', dueDate);
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (assignToAll) {
      // Get all students
      const students = await User.find({ role: 'student' });
      
      if (students.length === 0) {
        return res.status(400).json({ message: 'No students found in the system' });
      }
      
      // Create assignments for all students
      const assignmentPromises = students.map(student => {
        const assignment = new Assignment({
          title,
          description,
          dueDate: parsedDate,
          teacherId: req.user._id,
          studentId: student._id,
          maxFiles: parseInt(maxFiles),
          maxLinks: parseInt(maxLinks),
          status: 'pending'
        });
        return assignment.save();
      });

      await Promise.all(assignmentPromises);
      res.status(201).json({ message: 'Assignments created for all students' });
    } else {
      // Validate student exists for individual assignment
      if (!studentId) {
        return res.status(400).json({ message: 'Please select a student' });
      }

      const student = await User.findById(studentId);
      if (!student || student.role !== 'student') {
        console.log('Invalid student ID:', studentId);
        return res.status(400).json({ message: 'Invalid student ID' });
      }

      // Create assignment for individual student
      const assignment = new Assignment({
        title,
        description,
        dueDate: parsedDate,
        teacherId: req.user._id,
        studentId,
        maxFiles: parseInt(maxFiles),
        maxLinks: parseInt(maxLinks),
        status: 'pending'
      });

      console.log('Saving assignment:', assignment);
      await assignment.save();
      console.log('Assignment saved successfully');
      
      res.status(201).json(assignment);
    }
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
router.post('/:id/submit', auth, async (req, res) => {
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

    // Handle file uploads
    upload(req, res, async (err) => {
      if (err) {
        return res.status(400).json({ message: err.message });
      }

      const submissions = [];

      // Handle files
      if (req.files && req.files.length > 0) {
        if (req.files.length > assignment.maxFiles) {
          return res.status(400).json({ message: `Maximum ${assignment.maxFiles} files allowed` });
        }

        req.files.forEach(file => {
          submissions.push({
            type: 'file',
            content: file.path,
            originalName: file.originalname
          });
        });
      }

      // Handle links
      const links = JSON.parse(req.body.links || '[]');
      if (links.length > assignment.maxLinks) {
        return res.status(400).json({ message: `Maximum ${assignment.maxLinks} links allowed` });
      }

      links.forEach(link => {
        submissions.push({
          type: 'link',
          content: link
        });
      });

      assignment.submissions = submissions;
      assignment.status = 'submitted';
      assignment.submittedAt = new Date();
      assignment.submissionAttempts += 1;

      await assignment.save();
      res.json(assignment);
    });
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

// Add this new route before module.exports
router.get('/:id/download', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (req.user.role !== 'teacher' || assignment.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    if (assignment.submissionType !== 'file' || !assignment.submissionContent) {
      return res.status(400).json({ message: 'No file submission available' });
    }

    const filePath = path.join(__dirname, '../../', assignment.submissionContent);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, assignment.fileOriginalName, (err) => {
      if (err) {
        console.error('Download error:', err);
        res.status(500).json({ message: 'Error downloading file' });
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new route for downloading multiple files
router.get('/:id/download/:submissionIndex', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submission = assignment.submissions[req.params.submissionIndex];
    if (!submission || submission.type !== 'file') {
      return res.status(404).json({ message: 'File not found' });
    }

    const filePath = path.join(__dirname, '../../', submission.content);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, submission.originalName);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete assignment (Teacher only)
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can delete assignments' });
    }

    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (assignment.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own assignments' });
    }

    // Delete associated file if exists
    if (assignment.submissionType === 'file' && assignment.submissionContent) {
      const filePath = path.join(__dirname, '../../', assignment.submissionContent);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await assignment.deleteOne();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
