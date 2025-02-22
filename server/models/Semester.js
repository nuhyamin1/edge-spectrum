const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true
    },
    term: {
        type: String,
        enum: ['January-June', 'July-December'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique year-term combinations
semesterSchema.index({ year: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Semester', semesterSchema); 