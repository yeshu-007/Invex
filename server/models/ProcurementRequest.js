const mongoose = require('mongoose');

// Define what a ProcurementRequest looks like in the database
const procurementRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priority: {
    type: String,
    required: true,
    enum: ['HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    required: true,
    enum: ['PENDING', 'APPROVED', 'ORDERED', 'RECEIVED', 'CANCELLED'],
    default: 'PENDING'
  },
  componentId: {
    type: String,
    trim: true,
    default: null
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  requestedBy: {
    type: String,
    default: 'admin',
    trim: true
  },
  remarks: {
    type: String,
    default: '',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt before saving
procurementRequestSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('ProcurementRequest', procurementRequestSchema);

