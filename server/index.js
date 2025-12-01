// Import required packages
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/student');
const chatbotRoutes = require('./routes/chatbot');
const generalRoutes = require('./routes/general');

// Create Express app
const app = express();

// Allow React app (running on port 3000) to talk to this server
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight requests (browser checks before sending real request)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// Also use cors package for extra safety
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// Allow server to read JSON from requests
app.use(express.json());

// Connect to MongoDB database
mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log('Connected to MongoDB Atlas');
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
});

// Use all routes
app.use('/auth', authRoutes); // Signup route
app.use('/api/auth', authRoutes); // Login, logout, verify routes
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/components', generalRoutes);

// Simple test route to check if server is working
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Start the server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

