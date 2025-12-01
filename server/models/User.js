const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Define what a User looks like in the database
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student', 'faculty'],
    default: 'admin'
  },
  name: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  userId: {
    type: String,
    unique: true,
    sparse: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Before saving user, automatically hash the password
userSchema.pre('save', async function() {
  // Only hash if password was changed
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Function to check if password is correct
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Export the User model so we can use it in other files
module.exports = mongoose.model('User', userSchema);

