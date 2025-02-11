require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function cleanUnverifiedUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // First, let's list all unverified users
        const unverifiedUsers = await User.find({ isEmailVerified: false });
        
        console.log('\nUnverified users found:');
        unverifiedUsers.forEach(user => {
            console.log(`- ${user.email} (Registered at: ${user.createdAt})`);
        });

        if (unverifiedUsers.length === 0) {
            console.log('No unverified users found.');
            process.exit(0);
        }

        // Delete unverified users
        const result = await User.deleteMany({ isEmailVerified: false });
        console.log(`\nDeleted ${result.deletedCount} unverified users`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

cleanUnverifiedUsers();
