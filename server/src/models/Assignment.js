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
  status: {
    type: String,
    enum: ['pending', 'submitted', 'accepted', 'rejected'],
    default: 'pending'
  },
  submissionType: {
    type: String,
    enum: ['file', 'link'],
    required: function() {
      // Only required if status is 'submitted'
      return this.status === 'submitted';
    }
  },
  submissionContent: {
    type: String,  // File path or link URL
    required: function() {
      // Only required if status is 'submitted'
      return this.status === 'submitted';
    }
  },
  fileOriginalName: {
    type: String,
    required: false
  },
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
  }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
