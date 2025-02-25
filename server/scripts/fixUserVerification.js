const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import User model
const User = require('../models/User');

async function fixUserVerification() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all users to be verified
    const result = await User.updateMany(
      { isEmailVerified: false }, 
      { 
        $set: { 
          isEmailVerified: true,
          verificationToken: undefined,
          verificationTokenExpires: undefined
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users to verified status`);
    
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixUserVerification();
