const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function fixDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Drop the existing sessions collection
        await mongoose.connection.db.dropCollection('sessions');
        console.log('Dropped sessions collection');

        // Drop any existing indexes on the sessions collection
        const Session = require('../models/Session');
        await Session.collection.dropIndexes();
        console.log('Dropped all indexes on sessions collection');

        console.log('Database fix completed successfully');
    } catch (error) {
        console.error('Error fixing database:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

fixDatabase();
