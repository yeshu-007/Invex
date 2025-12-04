import React, { useMemo } from 'react';
import './Procurement.css';
import Icon from '../Icon';
import AddProcurementModal from './AddProcurementModal';
import ProcurementDetailsModal from './ProcurementDetailsModal';
import BulkProcurementUploadModal from './BulkProcurementUploadModal';
import { useGetProcurementRequestsQuery } from '../../store/api/adminApi';

const Procurement = () => {
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = React.useState(false);
  const [selectedRequest, setSelectedRequest] = React.useState(null);

  // Use RTK Query hook - automatically cached!
  const { 
    data: requestsData, 
    isLoading, 
    isError,
    error 
  } = useGetProcurementRequestsQuery();

  // Transform API data
  const requestsArray = useMemo(() => {
    if (!requestsData) return [];
    return Array.isArray(requestsData) ? requestsData : [];
  }, [requestsData]);

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

  const getStatusClass = (status) => {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'APPROVED': return 'approved';
      case 'ORDERED': return 'ordered';
      case 'RECEIVED': return 'received';
      case 'CANCELLED': return 'cancelled';
      default: return 'pending';
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="procurement">
        <div className="procurement-header">
          <div>
            <h1 className="procurement-title">Procurement List</h1>
            <p className="procurement-subtitle">Manage component orders and requests</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Icon name="loader-2" size={32} className="spinning" />
          <p style={{ marginTop: '20px', color: '#666' }}>Loading procurement requests...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="procurement">
        <div className="procurement-header">
          <div>
            <h1 className="procurement-title">Procurement List</h1>
            <p className="procurement-subtitle">Manage component orders and requests</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#e74c3c', marginBottom: '20px' }}>
            Error loading procurement requests: {error?.data?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="procurement">
      <div className="procurement-header">
        <div>
          <h1 className="procurement-title">Procurement List</h1>
          <p className="procurement-subtitle">Manage component orders and requests</p>
        </div>
        <div>
          <button
            className="btn-secondary"
            style={{ marginRight: '10px' }}
            onClick={() => setShowBulkUploadModal(true)}
          >
            <Icon name="upload" size={18} style={{ marginRight: '8px' }} />
            Bulk Upload CSV
          </button>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <Icon name="plus" size={18} style={{ marginRight: '8px' }} />
            New Request
          </button>
        </div>
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
                <tr key={request._id || request.requestId}>
                  <td>{request.itemName || request.name || 'N/A'}</td>
                  <td>{request.quantity || 0} units</td>
                  <td>
                    <span className={`priority-badge ${getPriorityClass(request.priority)}`}>
                      {request.priority || 'MEDIUM'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusClass(request.status)}`}>
                      {request.status || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="view-details-btn"
                      onClick={() => setSelectedRequest(request)}
                    >
                      View Details
                    </button>
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
          <div className="summary-icon"><Icon name="file-text" size={24} /></div>
          <div className="summary-content">
            <div className="summary-label">Total Requests</div>
            <div className="summary-value">{totalRequests}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon"><Icon name="clock" size={24} /></div>
          <div className="summary-content">
            <div className="summary-label">Pending</div>
            <div className="summary-value">{pendingRequests}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon"><Icon name="package" size={24} /></div>
          <div className="summary-content">
            <div className="summary-label">Total Units</div>
            <div className="summary-value">{totalUnits}</div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddProcurementModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            // Cache is automatically invalidated by the mutation
            setShowAddModal(false);
          }}
        />
      )}

      {selectedRequest && (
        <ProcurementDetailsModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}

      {showBulkUploadModal && (
        <BulkProcurementUploadModal
          onClose={() => setShowBulkUploadModal(false)}
          onSuccess={() => {
            setShowBulkUploadModal(false);
          }}
        />
      )}
    </div>
  );
};

export default Procurement;
