const express = require('express');
const Component = require('../models/Component');
const BorrowingRecord = require('../models/BorrowingRecord');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Generate unique component ID
function generateComponentId() {
  return 'COMP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Add a component
router.post('/components', async (req, res) => {
  try {
    const name = req.body.name;
    const category = req.body.category;
    const totalQuantity = req.body.totalQuantity || 0;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    const component = new Component({
      componentId: generateComponentId(),
      name: name,
      category: category,
      description: req.body.description || '',
      totalQuantity: totalQuantity,
      availableQuantity: totalQuantity,
      threshold: req.body.threshold || 5,
      tags: req.body.tags || [],
      datasheetLink: req.body.datasheetLink || '',
      purchaseDate: req.body.purchaseDate ? new Date(req.body.purchaseDate) : null,
      condition: req.body.condition || 'good',
      remarks: req.body.remarks || ''
    });

    await component.save();

    res.json({ componentId: component.componentId });
  } catch (error) {
    console.error('Add component error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all components
router.get('/components', async (req, res) => {
  try {
    const components = await Component.find().select('componentId name');
    res.json(components);
  } catch (error) {
    console.error('Get components error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get component details
router.get('/components/:componentId', async (req, res) => {
  try {
    const componentId = req.params.componentId;
    const component = await Component.findOne({ componentId: componentId });

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    res.json({
      componentId: component.componentId,
      name: component.name,
      category: component.category,
      description: component.description,
      totalQuantity: component.totalQuantity,
      availableQuantity: component.availableQuantity,
      threshold: component.threshold,
      tags: component.tags,
      datasheetLink: component.datasheetLink,
      purchaseDate: component.purchaseDate,
      condition: component.condition,
      remarks: component.remarks
    });
  } catch (error) {
    console.error('Get component error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update component
// PUT /api/admin/components/:componentId
router.put('/components/:componentId', async (req, res) => {
  try {
    const componentId = req.params.componentId;
    const component = await Component.findOne({ componentId: componentId });

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Update fields if provided
    if (req.body.name) component.name = req.body.name;
    if (req.body.category) component.category = req.body.category;
    if (req.body.description !== undefined) component.description = req.body.description;
    if (req.body.tags) component.tags = req.body.tags;

    await component.save();

    res.json({ message: 'updated' });
  } catch (error) {
    console.error('Update component error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete component
// DELETE /api/admin/components/:componentId
router.delete('/components/:componentId', async (req, res) => {
  try {
    const componentId = req.params.componentId;
    const component = await Component.findOneAndDelete({ componentId: componentId });

    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    res.json({ message: 'deleted' });
  } catch (error) {
    console.error('Delete component error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get procurement analysis and auto-generated list
// GET /api/admin/procurement
router.get('/procurement', async (req, res) => {
  try {
    // Simple analysis: components with availableQuantity < threshold (default < 5)
    const lowStockComponents = await Component.find({
      $expr: { $lte: ['$availableQuantity', '$threshold'] }
    });

    const generated = lowStockComponents.map(comp => ({
      componentId: comp.componentId,
      requiredQuantity: comp.threshold - comp.availableQuantity + 5 // Add buffer
    }));

    // NOTE: In a real app, you could send this data to Gemini for smarter suggestions.
    res.json({ generated: generated });
  } catch (error) {
    console.error('Procurement generate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk upload components via CSV
// POST /api/admin/components/upload
router.post('/components/upload', async (req, res) => {
  try {
    // CSV parsing would require multer and csv-parser packages
    // For now, return empty response per API contract
    res.status(200).json({});
  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

