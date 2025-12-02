import React, { useState, useEffect } from 'react';
import './SmartLab.css';

const SmartLab = () => {
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    total: 6,
    active: 3,
    offline: 3
  });

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/smart-lab', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setDevices(data.devices || []);
        setStats(data.stats || stats);
      } else {
        // Use mock data
        setDevices([
          { _id: '1', name: 'Main Lab Lights', location: 'Ceiling A', type: 'light', status: 'active' },
          { _id: '2', name: 'Workbench Fan', location: 'Bench 3', type: 'fan', status: 'off' },
          { _id: '3', name: 'Storage AC', location: 'Server Room', type: 'ac', status: 'active' },
          { _id: '4', name: 'Entry Hall Lights', location: 'Entrance', type: 'light', status: 'off' },
          { _id: '5', name: 'Workshop Fan', location: 'Workshop Area', type: 'fan', status: 'active' },
          { _id: '6', name: 'Lab AC', location: 'Main Lab', type: 'ac', status: 'off' }
        ]);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const toggleDevice = async (deviceId) => {
    // Toggle device status
    setDevices(devices.map(device =>
      device._id === deviceId
        ? { ...device, status: device.status === 'active' ? 'off' : 'active' }
        : device
    ));
    
    // Update stats
    const updatedDevices = devices.map(device =>
      device._id === deviceId
        ? { ...device, status: device.status === 'active' ? 'off' : 'active' }
        : device
    );
    setStats({
      total: updatedDevices.length,
      active: updatedDevices.filter(d => d.status === 'active').length,
      offline: updatedDevices.filter(d => d.status === 'off').length
    });
  };

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'light': return '💡';
      case 'fan': return '🌀';
      case 'ac': return '❄️';
      default: return '⚡';
    }
  };

  const turnAllOn = () => {
    setDevices(devices.map(d => ({ ...d, status: 'active' })));
    setStats({ ...stats, active: devices.length, offline: 0 });
  };

  const turnAllOff = () => {
    setDevices(devices.map(d => ({ ...d, status: 'off' })));
    setStats({ ...stats, active: 0, offline: devices.length });
  };

  return (
    <div className="smart-lab">
      <div className="smart-lab-header">
        <div>
          <h1 className="smart-lab-title">Smart Lab IoT Control</h1>
          <p className="smart-lab-subtitle">Monitor and control lab devices remotely</p>
        </div>
        <div className="system-status">
          <span className="status-indicator online"></span>
          <span>System Online</span>
        </div>
      </div>

      <div className="device-stats">
        <div className="stat-card">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <div className="stat-label">Total Devices</div>
            <div className="stat-value">{stats.total}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">✓</div>
          <div className="stat-content">
            <div className="stat-label">Active</div>
            <div className="stat-value">{stats.active}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon gray">○</div>
          <div className="stat-content">
            <div className="stat-label">Offline</div>
            <div className="stat-value">{stats.offline}</div>
          </div>
        </div>
      </div>

      <div className="devices-grid">
        {devices.map(device => (
          <div key={device._id} className="device-card">
            <div className={`device-icon ${device.status === 'active' ? 'active' : ''}`}>
              {getDeviceIcon(device.type)}
            </div>
            <div className="device-info">
              <div className="device-name">{device.name}</div>
              <div className="device-location">{device.location}</div>
              <div className={`device-status ${device.status === 'active' ? 'active' : ''}`}>
                {device.status === 'active' ? 'ACTIVE' : 'OFF'}
              </div>
            </div>
            <button
              className="device-toggle"
              onClick={() => toggleDevice(device._id)}
            >
              ⚡
            </button>
          </div>
        ))}
      </div>

      <div className="quick-actions">
        <h2 className="section-title">Quick Actions</h2>
        <div className="action-buttons">
          <button className="action-btn primary" onClick={turnAllOn}>
            Turn All On
          </button>
          <button className="action-btn" onClick={turnAllOff}>
            Turn All Off
          </button>
          <button className="action-btn">
            All Lights On
          </button>
          <button className="action-btn">
            Climate Control Off
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartLab;

