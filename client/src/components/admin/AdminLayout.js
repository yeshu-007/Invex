import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './AdminLayout.css';
import Chatbox from '../Chatbox';
import Icon from '../Icon';

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
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
    { path: '/admin/inventory', label: 'Inventory', icon: 'package' },
    { path: '/admin/procurement', label: 'Procurement', icon: 'shopping-cart' },
    { path: '/admin/smart-lab', label: 'Smart Lab', icon: 'lightbulb' }
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
              <span className="nav-icon"><Icon name={item.icon} size={20} /></span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-icon"><Icon name="user" size={20} /></span>
            <div className="user-details">
              <div className="user-role">Admin User</div>
              <div className="user-email">{user.email || 'admin@invex.io'}</div>
            </div>
          </div>
          <button className="sign-out-btn" onClick={handleLogout}>
            <span className="sign-out-icon"><Icon name="log-out" size={18} /></span>
            Sign Out
          </button>
        </div>
      </div>

      <div className="admin-main">
        {children}
      </div>

      <button className="chat-toggle" onClick={() => setShowChatbox(!showChatbox)}>
        <Icon name="message-circle" size={24} />
      </button>

      {showChatbox && (
        <Chatbox onClose={() => setShowChatbox(false)} />
      )}
    </div>
  );
};

export default AdminLayout;

