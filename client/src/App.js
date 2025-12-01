import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  // Check if user was already logged in when page loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      // User was logged in before, restore their info
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Called when login is successful
  const handleLogin = (userData) => {
    setUser(userData);
  };

  // Called when user clicks logout
  const handleLogout = () => {
    // Remove token and user info from storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null); // Clear user state
  };

  // If no user, show login page
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // If user is logged in, show welcome page
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome, {user.username || user.userId}!</h1>
        <p>Role: {user.role}</p>
        <button onClick={handleLogout}>Logout</button>
      </header>
    </div>
  );
}

export default App;
