import React, { useState, useEffect } from 'react';
import './AddItemModal.css';
import Icon from '../Icon';

const AddProcurementModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: 1,
    priority: 'MEDIUM',
    componentId: '',
    category: '',
    description: '',
    remarks: ''
  });
  const [components, setComponents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingComponents, setLoadingComponents] = useState(false);

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      setLoadingComponents(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/components', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setComponents(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching components:', err);
    } finally {
      setLoadingComponents(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If a component is selected, auto-fill category
    if (name === 'componentId' && value) {
      const selectedComponent = components.find(comp => comp.componentId === value);
      if (selectedComponent) {
        setFormData(prev => ({
          ...prev,
          componentId: value,
          itemName: selectedComponent.name,
          category: selectedComponent.category || ''
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.itemName.trim()) {
      setError('Item name is required');
      return;
    }

    if (formData.quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      const payload = {
        itemName: formData.itemName.trim(),
        quantity: parseInt(formData.quantity) || 1,
        priority: formData.priority,
        componentId: formData.componentId || null,
        category: formData.category.trim(),
        description: formData.description.trim(),
        remarks: formData.remarks.trim()
      };

      const response = await fetch('http://localhost:5001/api/admin/procurement', {
        method: 'POST',
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
        setError(data.message || 'Failed to create procurement request. Please try again.');
      }
    } catch (err) {
      console.error('Create procurement request error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Microcontroller', 'SBC', 'Sensor', 'Actuator', 'Display', 'Power', 'Communication', 'Other'];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-item-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <Icon name="x" size={24} />
        </button>
        <h2 className="modal-title">New Procurement Request</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="componentId" className="form-label">
              Link to Existing Component (Optional)
            </label>
            <select
              id="componentId"
              name="componentId"
              className="form-input"
              value={formData.componentId}
              onChange={handleChange}
              disabled={loading || loadingComponents}
            >
              <option value="">None - New Item</option>
              {components.map(comp => (
                <option key={comp.componentId} value={comp.componentId}>
                  {comp.componentId} - {comp.name}
                </option>
              ))}
            </select>
            <small className="form-hint">Select an existing component to link this request, or leave blank for a new item</small>
          </div>

          <div className="form-group">
            <label htmlFor="itemName" className="form-label">
              Item Name <span className="required">*</span>
            </label>
            <input
              type="text"
              id="itemName"
              name="itemName"
              className="form-input"
              placeholder="e.g., Raspberry Pi 4"
              value={formData.itemName}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="quantity" className="form-label">
                Quantity Needed <span className="required">*</span>
              </label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                className="form-input"
                placeholder="1"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="priority" className="form-label">
                Priority <span className="required">*</span>
              </label>
              <select
                id="priority"
                name="priority"
                className="form-input"
                value={formData.priority}
                onChange={handleChange}
                required
                disabled={loading}
              >
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category" className="form-label">Category</label>
            <select
              id="category"
              name="category"
              className="form-input"
              value={formData.category}
              onChange={handleChange}
              disabled={loading}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="description" className="form-label">Description</label>
            <textarea
              id="description"
              name="description"
              className="form-input form-textarea"
              placeholder="Brief description of the item..."
              value={formData.description}
              onChange={handleChange}
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="remarks" className="form-label">Remarks</label>
            <textarea
              id="remarks"
              name="remarks"
              className="form-input form-textarea"
              placeholder="Additional notes or requirements..."
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
                  Creating...
                </>
              ) : (
                <>
                  <Icon name="plus" size={18} style={{ marginRight: '8px' }} />
                  Create Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProcurementModal;

