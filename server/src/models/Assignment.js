const mongoose = require('mongoose');

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
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  maxFiles: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  maxLinks: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'accepted', 'rejected'],
    default: 'pending'
  },
  submissions: [{
    type: {
      type: String,
      enum: ['file', 'link'],
      required: true
    },
    content: {
      type: String,  // File path or link URL
      required: true
    },
    originalName: String, // For files only
    submittedAt: {
      type: Date,
      default: Date.now
    }
  }],
  mark: {
    type: Number,
    min: 0,
    max: 100,
    required: false
  },
  feedback: {
    type: String,
    required: false
  },
  rejectionReason: {
    type: String,
    required: false
  },
  submittedAt: {
    type: Date,
    default: null
  },
  submissionAttempts: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
