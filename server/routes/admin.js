const express = require('express');
const Component = require('../models/Component');
const BorrowingRecord = require('../models/BorrowingRecord');
const ProcurementRequest = require('../models/ProcurementRequest');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

// Generate unique component ID
function generateComponentId() {
  return 'COMP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// Generate unique procurement request ID
function generateRequestId() {
  return 'REQ-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
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
    const components = await Component.find().select('componentId name category description totalQuantity availableQuantity threshold tags');
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
    if (req.body.name !== undefined) component.name = req.body.name;
    if (req.body.category !== undefined) component.category = req.body.category;
    if (req.body.description !== undefined) component.description = req.body.description;
    if (req.body.tags !== undefined) component.tags = req.body.tags;
    if (req.body.totalQuantity !== undefined) {
      const newTotalQuantity = parseInt(req.body.totalQuantity);
      if (newTotalQuantity >= 0) {
        // Adjust availableQuantity proportionally if totalQuantity changes
        const oldTotalQuantity = component.totalQuantity || 1;
        const ratio = newTotalQuantity / oldTotalQuantity;
        component.totalQuantity = newTotalQuantity;
        component.availableQuantity = Math.round(component.availableQuantity * ratio);
      }
    }
    if (req.body.availableQuantity !== undefined) {
      const newAvailableQuantity = parseInt(req.body.availableQuantity);
      if (newAvailableQuantity >= 0 && newAvailableQuantity <= component.totalQuantity) {
        component.availableQuantity = newAvailableQuantity;
      }
    }
    if (req.body.threshold !== undefined) {
      const newThreshold = parseInt(req.body.threshold);
      if (newThreshold >= 0) {
        component.threshold = newThreshold;
      }
    }
    if (req.body.condition !== undefined) {
      component.condition = req.body.condition;
    }
    if (req.body.datasheetLink !== undefined) component.datasheetLink = req.body.datasheetLink;
    if (req.body.remarks !== undefined) component.remarks = req.body.remarks;
    if (req.body.purchaseDate !== undefined) {
      component.purchaseDate = req.body.purchaseDate ? new Date(req.body.purchaseDate) : null;
    }

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

// Get all borrowing records (for admin)
// GET /api/admin/borrowing-records
router.get('/borrowing-records', async (req, res) => {
  try {
    const records = await BorrowingRecord.find().sort({ borrowDate: -1 });
    res.json(records);
  } catch (error) {
    console.error('Get borrowing records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get dashboard statistics
// GET /api/admin/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    // Get all components
    const allComponents = await Component.find();
    const totalComponents = allComponents.length;
    const availableComponents = allComponents.reduce((sum, comp) => sum + (comp.availableQuantity || 0), 0);
    
    // Calculate low stock alerts (components where availableQuantity <= threshold)
    const lowStockComponents = allComponents.filter(comp => 
      comp.availableQuantity <= comp.threshold
    );
    const lowStockAlerts = lowStockComponents.length;

    // Get all borrowing records
    const allBorrows = await BorrowingRecord.find();
    
    // Active borrows (status is 'borrowed')
    const activeBorrows = allBorrows.filter(record => record.status === 'borrowed');
    const activeBorrowsCount = activeBorrows.length;

    // Overdue items (status is 'borrowed' and expectedReturnDate < today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueItems = activeBorrows.filter(record => {
      const expectedDate = new Date(record.expectedReturnDate);
      expectedDate.setHours(0, 0, 0, 0);
      return expectedDate < today;
    });
    const overdueItemsCount = overdueItems.length;

    // Calculate efficiency rate (percentage of components available)
    // Formula: (total available quantity / total quantity) * 100
    const totalQuantity = allComponents.reduce((sum, comp) => sum + (comp.totalQuantity || 0), 0);
    const efficiencyRate = totalQuantity > 0 
      ? Math.round((availableComponents / totalQuantity) * 100) 
      : 100;

    // Calculate category distribution
    const categoryMap = {};
    allComponents.forEach(comp => {
      const category = comp.category || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
    }));

    res.json({
      totalComponents,
      availableComponents,
      activeBorrows: activeBorrowsCount,
      overdueItems: overdueItemsCount,
      lowStockAlerts,
      efficiencyRate,
      categoryData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get urgent actions (overdue items and low stock alerts)
// GET /api/admin/dashboard/urgent-actions
router.get('/dashboard/urgent-actions', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get overdue items
    const overdueRecords = await BorrowingRecord.find({
      status: 'borrowed',
      expectedReturnDate: { $lt: today }
    }).sort({ expectedReturnDate: 1 }).limit(5);

    const overdueItems = overdueRecords.map(record => ({
      recordId: record.recordId,
      componentName: record.componentName,
      userId: record.userId,
      expectedReturnDate: record.expectedReturnDate,
      daysOverdue: Math.floor((today - new Date(record.expectedReturnDate)) / (1000 * 60 * 60 * 24))
    }));

    // Get low stock components
    const lowStockComponents = await Component.find({
      $expr: { $lte: ['$availableQuantity', '$threshold'] }
    }).sort({ availableQuantity: 1 }).limit(5);

    const procurementAlerts = lowStockComponents.map(comp => ({
      componentId: comp.componentId,
      componentName: comp.name,
      availableQuantity: comp.availableQuantity,
      threshold: comp.threshold,
      category: comp.category
    }));

    res.json({
      overdueItems,
      procurementAlerts
    });
  } catch (error) {
    console.error('Urgent actions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new procurement request
// POST /api/admin/procurement
router.post('/procurement', async (req, res) => {
  try {
    const { itemName, quantity, priority, componentId, category, description, remarks } = req.body;

    if (!itemName || !quantity) {
      return res.status(400).json({ message: 'Item name and quantity are required' });
    }

    if (quantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
    const requestPriority = priority && validPriorities.includes(priority.toUpperCase()) 
      ? priority.toUpperCase() 
      : 'MEDIUM';

    const request = new ProcurementRequest({
      requestId: generateRequestId(),
      itemName: itemName.trim(),
      quantity: parseInt(quantity),
      priority: requestPriority,
      status: 'PENDING',
      componentId: componentId || null,
      category: category || '',
      description: description || '',
      remarks: remarks || ''
    });

    await request.save();

    res.json({
      _id: request._id,
      requestId: request.requestId,
      itemName: request.itemName,
      quantity: request.quantity,
      priority: request.priority,
      status: request.status,
      componentId: request.componentId,
      category: request.category
    });
  } catch (error) {
    console.error('Create procurement request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get procurement analysis and auto-generated list
// GET /api/admin/procurement
router.get('/procurement', async (req, res) => {
  try {
    // Get manually created procurement requests
    const manualRequests = await ProcurementRequest.find({ status: 'PENDING' }).sort({ createdAt: -1 });
    
    // Get auto-generated requests from low stock components
    const lowStockComponents = await Component.find({
      $expr: { $lte: ['$availableQuantity', '$threshold'] }
    });

    // Create a map of componentIds that already have manual requests
    const componentIdsWithRequests = new Set(
      manualRequests
        .filter(req => req.componentId)
        .map(req => req.componentId)
    );

    // Only generate auto-requests for components that don't already have manual requests
    const autoRequests = lowStockComponents
      .filter(comp => !componentIdsWithRequests.has(comp.componentId))
      .map(comp => ({
        _id: comp._id,
        componentId: comp.componentId,
        itemName: comp.name,
        quantity: Math.max(comp.threshold - comp.availableQuantity + 5, 1), // Add buffer, minimum 1
        priority: comp.availableQuantity <= 2 ? 'HIGH' : comp.availableQuantity <= comp.threshold ? 'MEDIUM' : 'LOW',
        status: 'PENDING',
        isAutoGenerated: true
      }));

    // Format manual requests with all details
    const formattedManualRequests = manualRequests.map(req => ({
      _id: req._id,
      requestId: req.requestId,
      componentId: req.componentId,
      itemName: req.itemName,
      quantity: req.quantity,
      priority: req.priority,
      status: req.status,
      category: req.category,
      description: req.description || '',
      remarks: req.remarks || '',
      requestedBy: req.requestedBy || 'admin',
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      isAutoGenerated: false
    }));

    // Combine both types of requests
    const allRequests = [...formattedManualRequests, ...autoRequests];

    res.json(allRequests);
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

