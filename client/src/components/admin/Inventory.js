import React, { useState, useEffect } from 'react';
import './Inventory.css';

const Inventory = () => {
  const [components, setComponents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchComponents();
  }, []);

  const fetchComponents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/components', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array and map to component format
        const componentsArray = Array.isArray(data) ? data : [];
        const mappedComponents = componentsArray.map(comp => ({
          _id: comp._id || comp.componentId,
          componentId: comp.componentId,
          name: comp.name || '',
          description: comp.description || '',
          category: comp.category || '',
          tags: Array.isArray(comp.tags) ? comp.tags : [],
          stock: comp.availableQuantity || 0,
          totalStock: comp.totalQuantity || 0
        }));
        setComponents(mappedComponents);
      } else {
        // Use mock data on error
        setComponents([
          {
            _id: '1',
            name: 'Arduino Uno R3',
            description: 'Microcontroller board based on ATmega328P',
            category: 'Microcontroller',
            tags: ['arduino', 'robot'],
            stock: 14,
            totalStock: 20
          },
          {
            _id: '2',
            name: 'Raspberry Pi 4',
            description: 'Single-board computer with 4GB RAM',
            category: 'SBC',
            tags: ['raspberry pi', 'linux'],
            stock: 2,
            totalStock: 10
          },
          {
            _id: '3',
            name: 'HC-SR04 Ultrasonic Sensor',
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
            description: 'WiFi and Bluetooth enabled microcontroller',
            category: 'Microcontroller',
            tags: ['esp32', 'wifi', 'iot'],
            stock: 8,
            totalStock: 15
          },
          {
            _id: '6',
            name: 'DHT22 Temperature Sensor',
            description: 'Digital temperature and humidity sensor',
            category: 'Sensor',
            tags: ['sensor', 'temperature'],
            stock: 32,
            totalStock: 40
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching components:', error);
      // Set empty array on error to prevent crashes
      setComponents([]);
    }
  };

  const filteredComponents = Array.isArray(components) ? components.filter(comp =>
    comp && comp.name && (
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(comp.tags) && comp.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    )
  ) : [];

  return (
    <div className="inventory">
      <div className="inventory-header">
        <div>
          <h1 className="inventory-title">Inventory Management</h1>
          <p className="inventory-subtitle">Manage and track all IoT components</p>
        </div>
      </div>

      <div className="inventory-toolbar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <button className="btn-secondary">
            📤 Bulk Upload CSV
          </button>
          <button className="btn-primary">
            ➕ Add Item
          </button>
        </div>
      </div>

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Tags</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredComponents.length > 0 ? (
              filteredComponents.map(component => (
                <tr key={component._id || component.componentId}>
                  <td>
                    <div className="item-name">{component.name || 'N/A'}</div>
                    <div className="item-description">{component.description || ''}</div>
                  </td>
                  <td>
                    <span className="category-tag">{component.category || 'N/A'}</span>
                  </td>
                  <td>
                    <span className={`stock-value ${(component.stock || 0) < 10 ? 'low' : ''}`}>
                      {component.stock || 0}/{component.totalStock || 0}
                    </span>
                  </td>
                  <td>
                    <div className="tags-list">
                      {Array.isArray(component.tags) && component.tags.length > 0 ? (
                        component.tags.map((tag, idx) => (
                          <span key={idx} className="tag">{tag}</span>
                        ))
                      ) : (
                        <span className="tag">No tags</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit">✏️</button>
                      <button className="action-btn delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No components found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Inventory;

