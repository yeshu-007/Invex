const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Chatbot route requires authentication
router.use(authMiddleware);

// Send query to chatbot with database context
router.post('/query', async (req, res) => {
  try {
    const query = req.body.query || req.body.message || '';

    // This would integrate with a chatbot service (like OpenAI, Gemini, etc.)
    // For now, return empty response per API contract
    res.status(200).json({});
  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

