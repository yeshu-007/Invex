import React, { useState, useEffect } from 'react';
import './StudentView.css';
import BorrowModal from './BorrowModal';
import ImageScanModal from './ImageScanModal';
import Chatbox from './Chatbox';
import Icon from './Icon';

const StudentView = () => {
  const [components, setComponents] = useState([]);
  const [filteredComponents, setFilteredComponents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showImageScanModal, setShowImageScanModal] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [showChatbox, setShowChatbox] = useState(false);

  const filters = ['All', 'arduino', 'sensor', 'microcontroller', 'raspberry pi', 'motor', 'wifi'];

  useEffect(() => {
    // Fetch components from API
    fetchComponents();
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      const userData = JSON.parse(savedUser);
      if (userData.role === 'student') {
        setIsLoggedIn(true);
        setUser(userData);
      }
    }
  }, []);

  const fetchComponents = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/components');
      const data = await response.json();
      if (response.ok) {
        // Map API response to component format
        const mappedComponents = data.map(comp => ({
          _id: comp._id || comp.componentId,
          componentId: comp.componentId,
          name: comp.name,
          description: comp.description || '',
          category: comp.category,
          tags: comp.tags || [],
          stock: comp.availableQuantity || 0,
          totalStock: comp.totalQuantity || 0
        }));
        setComponents(mappedComponents);
        setFilteredComponents(mappedComponents);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
      // Use mock data if API fails
      const mockComponents = [
        {
          _id: '1',
          name: 'Arduino Uno R3',
          description: 'Microcontroller board based on ATmega328P',
          category: 'Microcontroller',
          tags: ['arduino', 'microcontroller'],
          stock: 14,
          totalStock: 20
        },
        {
          _id: '2',
          name: 'Raspberry Pi 4',
          description: 'Single-board computer with 4GB RAM',
          category: 'SBC',
          tags: ['raspberry pi', 'sbc'],
          stock: 2,
          totalStock: 10
        },
        {
          _id: '3',
          name: 'HC-SR04 Ultrasonic',
          description: 'Distance measuring sensor module',
          category: 'Sensor',
          tags: ['sensor', 'ultrasonic'],
          stock: 45,
          totalStock: 50
        },
        {
          _id: '4',
          name: 'SG90 Micro Servo',
          description: '9g micro servo motor for robotics',
          category: 'Actuator',
          tags: ['servo', 'motor'],
          stock: 5,
          totalStock: 30
        },
        {
          _id: '5',
          name: 'ESP32 DevKit',
          description: 'WiFi and Bluetooth enabled',
          category: 'Microcontroller',
          tags: ['esp32', 'wifi'],
          stock: 8,
          totalStock: 15
        },
        {
          _id: '6',
          name: 'DHT22 Sensor',
          description: 'Temperature and humidity sensor',
          category: 'Sensor',
          tags: ['sensor', 'temperature'],
          stock: 32,
          totalStock: 40
        }
      ];
      setComponents(mockComponents);
      setFilteredComponents(mockComponents);
    }
  };

  useEffect(() => {
    let filtered = components;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(comp =>
        comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        comp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply category filter
    if (activeFilter !== 'All') {
      filtered = filtered.filter(comp =>
        comp.category.toLowerCase() === activeFilter.toLowerCase() ||
        comp.tags.some(tag => tag.toLowerCase() === activeFilter.toLowerCase())
      );
    }

    setFilteredComponents(filtered);
  }, [searchQuery, activeFilter, components]);

  const handleBorrowClick = (component) => {
    setSelectedComponent(component);
    setShowBorrowModal(true);
  };

  const handleComponentFromScan = (component) => {
    // Component selected from image scan, open borrow modal
    setSelectedComponent(component);
    setShowBorrowModal(true);
  };

  const handleBorrowSuccess = (data) => {
    // Refresh components to update availability
    fetchComponents();
    // Show success message
    alert(`Successfully borrowed! Record ID: ${data.recordId}`);
    setShowBorrowModal(false);
    setSelectedComponent(null);
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'Microcontroller': <Icon name="wrench" size={32} />,
      'SBC': <Icon name="laptop" size={32} />,
      'Sensor': <Icon name="radio" size={32} />,
      'Actuator': <Icon name="settings" size={32} />
    };
    return icons[category] || <Icon name="package" size={32} />;
  };

  return (
    <div className="student-view">
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">Ix</span>
          </div>
          <span className="logo-text">Invex</span>
        </div>
        <button className="admin-login-btn" onClick={() => window.location.href = '/admin/login'}>
          Sign in as Admin
        </button>
      </div>

      <div className="main-content">
        <div className="top-bar">
          <div className="top-bar-right">
            <span className="scan-text">Scan Student QR to continue</span>
          </div>
        </div>

        <div className="content-area">
          <div className="welcome-section">
            <h1>Welcome, {isLoggedIn ? (user?.username || user?.userId || 'Student User') : 'Student User'}</h1>
            <p>Find components for your next project.</p>
          </div>

          <div className="search-bar">
            <Icon name="search" size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search for components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="scan-button"
              onClick={() => setShowImageScanModal(true)}
              title="Scan component with camera"
            >
              <Icon name="camera" size={20} />
            </button>
          </div>

          <div className="filter-buttons">
            {filters.map(filter => (
              <button
                key={filter}
                className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>


          <div className="components-grid">
            {filteredComponents.map(component => (
              <div key={component._id} className="component-card">
                <div className="card-icon">{getCategoryIcon(component.category)}</div>
                <h3 className="card-title">{component.name}</h3>
                <p className="card-description">{component.description}</p>
                <div className="card-category">{component.category}</div>
                <div className="card-tags">
                  {component.tags.map((tag, idx) => (
                    <span key={idx} className="tag">{tag}</span>
                  ))}
                </div>
                <div className={`card-availability ${component.stock < 10 ? 'low' : ''}`}>
                  {component.stock} available
                </div>
                <button
                  className="borrow-btn"
                  onClick={() => handleBorrowClick(component)}
                >
                  Borrow
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBorrowModal && (
        <BorrowModal
          component={selectedComponent}
          onClose={() => {
            setShowBorrowModal(false);
            setSelectedComponent(null);
          }}
          onBorrowSuccess={handleBorrowSuccess}
        />
      )}

      {showImageScanModal && (
        <ImageScanModal
          onClose={() => setShowImageScanModal(false)}
          onComponentSelect={handleComponentFromScan}
        />
      )}

      <button className="chat-toggle" onClick={() => setShowChatbox(!showChatbox)}>
        <Icon name="message-circle" size={24} />
      </button>

      {showChatbox && (
        <Chatbox onClose={() => setShowChatbox(false)} />
      )}
    </div>
  );
};

export default StudentView;

