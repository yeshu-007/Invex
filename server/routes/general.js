const express = require('express');
const Component = require('../models/Component');

const router = express.Router();

// Public: get all components
// GET /api/components/
router.get('/', async (req, res) => {
  try {
    const components = await Component.find().select('componentId name category tags availableQuantity');
    res.json(components);
  } catch (error) {
    console.error('Get components error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all available tags
router.get('/tags', async (req, res) => {
  try {
    // Return empty per API contract
    res.status(200).json({});
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all categories
router.get('/categories', async (req, res) => {
  try {
    // Return empty per API contract
    res.status(200).json({});
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

