const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Handle signup request
router.post('/signup', async (req, res) => {
  try {
    // Get user info from request
    const name = req.body.name;
    const email = req.body.email;
    const phoneNumber = req.body.phoneNumber;
    const role = req.body.role;
    const password = req.body.password;

    // Check if all required fields are provided
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Create new user
    const user = new User({
      name: name,
      email: email,
      phoneNumber: phoneNumber || '',
      role: role,
      password: password,
      username: email.split('@')[0] // Use email prefix as username
    });

    await user.save();

    // Send back user info (without password)
    res.status(201).json({
      userId: user._id.toString(),
      email: user.email,
      role: user.role
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Handle login request
router.post('/login', async (req, res) => {
  try {
    // Get email and password from request
    const email = req.body.email;
    const password = req.body.password;

    // Check if both fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email });

    // If user not found
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create a token (like a special ID card for the user)
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' } // Token expires in 24 hours
    );

    // Send back token and user info (matching API contract)
    res.json({
      token: token,
      user: {
        userId: user._id.toString(),
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify if token is valid (returns empty per API contract)
router.get('/verify', async (req, res) => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];

    // Check if token is valid
    jwt.verify(token, process.env.JWT_SECRET);
    
    // Return empty response per API contract
    res.status(200).json({});
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Logout (returns empty per API contract)
router.post('/logout', (req, res) => {
  res.status(200).json({});
});

module.exports = router;

