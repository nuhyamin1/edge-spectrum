const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const User = require('../models/User');
const axios = require('axios');

// Debug database connection
console.log('Database connection state:', mongoose.connection.readyState);
console.log('Database name:', mongoose.connection.name);

// Email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    console.log('Registration request received for:', email);

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create verification token
    const verificationToken = jwt.sign(
      { email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Created verification token for:', email);

    // Create new user
    user = new User({
      name,
      email,
      password,
      role,
      authProvider: 'local', // Set auth provider to local for email registration
      verificationToken,
      verificationTokenExpires: Date.now() + 3600000 // 1 hour
    });

    console.log('Attempting to save user to database:', {
      name,
      email,
      role,
      dbConnection: mongoose.connection.name
    });

    await user.save();
    
    // Verify the user was saved
    const savedUser = await User.findOne({ email });
    console.log('User saved successfully:', savedUser ? 'Yes' : 'No');
    if (!savedUser) {
      throw new Error('User was not saved to database');
    }

    // Send verification email
    const verificationUrl = `${process.env.CLIENT_URL}/verify/${verificationToken}`;
    console.log('Verification URL:', verificationUrl);
    
    const mailOptions = {
      to: email,
      subject: 'Email Verification',
      html: `
        <h2>Welcome to PF Speaking Master!</h2>
        <p>Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>Or copy and paste this link in your browser:</p>
        <p>${verificationUrl}</p>
        <p>This link will expire in 1 hour.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Verification email sent to:', email);

    res.status(201).json({
      message: 'Registration successful. Please check your email for verification.'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

    // Verify Email
router.get('/verify/:token', async (req, res) => {
  console.log('Starting email verification process');
  try {
    const { token } = req.params;
    console.log('Verification endpoint hit with token:', token);
    console.log('Current database:', mongoose.connection.name);
    console.log('Database state:', mongoose.connection.readyState);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded token:', decoded);

    let user;
    try {
      user = await User.findOne({
        email: decoded.email,
        verificationToken: token,
        verificationTokenExpires: { $gt: Date.now() }
      });
      console.log('Found user:', user ? {
        email: user.email,
        tokenMatch: user.verificationToken === token,
        tokenExpired: user.verificationTokenExpires < Date.now()
      } : 'No user found');
    } catch (dbError) {
      console.error('Database error during verification:', dbError);
      throw dbError;
    }

    if (!user) {
      console.log('User not found or token expired');
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();
    console.log('User verified successfully');

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for:', email);

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    console.log('Found user:', user ? {
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      hasPassword: !!user.password
    } : null);

    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password incorrect');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    // Create token with user ID and role
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove sensitive data before sending response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      aboutMe: user.aboutMe
    };

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Google OAuth
router.post('/google', async (req, res) => {
  try {
    const { email, name, picture, role } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });

    if (user) {
      // Update auth provider if user exists but was created with email
      if (user.authProvider === 'local') {
        user.authProvider = 'google';
        await user.save();
      }
      // Generate JWT token
      const jwtToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token: jwtToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
          aboutMe: user.aboutMe
        }
      });
    }

    // Create new user for Google OAuth
    user = new User({
      name,
      email,
      role: role || 'student',
      profilePicture: {
        data: picture,
        contentType: 'image/jpeg'
      },
      isEmailVerified: true, // Google accounts are already verified
      authProvider: 'google' // Set auth provider to google
    });

    console.log('Creating new Google OAuth user:', {
      name,
      email,
      role: role || 'student',
      authProvider: 'google'
    });

    await user.save();
    console.log('Google OAuth user saved successfully');

    // Generate JWT token
    const jwtToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token: jwtToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        aboutMe: user.aboutMe
      }
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
