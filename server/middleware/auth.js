const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check if user is logged in (has valid token)
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from request header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }
    const token = authHeader.split(' ')[1];

    // Verify token is valid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user from token
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Attach user info to request so other routes can use it
    req.user = user;
    next(); // Continue to next route
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Check if user is an admin
const adminMiddleware = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next(); // User is admin, allow access
  } else {
    res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
};

module.exports = { authMiddleware, adminMiddleware };

