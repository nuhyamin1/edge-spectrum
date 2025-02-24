const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

const MONGODB_URI = 'mongodb://127.0.0.1:27017/learning_platform';

const createAdmin = async () => {
  try {
    console.log('MongoDB URI:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Log existing users
    const users = await User.find({});
    console.log('Existing users:', users.map(u => ({email: u.email, role: u.role, isAdmin: u.isAdmin})));

    const adminData = {
      name: 'Admin',
      email: 'admin@eduflow.com',
      password: 'Admin@123456',
      role: 'admin',
      isAdmin: true,
      isEmailVerified: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    console.log('Existing admin:', existingAdmin);
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create new admin user
    const admin = new User(adminData);
    
    // Log pre-save password
    console.log('Pre-save password hash:', admin.password);
    
    await admin.save();
    
    // Log post-save password
    const savedAdmin = await User.findOne({ email: adminData.email }).select('+password');
    console.log('Post-save password hash:', savedAdmin.password);
    
    // Verify the admin was created
    const createdAdmin = await User.findOne({ email: adminData.email }).select('+password');
    console.log('Created admin:', {
      email: createdAdmin.email,
      role: createdAdmin.role,
      isAdmin: createdAdmin.isAdmin,
      hasPassword: !!createdAdmin.password
    });

    console.log('Admin user created successfully');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdmin();
