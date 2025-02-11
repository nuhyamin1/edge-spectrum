const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'teacher'], default: 'student' },
  aboutMe: String,
  profilePicture: {
    data: String,  // Base64 string
    contentType: String  // MIME type (e.g., 'image/jpeg', 'image/png')
  },
  isEmailVerified: { type: Boolean, default: false },
  verificationToken: String,
  verificationTokenExpires: Date,
  profileFields: {
    github: String,
    linkedin: String,
    twitter: String,
    facebook: String,
    instagram: String
  },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Add comparePassword method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Export the model if it hasn't been compiled yet, otherwise export the existing model
module.exports = mongoose.models.User || mongoose.model('User', userSchema);
