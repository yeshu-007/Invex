import React, { useState } from 'react';
import './Login.css';

function Login({ onLogin }) {
  // Store what user types in the form
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // When user types in User ID field
  const handleUserIdChange = (e) => {
    setUserId(e.target.value);
    setError(''); // Clear error when user types
  };

  // When user types in Password field
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError(''); // Clear error when user types
  };

  // When user clicks Sign In button
  const handleSubmit = async (e) => {
    e.preventDefault(); // Don't refresh the page
    setError('');
    setLoading(true);

    try {
      // Send login request to server
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          password: password
        })
      });

      const data = await response.json();

      // If login successful
      if (response.ok) {
        // Save token and user info in browser storage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Tell parent component that login worked
        onLogin(data.user);
      } else {
        // Show error message
        setError(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      // If network error
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="logo-container">
          <div className="logo">
            <span className="logo-text">Ix</span>
          </div>
        </div>
        
        <h1 className="login-title">Invex Login</h1>
        <p className="login-subtitle">IoT Lab Inventory Management</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="userId" className="form-label">User ID</label>
            <input
              type="text"
              id="userId"
              className="form-input"
              placeholder="Enter Admin ID or Student ID"
              value={userId}
              onChange={handleUserIdChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="Enter Password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="sign-in-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;

