import React from 'react';
import './SmartLab.css';
import Icon from '../Icon';
import { useGetSmartLabDataQuery } from '../../store/api/adminApi';

const SmartLab = () => {
  // Use RTK Query hook - automatically cached!
  const { 
    data: smartLabData, 
    isLoading, 
    isError,
    error 
  } = useGetSmartLabDataQuery();

  const devices = smartLabData?.devices || [];
  const stats = smartLabData?.stats || { total: 6, active: 3, offline: 3 };

  const toggleDevice = async (deviceId) => {
    // Toggle device status locally (in a real app, this would be a mutation)
    // For now, this is just UI state management
    console.log('Toggle device:', deviceId);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="smart-lab">
        <div className="smart-lab-header">
          <div>
            <h1 className="smart-lab-title">Smart Lab Control</h1>
            <p className="smart-lab-subtitle">Manage IoT devices and sensors</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Icon name="loader-2" size={32} className="spinning" />
          <p style={{ marginTop: '20px', color: '#666' }}>Loading smart lab devices...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="smart-lab">
        <div className="smart-lab-header">
          <div>
            <h1 className="smart-lab-title">Smart Lab Control</h1>
            <p className="smart-lab-subtitle">Manage IoT devices and sensors</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#e74c3c', marginBottom: '20px' }}>
            Error loading smart lab data: {error?.data?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="smart-lab">
      <div className="smart-lab-header">
        <div>
          <h1 className="smart-lab-title">Smart Lab Control</h1>
          <p className="smart-lab-subtitle">Manage IoT devices and sensors</p>
        </div>
      </div>

      <div className="smart-lab-stats">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Icon name="cpu" size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Total Devices</div>
            <div className="stat-value">{stats.total || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <Icon name="check-circle" size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active</div>
            <div className="stat-value">{stats.active || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon gray">
            <Icon name="x-circle" size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Offline</div>
            <div className="stat-value">{stats.offline || 0}</div>
          </div>
        </div>
      </div>

      <div className="devices-grid">
        {devices.length > 0 ? (
          devices.map(device => (
            <div key={device._id || device.deviceId} className="device-card">
              <div className="device-header">
                <div className="device-info">
                  <h3 className="device-name">{device.name || 'Unknown Device'}</h3>
                  <p className="device-location">{device.location || 'Unknown Location'}</p>
                </div>
                <div className={`device-status ${device.status === 'active' ? 'active' : 'offline'}`}>
                  <div className="status-dot"></div>
                  <span>{device.status === 'active' ? 'Active' : 'Offline'}</span>
                </div>
              </div>
              <div className="device-type">
                <Icon 
                  name={device.type === 'light' ? 'lightbulb' : device.type === 'fan' ? 'wind' : 'cpu'} 
                  size={20} 
                />
                <span>{device.type || 'Unknown'}</span>
              </div>
              <button 
                className={`device-toggle ${device.status === 'active' ? 'active' : ''}`}
                onClick={() => toggleDevice(device._id || device.deviceId)}
              >
                {device.status === 'active' ? 'Turn Off' : 'Turn On'}
              </button>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
            No devices found
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartLab;
