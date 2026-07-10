const mongoose = require('mongoose');

const studentGradeSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GradeSubject',
    required: true
  },
  grades: [{
    columnId: { type: String, required: true }, // Links to a column in GradeSubject.columns
    score: { type: Number, min: 0, max: 100 },
    feedback: { type: String, default: '' }
  }]
}, { timestamps: true });

// Ensure compound index for uniqueness: one grade doc per student per subject
studentGradeSchema.index({ student: 1, subject: 1 }, { unique: true });

module.exports = mongoose.model('StudentGrade', studentGradeSchema);
