const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const { Readable } = require('stream');
const Component = require('../models/Component');
const BorrowingRecord = require('../models/BorrowingRecord');
const ProcurementRequest = require('../models/ProcurementRequest');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const {
  mapCSVToComponents,
  enrichComponentsWithGemini,
  mapProcurementCSVToRequests,
  enrichProcurementsWithGemini,
} = require('../services/geminiService');

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
    const records = await BorrowingRecord.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (error) {
    console.error('Get borrowing records error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve a borrowing request
// PUT /api/admin/borrowing-records/:recordId/approve
router.put('/borrowing-records/:recordId/approve', async (req, res) => {
  try {
    const recordId = req.params.recordId;
    const record = await BorrowingRecord.findOne({ recordId: recordId });

    if (!record) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    if (record.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be approved' });
    }

    // Find component
    const component = await Component.findOne({ componentId: record.componentId });
    if (!component) {
      return res.status(404).json({ message: 'Component not found' });
    }

    // Check if enough quantity available
    if (component.availableQuantity < record.quantity) {
      return res.status(400).json({ message: 'Not enough quantity available' });
    }

    // Update record status to borrowed
    record.status = 'borrowed';
    record.borrowDate = new Date();
    await record.save();

    // Update component available quantity
    component.availableQuantity -= record.quantity;
    await component.save();

    res.json({
      recordId: record.recordId,
      status: 'borrowed',
      message: 'Borrowing request approved'
    });
  } catch (error) {
    console.error('Approve borrowing request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject a borrowing request
// PUT /api/admin/borrowing-records/:recordId/reject
router.put('/borrowing-records/:recordId/reject', async (req, res) => {
  try {
    const recordId = req.params.recordId;
    const record = await BorrowingRecord.findOne({ recordId: recordId });

    if (!record) {
      return res.status(404).json({ message: 'Borrowing record not found' });
    }

    if (record.status !== 'pending') {
      return res.status(400).json({ message: 'Only pending requests can be rejected' });
    }

    // Update record status to rejected
    record.status = 'rejected';
    record.remarks = req.body.remarks || record.remarks || 'Request rejected by admin';
    await record.save();

    res.json({
      recordId: record.recordId,
      status: 'rejected',
      message: 'Borrowing request rejected'
    });
  } catch (error) {
    console.error('Reject borrowing request error:', error);
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

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only accept CSV files
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Bulk upload components via CSV - Parse and extract data (no AI yet)
// POST /api/admin/components/upload
router.post('/components/upload', upload.single('csvFile'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    // Parse CSV file
    const csvRows = [];
    
    // Convert buffer to string, handle different encodings
    let csvContent = req.file.buffer.toString('utf-8');
    
    // Remove BOM if present (some CSV files have Byte Order Mark)
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }
    
    console.log('CSV file size:', req.file.size, 'bytes');
    console.log('CSV content preview (first 500 chars):', csvContent.substring(0, 500));
    
    const stream = Readable.from(csvContent);

    await new Promise((resolve, reject) => {
      stream
        .pipe(csv({
          skipEmptyLines: true,
          skipLinesWithError: true, // Skip lines with errors instead of failing
          headers: true, // Use first line as headers
          mapHeaders: ({ header }) => header.trim() // Trim whitespace from headers
        }))
        .on('data', (row) => {
          // Log each row as it comes in for debugging
          console.log('Parsed row:', row);
          
          // Add all rows that have at least one non-empty value
          const hasData = Object.keys(row).length > 0 && 
                         Object.values(row).some(value => 
                           value !== null && value !== undefined && String(value).trim() !== ''
                         );
          
          if (hasData) {
            csvRows.push(row);
          } else {
            console.log('Skipping empty row:', row);
          }
        })
        .on('end', () => {
          console.log('CSV parsing completed. Total rows parsed:', csvRows.length);
          resolve();
        })
        .on('error', (err) => {
          console.error('CSV parsing error:', err);
          reject(err);
        });
    });

    // Check if we got any rows
    if (csvRows.length === 0) {
      return res.status(400).json({ 
        message: 'CSV file is empty or invalid. Please check the file format.',
        debug: process.env.NODE_ENV === 'development' ? {
          fileSize: req.file.size,
          fileName: req.file.originalname,
          preview: csvContent.substring(0, 200)
        } : undefined
      });
    }

    // Log detailed info about parsed data
    console.log('=== CSV PARSING RESULTS ===');
    console.log('Total CSV rows parsed:', csvRows.length);
    console.log('CSV columns found:', Object.keys(csvRows[0] || {}));
    console.log('First CSV row:', JSON.stringify(csvRows[0], null, 2));
    if (csvRows.length > 1) {
      console.log('Second CSV row:', JSON.stringify(csvRows[1], null, 2));
    }
    console.log('===========================');

    // Step 1: Extract basic component data from CSV (no AI enrichment yet)
    const extractedComponents = mapCSVToComponents(csvRows);

    // Return extracted components for preview
    res.json({
      success: true,
      totalRows: csvRows.length,
      components: extractedComponents
    });

  } catch (error) {
    console.error('CSV upload error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to process CSV file',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Enrich extracted components with Gemini AI (optional step)
// POST /api/admin/components/enrich
router.post('/components/enrich', async (req, res) => {
  try {
    const { components } = req.body;

    if (!Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ message: 'Components array is required' });
    }

    // Use Gemini to enrich the components (categories, tags, descriptions, etc.)
    const enriched = await enrichComponentsWithGemini(components);

    res.json({
      success: true,
      total: enriched.length,
      components: enriched
    });
  } catch (error) {
    console.error('Components enrich error:', error);
    res.status(500).json({
      message: error.message || 'Failed to enrich components',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ===== PROCUREMENT BULK UPLOAD/ENRICH/BULK CREATE =====

// Upload procurement CSV and extract requests (no AI yet)
// POST /api/admin/procurement/upload
router.post('/procurement/upload', upload.single('csvFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No CSV file uploaded' });
    }

    const csvRows = [];
    let csvContent = req.file.buffer.toString('utf-8');

    if (csvContent.charCodeAt(0) === 0xFEFF) {
      csvContent = csvContent.slice(1);
    }

    console.log('Procurement CSV file size:', req.file.size, 'bytes');
    console.log(
      'Procurement CSV content preview (first 500 chars):',
      csvContent.substring(0, 500)
    );

    const stream = Readable.from(csvContent);

    await new Promise((resolve, reject) => {
      stream
        .pipe(
          csv({
            skipEmptyLines: true,
            skipLinesWithError: true,
            headers: true,
            mapHeaders: ({ header }) => header.trim(),
          })
        )
        .on('data', (row) => {
          const hasData =
            Object.keys(row).length > 0 &&
            Object.values(row).some(
              (value) => value !== null && value !== undefined && String(value).trim() !== ''
            );

          if (hasData) {
            csvRows.push(row);
          } else {
            console.log('Skipping empty procurement row:', row);
          }
        })
        .on('end', () => {
          console.log('Procurement CSV parsing completed. Total rows parsed:', csvRows.length);
          resolve();
        })
        .on('error', (err) => {
          console.error('Procurement CSV parsing error:', err);
          reject(err);
        });
    });

    if (csvRows.length === 0) {
      return res.status(400).json({
        message: 'CSV file is empty or invalid. Please check the file format.',
        debug:
          process.env.NODE_ENV === 'development'
            ? {
                fileSize: req.file.size,
                fileName: req.file.originalname,
                preview: csvContent.substring(0, 200),
              }
            : undefined,
      });
    }

    console.log('=== PROCUREMENT CSV PARSING RESULTS ===');
    console.log('Total CSV rows parsed:', csvRows.length);
    console.log('Procurement CSV columns found:', Object.keys(csvRows[0] || {}));
    console.log('First procurement CSV row:', JSON.stringify(csvRows[0], null, 2));
    if (csvRows.length > 1) {
      console.log('Second procurement CSV row:', JSON.stringify(csvRows[1], null, 2));
    }
    console.log('=======================================');

    const extracted = mapProcurementCSVToRequests(csvRows);

    res.json({
      success: true,
      totalRows: csvRows.length,
      requests: extracted,
    });
  } catch (error) {
    console.error('Procurement CSV upload error:', error);
    res.status(500).json({
      message: error.message || 'Failed to process procurement CSV file',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Enrich procurement requests with Gemini
// POST /api/admin/procurement/enrich
router.post('/procurement/enrich', async (req, res) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ message: 'Requests array is required' });
    }

    const enriched = await enrichProcurementsWithGemini(requests);

    res.json({
      success: true,
      total: enriched.length,
      requests: enriched,
    });
  } catch (error) {
    console.error('Procurement enrich error:', error);
    res.status(500).json({
      message: error.message || 'Failed to enrich procurement requests',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Bulk create procurement requests
// POST /api/admin/procurement/bulk
router.post('/procurement/bulk', async (req, res) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ message: 'Requests array is required' });
    }

    const results = {
      success: [],
      failed: [],
    };

    for (let i = 0; i < requests.length; i++) {
      const reqData = requests[i];

      try {
        if (!reqData.itemName || !reqData.quantity) {
          results.failed.push({
            index: i,
            itemName: reqData.itemName || 'Unknown',
            error: 'Item name and quantity are required',
          });
          continue;
        }

        const quantity = parseInt(reqData.quantity);
        if (isNaN(quantity) || quantity < 1) {
          results.failed.push({
            index: i,
            itemName: reqData.itemName || 'Unknown',
            error: 'Quantity must be at least 1',
          });
          continue;
        }

        const validPriorities = ['HIGH', 'MEDIUM', 'LOW'];
        const priority =
          reqData.priority && validPriorities.includes(String(reqData.priority).toUpperCase())
            ? String(reqData.priority).toUpperCase()
            : 'MEDIUM';

        const request = new ProcurementRequest({
          requestId: generateRequestId(),
          itemName: String(reqData.itemName).trim(),
          quantity,
          priority,
          status: 'PENDING',
          componentId: reqData.componentId || null,
          category: reqData.category || '',
          description: reqData.description || '',
          remarks: reqData.remarks || '',
        });

        await request.save();

        results.success.push({
          requestId: request.requestId,
          itemName: request.itemName,
        });
      } catch (error) {
        console.error(`Error creating procurement request ${i}:`, error);
        results.failed.push({
          index: i,
          itemName: reqData.itemName || 'Unknown',
          error: error.message || 'Failed to create procurement request',
        });
      }
    }

    res.json({
      success: true,
      total: requests.length,
      created: results.success.length,
      failed: results.failed.length,
      results,
    });
  } catch (error) {
    console.error('Bulk procurement create error:', error);
    res.status(500).json({
      message: 'Failed to create procurement requests',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
});

// Bulk create components
// POST /api/admin/components/bulk
router.post('/components/bulk', async (req, res) => {
  try {
    const { components } = req.body;

    // Validate input
    if (!Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ message: 'Components array is required' });
    }

    // Validate each component
    const validCategories = ['Microcontroller', 'SBC', 'Sensor', 'Actuator', 'Display', 'Power', 'Communication', 'Other'];
    const validConditions = ['excellent', 'good', 'fair', 'poor'];

    const results = {
      success: [],
      failed: []
    };

    // Create each component
    for (let i = 0; i < components.length; i++) {
      const compData = components[i];

      try {
        // Validate required fields
        if (!compData.name || !compData.category) {
          results.failed.push({
            index: i,
            name: compData.name || 'Unknown',
            error: 'Name and category are required'
          });
          continue;
        }

        // Validate category
        if (!validCategories.includes(compData.category)) {
          compData.category = 'Other';
        }

        // Validate condition
        if (!validConditions.includes(compData.condition)) {
          compData.condition = 'good';
        }

        // Create component
        const component = new Component({
          componentId: generateComponentId(),
          name: compData.name.trim(),
          category: compData.category.trim(),
          description: compData.description || '',
          totalQuantity: parseInt(compData.totalQuantity) || 0,
          availableQuantity: parseInt(compData.totalQuantity) || 0,
          threshold: parseInt(compData.threshold) || 5,
          tags: Array.isArray(compData.tags) ? compData.tags : [],
          datasheetLink: compData.datasheetLink || '',
          purchaseDate: compData.purchaseDate ? new Date(compData.purchaseDate) : null,
          condition: compData.condition || 'good',
          remarks: compData.remarks || ''
        });

        await component.save();

        results.success.push({
          componentId: component.componentId,
          name: component.name
        });

      } catch (error) {
        console.error(`Error creating component ${i}:`, error);
        results.failed.push({
          index: i,
          name: compData.name || 'Unknown',
          error: error.message || 'Failed to create component'
        });
      }
    }

    // Return results
    res.json({
      success: true,
      total: components.length,
      created: results.success.length,
      failed: results.failed.length,
      results: results
    });

  } catch (error) {
    console.error('Bulk create error:', error);
    res.status(500).json({ 
      message: 'Failed to create components',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

