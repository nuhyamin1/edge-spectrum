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

    let assignedStudents = [];

    if (assignToAll) {
      // Get all students
      const students = await User.find({ role: 'student' });
      
      if (students.length === 0) {
        return res.status(400).json({ message: 'No students found in the system' });
      }
      
      assignedStudents = students.map(student => ({
        studentId: student._id,
        status: 'pending'
      }));
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

      assignedStudents = [{
        studentId: student._id,
        status: 'pending'
      }];
    }

    // Create one assignment with all assigned students
    const assignment = new Assignment({
      title,
      description,
      dueDate: parsedDate,
      teacherId: req.user._id,
      assignedStudents,
      maxFiles: parseInt(maxFiles),
      maxLinks: parseInt(maxLinks)
    });

    await assignment.save();
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
    res.status(400).json({ message: 'Error creating assignment' });
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

    const student = assignment.assignedStudents.find(
      student => student.studentId.toString() === req.user._id.toString()
    );

    if (!student) {
      return res.status(403).json({ message: 'You are not assigned to this assignment' });
    }

    // Check if submission is late
    const isLate = new Date() > new Date(assignment.dueDate);

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

      student.submissions = submissions;
      student.status = 'submitted';
      student.submittedAt = new Date();
      student.submissionAttempts += 1;
      student.mark = null;
      student.feedback = '';
      student.rejectionReason = '';

      // Add late flag to submission if it's late
      if (isLate) {
        student.status = 'submitted_late';
      }

      await assignment.save();
      res.json({ message: 'Assignment submitted successfully', isLate });
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Error submitting assignment' });
  }
});

// Review assignment (Teacher only)
router.post('/:id/review', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can review assignments' });
    }

    const { status, mark, feedback, rejectionReason, studentId } = req.body;
    
    // Update using findOneAndUpdate to ensure atomic operation
    const updatedAssignment = await Assignment.findOneAndUpdate(
      {
        _id: req.params.id,
        'assignedStudents.studentId': studentId
      },
      {
        $set: {
          'assignedStudents.$.status': status,
          'assignedStudents.$.mark': mark,
          'assignedStudents.$.feedback': feedback,
          'assignedStudents.$.rejectionReason': rejectionReason
        }
      },
      { new: true }
    );

    if (!updatedAssignment) {
      return res.status(404).json({ message: 'Assignment or student not found' });
    }

    console.log('Server: Updated assignment:', JSON.stringify(updatedAssignment, null, 2));
    res.json(updatedAssignment);
  } catch (error) {
    console.error('Review error:', error);
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
      .populate('assignedStudents.studentId', 'name email')
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

    const assignments = await Assignment.find({
      'assignedStudents.studentId': req.user._id
    }).populate('teacherId', 'name email');

    // Log the assignments before sending
    console.log('Server: Found assignments for student:', req.user._id);
    console.log('Server: Assignments data:', JSON.stringify(assignments, null, 2));

    res.json(assignments);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get a specific assignment
router.get('/:id', auth, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacherId', 'name email')
      .populate('assignedStudents.studentId', 'name email');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user has access to this assignment
    if (req.user.role === 'student' && !assignment.assignedStudents.find(student => student.studentId.toString() === req.user._id.toString())) {
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

// Get assignment details with student submissions (Teacher only)
router.get('/:id/details', auth, async (req, res) => {
  try {
    if (req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Only teachers can view assignment details' });
    }

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacherId: req.user._id
    }).populate([
      {
        path: 'assignedStudents.studentId',
        select: 'name email profilePicture.data'
      },
      {
        path: 'teacherId',
        select: 'name email'
      }
    ]);

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Format the response
    const response = {
      _id: assignment._id,
      title: assignment.title,
      description: assignment.description,
      dueDate: assignment.dueDate,
      maxFiles: assignment.maxFiles,
      maxLinks: assignment.maxLinks,
      teacherId: assignment.teacherId,
      submissions: assignment.assignedStudents.map(student => ({
        _id: student._id,
        student: {
          _id: student.studentId._id,
          name: student.studentId.name,
          email: student.studentId.email,
          profilePicture: student.studentId.profilePicture
        },
        status: student.status,
        mark: student.mark,
        feedback: student.feedback,
        rejectionReason: student.rejectionReason,
        submissions: student.submissions,
        submittedAt: student.submittedAt
      }))
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching assignment details:', error);
    res.status(500).json({ message: 'Error fetching assignment details' });
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

    const assignedStudent = assignment.assignedStudents.find(student => student.submissions && student.submissions.length > 0);
    if (!assignedStudent) {
      return res.status(400).json({ message: 'No file submission available' });
    }

    const submission = assignedStudent.submissions[0];
    const filePath = path.join(__dirname, '../../', submission.content);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filePath, submission.originalName, (err) => {
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

    const assignedStudent = assignment.assignedStudents.find(student => student.submissions && student.submissions.length > 0);
    if (!assignedStudent) {
      return res.status(404).json({ message: 'No file submission available' });
    }

    const submission = assignedStudent.submissions[req.params.submissionIndex];
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

    // Delete associated files if exists
    assignment.assignedStudents.forEach(student => {
      student.submissions.forEach(submission => {
        if (submission.type === 'file' && submission.content) {
          const filePath = path.join(__dirname, '../../', submission.content);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    });

    await assignment.deleteOne();
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
