const mongoose = require('mongoose');

// Define what a Component looks like in the database
const componentSchema = new mongoose.Schema({
  componentId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  totalQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  availableQuantity: {
    type: Number,
    required: true,
    default: 0
  },
  threshold: {
    type: Number,
    default: 5
  },
  tags: {
    type: [String],
    default: []
  },
  datasheetLink: {
    type: String,
    default: '',
    trim: true
  },
  purchaseDate: {
    type: Date
  },
  condition: {
    type: String,
    default: 'good',
    enum: ['excellent', 'good', 'fair', 'poor']
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
componentSchema.pre('save', async function() {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('Component', componentSchema);

