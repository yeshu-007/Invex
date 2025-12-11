import React, { useMemo, useState } from 'react';
import './BorrowingRecords.css';
import Icon from '../Icon';
import { 
  useGetBorrowingRecordsQuery,
  useApproveBorrowingRequestMutation,
  useRejectBorrowingRequestMutation
} from '../../store/api/adminApi';

const BorrowingRecords = () => {
  const { 
    data: borrowingRecordsData, 
    isLoading, 
    isError,
    error 
  } = useGetBorrowingRecordsQuery();

  const [approveBorrowingRequest, { isLoading: isApproving }] = useApproveBorrowingRequestMutation();
  const [rejectBorrowingRequest, { isLoading: isRejecting }] = useRejectBorrowingRequestMutation();
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  // Transform API data
  const recordsArray = useMemo(() => {
    if (!borrowingRecordsData) return [];
    return Array.isArray(borrowingRecordsData) ? borrowingRecordsData : [];
  }, [borrowingRecordsData]);

  // Sort by most recent first
  const sortedRecords = useMemo(() => {
    return [...recordsArray].sort((a, b) => {
      const dateA = new Date(a.borrowDate || a.createdAt || 0);
      const dateB = new Date(b.borrowDate || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [recordsArray]);

  const totalRecords = sortedRecords.length;
  const pendingRequests = sortedRecords.filter(r => r && r.status === 'pending').length;
  const activeBorrows = sortedRecords.filter(r => r && r.status === 'borrowed').length;
  const returnedBorrows = sortedRecords.filter(r => r && r.status === 'returned').length;
  
  // Get unique students
  const uniqueStudents = useMemo(() => {
    const studentSet = new Set();
    sortedRecords.forEach(record => {
      if (record.userId) {
        studentSet.add(record.userId);
      }
    });
    return Array.from(studentSet);
  }, [sortedRecords]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'borrowed': return 'borrowed';
      case 'returned': return 'returned';
      case 'overdue': return 'overdue';
      case 'rejected': return 'rejected';
      default: return 'borrowed';
    }
  };

  const handleApprove = async (recordId) => {
    if (window.confirm('Are you sure you want to approve this borrowing request?')) {
      try {
        await approveBorrowingRequest(recordId).unwrap();
      } catch (err) {
        alert(err?.data?.message || 'Failed to approve request');
      }
    }
  };

  const handleReject = async (recordId) => {
    try {
      await rejectBorrowingRequest({ 
        recordId, 
        remarks: rejectRemarks || 'Request rejected by admin' 
      }).unwrap();
      setShowRejectModal(null);
      setRejectRemarks('');
    } catch (err) {
      alert(err?.data?.message || 'Failed to reject request');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isOverdue = (record) => {
    if (record.status !== 'borrowed' || !record.expectedReturnDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expectedDate = new Date(record.expectedReturnDate);
    expectedDate.setHours(0, 0, 0, 0);
    return expectedDate < today;
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="borrowing-records">
        <div className="borrowing-records-header">
          <div>
            <h1 className="borrowing-records-title">Borrowing Records</h1>
            <p className="borrowing-records-subtitle">View all student borrowing history</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Icon name="loader-2" size={32} className="spinning" />
          <p style={{ marginTop: '20px', color: '#666' }}>Loading borrowing records...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (isError) {
    return (
      <div className="borrowing-records">
        <div className="borrowing-records-header">
          <div>
            <h1 className="borrowing-records-title">Borrowing Records</h1>
            <p className="borrowing-records-subtitle">View all student borrowing history</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#e74c3c', marginBottom: '20px' }}>
            Error loading borrowing records: {error?.data?.message || 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="borrowing-records">
      <div className="borrowing-records-header">
        <div>
          <h1 className="borrowing-records-title">Borrowing Records</h1>
          <p className="borrowing-records-subtitle">View all student borrowing history</p>
        </div>
      </div>

      <div className="borrowing-records-table-container">
        <table className="borrowing-records-table">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Component Name</th>
              <th>Quantity</th>
              <th>Borrow Date</th>
              <th>Expected Return</th>
              <th>Actual Return</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedRecords.length > 0 ? (
              sortedRecords.map(record => {
                const overdue = isOverdue(record);
                return (
                  <tr key={record._id || record.recordId}>
                    <td>{record.userId || 'N/A'}</td>
                    <td>{record.componentName || 'N/A'}</td>
                    <td>{record.quantity || 1}</td>
                    <td>{formatDate(record.borrowDate || record.createdAt)}</td>
                    <td>
                      {formatDate(record.expectedReturnDate)}
                      {overdue && (
                        <span style={{ 
                          marginLeft: '8px', 
                          color: '#dc3545', 
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          (Overdue)
                        </span>
                      )}
                    </td>
                    <td>{formatDate(record.actualReturnDate)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(record.status)} ${overdue ? 'overdue' : ''}`}>
                        {overdue ? 'OVERDUE' : (record.status || 'borrowed').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      {record.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="approve-btn"
                            onClick={() => handleApprove(record.recordId)}
                            disabled={isApproving || isRejecting}
                          >
                            <Icon name="check" size={16} style={{ marginRight: '4px' }} />
                            Approve
                          </button>
                          <button
                            className="reject-btn"
                            onClick={() => setShowRejectModal(record.recordId)}
                            disabled={isApproving || isRejecting}
                          >
                            <Icon name="x" size={16} style={{ marginRight: '4px' }} />
                            Reject
                          </button>
                        </div>
                      )}
                      {record.status !== 'pending' && (
                        <span style={{ color: '#999', fontSize: '12px' }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  No borrowing records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="borrowing-records-summary">
        <div className="summary-card">
          <div className="summary-icon"><Icon name="file-text" size={24} /></div>
          <div className="summary-content">
            <div className="summary-label">Total Records</div>
            <div className="summary-value">{totalRecords}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon"><Icon name="users" size={24} /></div>
          <div className="summary-content">
            <div className="summary-label">Unique Students</div>
            <div className="summary-value">{uniqueStudents.length}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon"><Icon name="clock" size={24} /></div>
          <div className="summary-content">
            <div className="summary-label">Pending Requests</div>
            <div className="summary-value">{pendingRequests}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon"><Icon name="package" size={24} /></div>
          <div className="summary-content">
            <div className="summary-label">Active Borrows</div>
            <div className="summary-value">{activeBorrows}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon"><Icon name="check-circle" size={24} /></div>
          <div className="summary-content">
            <div className="summary-label">Returned</div>
            <div className="summary-value">{returnedBorrows}</div>
          </div>
        </div>
      </div>

      {showRejectModal && (
        <div className="modal-overlay" onClick={() => { setShowRejectModal(null); setRejectRemarks(''); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowRejectModal(null); setRejectRemarks(''); }}>×</button>
            <h2 className="modal-title">Reject Borrowing Request</h2>
            <p className="modal-text">Are you sure you want to reject this request?</p>
            <div className="form-group">
              <label htmlFor="remarks" className="form-label">Remarks (optional)</label>
              <textarea
                id="remarks"
                className="form-input"
                placeholder="Enter reason for rejection..."
                value={rejectRemarks}
                onChange={(e) => setRejectRemarks(e.target.value)}
                rows="3"
              />
            </div>
            <div className="modal-buttons">
              <button 
                type="button" 
                className="btn-cancel" 
                onClick={() => { setShowRejectModal(null); setRejectRemarks(''); }}
                disabled={isRejecting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="reject-btn" 
                onClick={() => handleReject(showRejectModal)}
                disabled={isRejecting}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowingRecords;

