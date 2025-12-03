import React, { useState, useEffect, useCallback } from 'react';
import './AddItemModal.css';
import Icon from '../Icon';

const EditItemModal = ({ component, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    tags: '',
    totalQuantity: 0,
    availableQuantity: 0,
    threshold: 5,
    condition: 'good',
    datasheetLink: '',
    remarks: '',
    purchaseDate: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchComponentDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/components/${component.componentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || '',
          category: data.category || '',
          description: data.description || '',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : '',
          totalQuantity: data.totalQuantity || 0,
          availableQuantity: data.availableQuantity || 0,
          threshold: data.threshold || 5,
          condition: data.condition || 'good',
          datasheetLink: data.datasheetLink || '',
          remarks: data.remarks || '',
          purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString().split('T')[0] : ''
        });
      } else {
        // If API fails, use the component data we have
        setFormData({
          name: component.name || '',
          category: component.category || '',
          description: component.description || '',
          tags: Array.isArray(component.tags) ? component.tags.join(', ') : '',
          totalQuantity: component.totalStock || 0,
          availableQuantity: component.stock || 0,
          threshold: 5,
          condition: 'good',
          datasheetLink: '',
          remarks: '',
          purchaseDate: ''
        });
      }
    } catch (error) {
      console.error('Error fetching component details:', error);
      // Use the component data we have
      setFormData({
        name: component.name || '',
        category: component.category || '',
        description: component.description || '',
        tags: Array.isArray(component.tags) ? component.tags.join(', ') : '',
        totalQuantity: component.totalStock || 0,
        availableQuantity: component.stock || 0,
        threshold: 5,
        condition: 'good',
        datasheetLink: '',
        remarks: '',
        purchaseDate: ''
      });
    } finally {
      setFetching(false);
    }
  }, [component]);

  useEffect(() => {
    // Fetch full component details if we only have basic info
    if (component && component.componentId) {
      fetchComponentDetails();
    }
  }, [component, fetchComponentDetails]);

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

    if (formData.availableQuantity < 0) {
      setError('Available quantity cannot be negative');
      return;
    }

    if (formData.availableQuantity > formData.totalQuantity) {
      setError('Available quantity cannot exceed total quantity');
      return;
    }

    if (formData.threshold < 0) {
      setError('Threshold cannot be negative');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Parse tags from comma-separated string
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
        : [];

      const payload = {
        name: formData.name.trim(),
        category: formData.category.trim(),
        description: formData.description.trim(),
        tags: tagsArray,
        totalQuantity: parseInt(formData.totalQuantity) || 0,
        availableQuantity: parseInt(formData.availableQuantity) || 0,
        threshold: parseInt(formData.threshold) || 5,
        condition: formData.condition,
        datasheetLink: formData.datasheetLink.trim(),
        remarks: formData.remarks.trim(),
        purchaseDate: formData.purchaseDate || null
      };

      const response = await fetch(`http://localhost:5001/api/admin/components/${component.componentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        if (onSuccess) {
          onSuccess(data);
        }
        onClose();
      } else {
        setError(data.message || 'Failed to update component. Please try again.');
      }
    } catch (err) {
      console.error('Update component error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Microcontroller', 'SBC', 'Sensor', 'Actuator', 'Display', 'Power', 'Communication', 'Other'];

  if (!component) return null;

  if (fetching) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content add-item-modal" onClick={(e) => e.stopPropagation()}>
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Icon name="loader-2" size={32} className="spinning" />
            <p style={{ marginTop: '20px', color: '#666' }}>Loading component details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-item-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <Icon name="x" size={24} />
        </button>
        <h2 className="modal-title">Edit Component</h2>
        
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
              <label htmlFor="availableQuantity" className="form-label">Available Quantity</label>
              <input
                type="number"
                id="availableQuantity"
                name="availableQuantity"
                className="form-input"
                placeholder="0"
                value={formData.availableQuantity}
                onChange={handleChange}
                min="0"
                max={formData.totalQuantity}
                disabled={loading}
              />
              <small className="form-hint">Cannot exceed total quantity</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="threshold" className="form-label">
                Low Stock Threshold <span className="required">*</span>
              </label>
              <input
                type="number"
                id="threshold"
                name="threshold"
                className="form-input"
                placeholder="5"
                value={formData.threshold}
                onChange={handleChange}
                min="0"
                required
                disabled={loading}
              />
              <small className="form-hint">Alert when stock falls below this</small>
            </div>

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
                  Updating...
                </>
              ) : (
                <>
                  <Icon name="save" size={18} style={{ marginRight: '8px' }} />
                  Update Component
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;

