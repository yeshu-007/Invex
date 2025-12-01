const express = require('express');
const Component = require('../models/Component');
const BorrowingRecord = require('../models/BorrowingRecord');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// All student routes require authentication
router.use(authMiddleware);

// Generate unique record ID
function generateRecordId() {
  return 'REC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Borrow a component
router.post('/borrow', async (req, res) => {
  try {
    const userId = req.body.userId;
    const componentId = req.body.componentId;
    const quantity = req.body.quantity || 1;
    const expectedReturnDate = req.body.expectedReturnDate;

    if (!userId || !componentId || !expectedReturnDate) {
      return res.status(400).json({ message: 'userId, componentId, and expectedReturnDate are required' });
    }

    // Find component
    const component = await Component.findOne({ componentId: componentId });
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Check if enough quantity available
    if (component.availableQuantity < quantity) {
      return res.status(400).json({ message: 'Not enough quantity available' });
    }

    // Create borrowing record
    const record = new BorrowingRecord({
      recordId: generateRecordId(),
      userId: userId,
      componentId: componentId,
      componentName: component.name,
      quantity: quantity,
      expectedReturnDate: new Date(expectedReturnDate),
      status: 'borrowed'
    });

    await record.save();

    // Update component available quantity
    component.availableQuantity -= quantity;
    await component.save();

    res.json({
      recordId: record.recordId,
      status: 'borrowed'
    });
  } catch (error) {
    console.error('Borrow error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Return a component
// POST /api/student/components/:componentId/return
router.post('/components/:componentId/return', async (req, res) => {
  try {
    const recordId = req.body.recordId || req.query.recordId;
    const quantity = req.body.quantity || 1;

    if (!recordId) {
      return res.status(400).json({ message: 'recordId is required' });
    }

    // Find borrowing record
    const record = await BorrowingRecord.findOne({ recordId: recordId });
    if (!record) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    if (record.status === 'returned') {
      return res.status(400).json({ message: 'Component already returned' });
    }

    // Update record
    record.status = 'returned';
    record.actualReturnDate = new Date();
    await record.save();

    // Update component available quantity
    const component = await Component.findOne({ componentId: record.componentId });
    if (component) {
      component.availableQuantity += quantity;
      await component.save();
    }

    res.json({
      recordId: record.recordId,
      status: 'returned'
    });
  } catch (error) {
    console.error('Return error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search components by name/tag
// GET /api/student/components?tag=...
router.get('/components', async (req, res) => {
  try {
    const query = req.query.q || req.query.query || req.query.name || '';
    const tag = req.query.tag || '';

    let searchQuery = {};

    if (query) {
      searchQuery.name = { $regex: query, $options: 'i' }; // Case-insensitive search
    }

    if (tag) {
      searchQuery.tags = { $in: [tag] };
    }

    const components = await Component.find(searchQuery).select('componentId name category tags availableQuantity');

    // Return empty array per API contract if no results
    res.json(components || []);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload image for Gemini identification (placeholder)
// GET /api/student/components/identify
router.get('/components/identify', async (req, res) => {
  try {
    // This would integrate with Google Gemini API
    // For now, return empty response per API contract
    res.status(200).json({});
  } catch (error) {
    console.error('Identify component error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Suggest components by tags
router.get('/recommendations', async (req, res) => {
  try {
    // For GET requests, tags come from query params
    let tags = [];
    if (req.query.tags) {
      // If tags is a string, parse it as JSON or split by comma
      if (typeof req.query.tags === 'string') {
        try {
          tags = JSON.parse(req.query.tags);
        } catch (e) {
          tags = req.query.tags.split(',');
        }
      } else if (Array.isArray(req.query.tags)) {
        tags = req.query.tags;
      }
    }

    if (!Array.isArray(tags) || tags.length === 0) {
      return res.json([]);
    }

    // Find components that match any of the tags
    const components = await Component.find({
      tags: { $in: tags }
    });

    // Calculate match score (number of matching tags)
    const recommendations = components.map(comp => {
      const matchScore = tags.filter(tag => comp.tags.includes(tag)).length;
      return {
        componentId: comp.componentId,
        name: comp.name,
        matchScore: matchScore
      };
    });

    // Sort by match score (highest first)
    recommendations.sort((a, b) => b.matchScore - a.matchScore);

    res.json(recommendations);
  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

