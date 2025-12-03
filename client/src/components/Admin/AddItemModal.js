import React, { useState } from 'react';
import './AddItemModal.css';
import Icon from '../Icon';
import { useCreateComponentMutation } from '../../store/api/adminApi';

const AddItemModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    totalQuantity: 0,
    threshold: 5,
    tags: '',
    datasheetLink: '',
    condition: 'good',
    remarks: '',
    purchaseDate: ''
  });
  const [error, setError] = useState('');
  
  // RTK Query mutation hook - automatically invalidates cache on success
  const [createComponent, { isLoading: loading }] = useCreateComponentMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.name.trim()) {
      setError('Component name is required');
      return;
    }

    if (!formData.category.trim()) {
      setError('Category is required');
      return;
    }

    if (formData.totalQuantity < 0) {
      setError('Total quantity cannot be negative');
      return;
    }

    try {
      // Parse tags from comma-separated string
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        totalQuantity: parseInt(formData.totalQuantity) || 0,
        availableQuantity: parseInt(formData.totalQuantity) || 0, // Initially all available
        threshold: parseInt(formData.threshold) || 5,
        tags: tagsArray,
        datasheetLink: formData.datasheetLink.trim(),
        condition: formData.condition,
        remarks: formData.remarks.trim(),
        purchaseDate: formData.purchaseDate || null
      };

      // Use RTK Query mutation - cache is automatically invalidated on success
      const data = await createComponent(payload).unwrap();

      if (onSuccess) {
        onSuccess(data);
      }
      onClose();
    } catch (err) {
      console.error('Add component error:', err);
      setError(err?.data?.message || 'Failed to add component. Please try again.');
    }
  };

  const categories = ['Microcontroller', 'SBC', 'Sensor', 'Actuator', 'Display', 'Power', 'Communication', 'Other'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-item-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <Icon name="x" size={24} />
        </button>
        <h2 className="modal-title">Add New Component</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Component Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="e.g., Arduino Uno R3"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category" className="form-label">
                Category <span className="required">*</span>
              </label>
              <select
                id="category"
                name="category"
                className="form-input"
                value={formData.category}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              placeholder="Brief description of the component..."
              value={formData.description}
              onChange={handleChange}
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalQuantity" className="form-label">Total Quantity</label>
              <input
                type="number"
                id="totalQuantity"
                name="totalQuantity"
                className="form-input"
                placeholder="0"
                value={formData.totalQuantity}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="threshold" className="form-label">Low Stock Threshold</label>
              <input
                type="number"
                id="threshold"
                name="threshold"
                className="form-input"
                placeholder="5"
                value={formData.threshold}
                onChange={handleChange}
                min="0"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags" className="form-label">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              className="form-input"
              placeholder="arduino, microcontroller, iot (comma-separated)"
              value={formData.tags}
              onChange={handleChange}
              disabled={loading}
            />
            <small className="form-hint">Separate multiple tags with commas</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="condition" className="form-label">Condition</label>
              <select
                id="condition"
                name="condition"
                className="form-input"
                value={formData.condition}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="purchaseDate" className="form-label">Purchase Date</label>
              <input
                type="date"
                id="purchaseDate"
                name="purchaseDate"
                className="form-input"
                value={formData.purchaseDate}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="datasheetLink" className="form-label">Datasheet Link</label>
            <input
              type="url"
              id="datasheetLink"
              name="datasheetLink"
              className="form-input"
              placeholder="https://..."
              value={formData.datasheetLink}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="remarks" className="form-label">Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              className="form-input form-textarea"
              placeholder="Additional notes..."
              value={formData.remarks}
              onChange={handleChange}
              rows="2"
              disabled={loading}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="modal-buttons">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm" disabled={loading}>
              {loading ? (
                <>
                  <Icon name="loader-2" size={18} className="spinning" style={{ marginRight: '8px' }} />
                  Adding...
                </>
              ) : (
                <>
                  <Icon name="plus" size={18} style={{ marginRight: '8px' }} />
                  Add Component
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;

