import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import Chatbox from '../Chatbox';

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showChatbox, setShowChatbox] = React.useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/inventory', label: 'Inventory', icon: '📦' },
    { path: '/admin/procurement', label: 'Procurement', icon: '🛒' },
    { path: '/admin/smart-lab', label: 'Smart Lab', icon: '💡' }
  ];

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className="admin-layout">
      <div className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">Ix</span>
          </div>
          <span className="logo-text">Invex</span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-icon">👤</span>
            <div className="user-details">
              <div className="user-role">Admin User</div>
              <div className="user-email">{user.email || 'admin@invex.io'}</div>
            </div>
          </div>
          <button className="sign-out-btn" onClick={handleLogout}>
            <span className="sign-out-icon">→</span>
            Sign Out
          </button>
        </div>
      </div>

      <div className="admin-main">
        {children}
      </div>

      <button className="chat-toggle" onClick={() => setShowChatbox(!showChatbox)}>
        💬
      </button>

      {showChatbox && (
        <Chatbox onClose={() => setShowChatbox(false)} />
      )}
    </div>
  );
};

export default AdminLayout;

