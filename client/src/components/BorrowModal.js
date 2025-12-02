import React from 'react';
import './BorrowModal.css';

const BorrowModal = ({ component, isLoggedIn, onClose, onLoginClick }) => {
  if (!component) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Borrow Component</h2>
        <p className="modal-text">
          You're trying to borrow: <strong>{component.name}</strong>
        </p>
        {!isLoggedIn ? (
          <>
            <p className="modal-text">You need to log in to complete borrowing.</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-login" onClick={onLoginClick}>Login as Student</button>
            </div>
          </>
        ) : (
          <>
            <p className="modal-text">Ready to borrow this component?</p>
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={onClose}>Cancel</button>
              <button className="btn-confirm" onClick={() => {
                // Handle borrow logic here
                alert(`Borrowing ${component.name}...`);
                onClose();
              }}>Confirm Borrow</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BorrowModal;

