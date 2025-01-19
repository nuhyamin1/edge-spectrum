const mongoose = require('mongoose');
const Session = require('../models/Session');
require('dotenv').config();

async function updateSessions() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update all sessions without a status to have 'scheduled' status
        const result = await Session.updateMany(
            { status: { $exists: false } },
            { $set: { status: 'scheduled' } }
        );

        console.log(`Updated ${result.modifiedCount} sessions`);
        process.exit(0);
    } catch (error) {
        console.error('Error updating sessions:', error);
        process.exit(1);
    }
}

updateSessions();
