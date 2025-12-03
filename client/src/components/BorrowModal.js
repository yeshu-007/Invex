import React, { useState } from 'react';
import './BorrowModal.css';

const BorrowModal = ({ component, onClose, onBorrowSuccess }) => {
  const [studentId, setStudentId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!component) return null;

  // Calculate expected return date as 15 days from today
  const getExpectedReturnDate = () => {
    const today = new Date();
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + 15);
    // Format as YYYY-MM-DD for API
    return returnDate.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!studentId.trim()) {
      setError('Please enter a student ID');
      return;
    }

    setLoading(true);

    try {
      // Get componentId from component (could be _id or componentId)
      const componentId = component.componentId || component._id;
      // Automatically calculate expected return date (15 days from today)
      const expectedReturnDate = getExpectedReturnDate();

      const response = await fetch('http://localhost:5001/api/student/borrow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: studentId.trim(),
          componentId: componentId,
          quantity: quantity,
          expectedReturnDate: expectedReturnDate
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Success - call the success callback
        if (onBorrowSuccess) {
          onBorrowSuccess(data);
        }
        onClose();
      } else {
        setError(data.message || 'Failed to borrow component. Please try again.');
      }
    } catch (err) {
      console.error('Borrow error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Borrow Component</h2>
        <p className="modal-text">
          You're trying to borrow: <strong>{component.name}</strong>
        </p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="studentId" className="form-label">Student ID</label>
            <input
              type="text"
              id="studentId"
              className="form-input"
              placeholder="Enter your student ID (e.g., AU24UG006)"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="quantity" className="form-label">Quantity</label>
            <input
              type="number"
              id="quantity"
              className="form-input"
              min="1"
              max={component.stock || component.availableQuantity || 1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <p className="modal-text" style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
              Expected return date: <strong>{new Date(getExpectedReturnDate()).toLocaleDateString()}</strong> (15 days from today)
            </p>
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-buttons">
            <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm" disabled={loading}>
              {loading ? 'Borrowing...' : 'Confirm Borrow'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BorrowModal;

