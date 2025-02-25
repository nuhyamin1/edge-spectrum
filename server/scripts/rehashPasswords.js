const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Import User model
const User = require('../models/User');

async function rehashPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

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

        // Check if password is already hashed
        const isHashed = user.password.length === 60 && user.password.startsWith('$2');
        
        if (!isHashed) {
          // Hash the plain text password
          const hashedPassword = await bcrypt.hash(user.password, 12);
          
          // Update user with hashed password
          await User.updateOne(
            { _id: user._id },
            { $set: { password: hashedPassword } }
          );
          
          console.log(`Rehashed password for user ${user.email}`);
        } else {
          console.log(`Password already hashed for user ${user.email}`);
        }
      } catch (error) {
        console.error(`Error processing user ${user.email}:`, error);
      }
    }

    console.log('Password rehashing complete');
  } catch (error) {
    console.error('Script error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

rehashPasswords();
