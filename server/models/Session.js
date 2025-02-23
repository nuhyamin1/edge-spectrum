const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    semester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Semester',
        required: true
    },
    originalSession: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Session'
    },
    dateTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number,  // in minutes
        required: true
    },
    gracePeriod: {
        type: Number,  // in minutes
        required: true
    },
    materials: {
        type: String,
        trim: true
    },
    externalLinks: [{
        title: {
            type: String,
            required: true,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        }
    }],
    files: [{
        filename: {
            type: String,
            required: true
        },
        originalname: {
            type: String,
            required: true
        },
        path: {
            type: String,
            required: true
        },
        mimetype: {
            type: String,
            required: true
        }
    }],
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    enrolledStudents: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['scheduled', 'active', 'completed'],
        default: 'scheduled'
    },
    startedAt: {
        type: Date
    },
    endedAt: {
        type: Date
    },
    sessionHistory: [{
        semester: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Semester'
        },
        enrolledCount: Number,
        materials: String,
        messages: [{
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            content: String,
            timestamp: Date
        }],
        startedAt: Date,
        endedAt: Date
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

sessionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Session', sessionSchema);
