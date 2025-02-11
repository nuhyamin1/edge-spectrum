const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['file', 'link'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  originalName: String // For files only
});

const assignedStudentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'submitted_late', 'accepted', 'rejected'],
    default: 'pending'
  },
  submissions: [submissionSchema],
  mark: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: String,
  rejectionReason: String,
  submittedAt: Date,
  submissionAttempts: {
    type: Number,
    default: 0
  }
});

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  teacherId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedStudents: [assignedStudentSchema],
  maxFiles: {
    type: Number,
    required: true,
    min: 1
  },
  maxLinks: {
    type: Number,
    required: true,
    min: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
