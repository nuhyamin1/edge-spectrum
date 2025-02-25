const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import User model
const User = require('../models/User');

async function fixImportedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    console.log('Database:', mongoose.connection.name);

    // Get all users
    const users = await User.find().select('+password');
    console.log(`Found ${users.length} users`);

    // Process each user
    for (const user of users) {
      try {
        if (!user.password) {
          console.log(`Skipping user ${user.email} - no password set (might be Google OAuth user)`);
          continue;
        }

        // Check if password is in valid bcrypt format
        const isValidBcrypt = user.password.length === 60 && user.password.startsWith('$2');
        
        if (!isValidBcrypt) {
          console.log(`User ${user.email} has non-bcrypt password. Converting...`);
          
          // Assume the stored password is plain text from import
          const hashedPassword = await bcrypt.hash(user.password, 12);
          
          // Update user with properly hashed password
          await User.updateOne(
            { _id: user._id },
            { 
              $set: { 
                password: hashedPassword,
                isEmailVerified: true // Ensure imported users are marked as verified
              } 
            }
          );
          
          console.log(`Fixed password format for user ${user.email}`);
        } else {
          console.log(`Password already in correct format for user ${user.email}`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }

    console.log('Finished fixing imported users');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixImportedUsers();
