import React, { useState, useEffect } from 'react';
import './Procurement.css';

const Procurement = () => {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/procurement', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Ensure data is an array
        const requestsArray = Array.isArray(data) ? data : [];
        setRequests(requestsArray);
      } else {
        // Use mock data on error
        setRequests([
          {
            _id: '1',
            itemName: 'Raspberry Pi 4',
            quantity: 6,
            priority: 'MEDIUM',
            status: 'PENDING'
          },
          {
            _id: '2',
            itemName: 'SG90 Micro Servo',
            quantity: 16,
            priority: 'MEDIUM',
            status: 'PENDING'
          },
          {
            _id: '3',
            itemName: 'ESP32 DevKit',
            quantity: 10,
            priority: 'MEDIUM',
            status: 'PENDING'
          },
          {
            _id: '4',
            itemName: 'Jumper Wires Set',
            quantity: 5,
            priority: 'LOW',
            status: 'PENDING'
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      // Set empty array on error to prevent crashes
      setRequests([]);
    }
  };

  // Ensure requests is always an array
  const requestsArray = Array.isArray(requests) ? requests : [];
  const totalRequests = requestsArray.length;
  const pendingRequests = requestsArray.filter(r => r && r.status === 'PENDING').length;
  const totalUnits = requestsArray.reduce((sum, r) => sum + (r?.quantity || 0), 0);

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'HIGH': return 'high';
      case 'MEDIUM': return 'medium';
      case 'LOW': return 'low';
      default: return 'medium';
    }
  };

  return (
    <div className="procurement">
      <div className="procurement-header">
        <div>
          <h1 className="procurement-title">Procurement List</h1>
          <p className="procurement-subtitle">Manage component orders and requests</p>
        </div>
        <button className="btn-primary">
          ➕ New Request
        </button>
      </div>

      <div className="procurement-table-container">
        <table className="procurement-table">
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity Needed</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requestsArray.length > 0 ? (
              requestsArray.map(request => (
                <tr key={request._id || request.componentId}>
                  <td>{request.itemName || request.name || 'N/A'}</td>
                  <td>{request.quantity || 0} units</td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(request.priority)}`}>
                      {request.priority || 'MEDIUM'}
                    </span>
                  </td>
                  <td>
                    <span className="status-badge pending">{request.status || 'PENDING'}</span>
                  </td>
                  <td>
                    <button className="view-details-btn">View Details</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No procurement requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="procurement-summary">
        <div className="summary-card">
          <div className="summary-icon">📄</div>
          <div className="summary-content">
            <div className="summary-label">Total Requests</div>
            <div className="summary-value">{totalRequests}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⏳</div>
          <div className="summary-content">
            <div className="summary-label">Pending</div>
            <div className="summary-value">{pendingRequests}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📦</div>
          <div className="summary-content">
            <div className="summary-label">Total Units</div>
            <div className="summary-value">{totalUnits}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Procurement;

