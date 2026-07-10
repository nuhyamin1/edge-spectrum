const mongoose = require('mongoose');

const gradeSubjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  columns: [{
    name: { type: String, required: true }, // e.g., "Speaking 1", "Speaking 2"
    maxScore: { type: Number, default: 100 }
  }]
}, { timestamps: true });

module.exports = mongoose.model('GradeSubject', gradeSubjectSchema);
