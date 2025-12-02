import React, { useState } from 'react';
import './StudentLoginModal.css';

const StudentLoginModal = ({ onClose, onLoginSuccess }) => {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: studentId,
          password: 'student123' // Default password for students
        })
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        onLoginSuccess(data.user);
      } else {
        // If login fails, allow guest login with any ID
        const guestUser = {
          userId: studentId,
          username: studentId,
          role: 'student'
        };
        localStorage.setItem('user', JSON.stringify(guestUser));
        onLoginSuccess(guestUser);
      }
    } catch (err) {
      // Allow guest login on network error
      const guestUser = {
        userId: studentId,
        username: studentId,
        role: 'student'
      };
      localStorage.setItem('user', JSON.stringify(guestUser));
      onLoginSuccess(guestUser);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2 className="modal-title">Student Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="studentId" className="form-label">Student ID</label>
            <input
              type="text"
              id="studentId"
              className="form-input"
              placeholder="Enter your student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="modal-buttons">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-login" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
          <p className="hint-text">Enter any student ID to continue</p>
        </form>
      </div>
    </div>
  );
};

export default StudentLoginModal;

