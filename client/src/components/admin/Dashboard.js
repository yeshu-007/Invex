import React, { useMemo, useState } from 'react';
import './Dashboard.css';
import Icon from '../Icon';
import { 
  useGetComponentsQuery, 
  useGetBorrowingRecordsQuery,
  useApproveBorrowingRequestMutation,
  useRejectBorrowingRequestMutation
} from '../../store/api/adminApi';

const Dashboard = () => {
  // Use RTK Query hooks - automatically cached!
  const { 
    data: componentsData, 
    isLoading: componentsLoading,
    isError: componentsError 
  } = useGetComponentsQuery();

  const { 
    data: borrowingRecordsData, 
    isLoading: borrowingLoading,
    isError: borrowingError 
  } = useGetBorrowingRecordsQuery();

  const [approveBorrowingRequest, { isLoading: isApproving }] = useApproveBorrowingRequestMutation();
  const [rejectBorrowingRequest, { isLoading: isRejecting }] = useRejectBorrowingRequestMutation();
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  // Transform and calculate stats from cached data
  const { stats, categoryData, urgentActions, recentActivities, pendingRequests } = useMemo(() => {
    const components = Array.isArray(componentsData) ? componentsData : [];
    const borrowingRecords = Array.isArray(borrowingRecordsData) ? borrowingRecordsData : [];

    // Calculate stats from components
    const totalComponents = components.length;
    const availableComponents = components.reduce((sum, comp) => sum + (comp.availableQuantity || 0), 0);
    const totalQuantity = components.reduce((sum, comp) => sum + (comp.totalQuantity || 0), 0);
    const lowStockAlerts = components.filter(comp => comp.availableQuantity <= (comp.threshold || 5)).length;
    const efficiencyRate = totalQuantity > 0 
      ? Math.round((availableComponents / totalQuantity) * 100) 
      : 100;

    // Calculate category distribution
    const categoryMap = {};
    components.forEach(comp => {
      const category = comp.category || 'Other';
      categoryMap[category] = (categoryMap[category] || 0) + 1;
    });
    const categoryData = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value
    }));

    // Calculate borrowing stats
    const activeBorrows = borrowingRecords.filter(record => record.status === 'borrowed');
    const activeBorrowsCount = activeBorrows.length;
    
    // Get unique active borrowers (most recent)
    const uniqueActiveBorrowers = Array.from(
      new Set(activeBorrows.map(record => record.userId))
    );
    const activeBorrowersCount = uniqueActiveBorrowers.length;

    // Get recent borrowing activities (pending requests and recent borrows)
    const pendingRequestsList = borrowingRecords
      .filter(record => record.status === 'pending')
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || 0);
        const dateB = new Date(b.createdAt || 0);
        return dateB - dateA;
      });
    const recentBorrows = borrowingRecords
      .filter(record => record.status === 'borrowed' || record.status === 'returned')
      .sort((a, b) => {
        const dateA = new Date(a.borrowDate || a.createdAt || 0);
        const dateB = new Date(b.borrowDate || b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(0, 5);

    // Combine pending requests and recent borrows for recent activities
    const recentActivities = [
      ...pendingRequestsList.map(r => ({ ...r, activityType: 'pending' })),
      ...recentBorrows.map(r => ({ ...r, activityType: r.status }))
    ]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.borrowDate || 0);
        const dateB = new Date(b.createdAt || b.borrowDate || 0);
        return dateB - dateA;
      })
      .slice(0, 5);

    // Calculate overdue items
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueItems = activeBorrows.filter(record => {
      if (!record.expectedReturnDate) return false;
      const expectedDate = new Date(record.expectedReturnDate);
      expectedDate.setHours(0, 0, 0, 0);
      return expectedDate < today;
    });
    const overdueItemsCount = overdueItems.length;

    // Get overdue items details for urgent actions
    const overdueItemsDetails = overdueItems
      .sort((a, b) => new Date(a.expectedReturnDate) - new Date(b.expectedReturnDate))
      .slice(0, 5)
      .map(record => ({
        recordId: record.recordId,
        componentName: record.componentName,
        userId: record.userId,
        expectedReturnDate: record.expectedReturnDate,
        daysOverdue: Math.floor((today - new Date(record.expectedReturnDate)) / (1000 * 60 * 60 * 24))
      }));

    // Get low stock components for urgent actions
    const lowStockComponents = components
      .filter(comp => comp.availableQuantity <= (comp.threshold || 5))
      .sort((a, b) => a.availableQuantity - b.availableQuantity)
      .slice(0, 5)
      .map(comp => ({
        componentId: comp.componentId,
        componentName: comp.name,
        availableQuantity: comp.availableQuantity,
        threshold: comp.threshold || 5,
        category: comp.category
      }));

    return {
      stats: {
        totalComponents,
        availableComponents,
        activeBorrows: activeBorrowsCount,
        activeBorrowers: activeBorrowersCount,
        pendingRequests: pendingRequestsList.length,
        overdueItems: overdueItemsCount,
        lowStockAlerts,
        efficiencyRate
      },
      categoryData,
      recentActivities,
      pendingRequests: pendingRequestsList,
      urgentActions: {
        overdueItems: overdueItemsDetails,
        procurementAlerts: lowStockComponents
      }
    };
  }, [componentsData, borrowingRecordsData]);

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

  const loading = componentsLoading || borrowingLoading;
  const error = componentsError || borrowingError;
  const maxValue = categoryData.length > 0 ? Math.max(...categoryData.map(d => d.value)) : 1;

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Overview of your IoT Lab inventory</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Icon name="loader-2" size={32} className="spinning" />
          <p style={{ marginTop: '20px', color: '#666' }}>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">Dashboard</h1>
            <p className="dashboard-subtitle">Overview of your IoT Lab inventory</p>
          </div>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: '#e74c3c', marginBottom: '20px' }}>
            Error loading dashboard data. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">Overview of your IoT Lab inventory</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><Icon name="package" size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Total Components</div>
            <div className="stat-value">{stats.totalComponents}</div>
            <div className="stat-detail">{stats.availableComponents} currently available</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue"><Icon name="clock" size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Active Borrows</div>
            <div className="stat-value">{stats.activeBorrows}</div>
            <div className="stat-detail red">{stats.overdueItems} item overdue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><Icon name="alert-circle" size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Pending Requests</div>
            <div className="stat-value">{stats.pendingRequests}</div>
            <div className="stat-detail">Awaiting approval</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink"><Icon name="alert-triangle" size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Low Stock Alerts</div>
            <div className="stat-value">{stats.lowStockAlerts}</div>
            <div className="stat-detail red">Requires attention</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><Icon name="trending-up" size={24} /></div>
          <div className="stat-content">
            <div className="stat-label">Efficiency Rate</div>
            <div className="stat-value">{stats.efficiencyRate}%</div>
            <div className="stat-detail green">Availability rate</div>
          </div>
        </div>
      </div>

      {pendingRequests.length > 0 && (
        <div className="pending-requests-section">
          <div className="pending-requests-header">
            <h2 className="section-title">
              <Icon name="clock" size={20} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              Pending Borrowing Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="pending-requests-list">
            {pendingRequests.map((request) => {
              const requestDate = new Date(request.createdAt || Date.now());
              return (
                <div key={request.recordId} className="pending-request-card">
                  <div className="pending-request-info">
                    <div className="pending-request-main">
                      <div className="pending-request-component">{request.componentName}</div>
                      <div className="pending-request-details">
                        <span><Icon name="user" size={14} style={{ marginRight: '4px' }} />{request.userId}</span>
                        <span><Icon name="package" size={14} style={{ marginRight: '4px' }} />{request.quantity} unit{request.quantity !== 1 ? 's' : ''}</span>
                        <span><Icon name="calendar" size={14} style={{ marginRight: '4px' }} />{requestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      {request.expectedReturnDate && (
                        <div className="pending-request-return">
                          Expected return: {new Date(request.expectedReturnDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="pending-request-actions">
                    <button
                      className="approve-btn-dashboard"
                      onClick={() => handleApprove(request.recordId)}
                      disabled={isApproving || isRejecting}
                    >
                      <Icon name="check" size={16} />
                      Approve
                    </button>
                    <button
                      className="reject-btn-dashboard"
                      onClick={() => setShowRejectModal(request.recordId)}
                      disabled={isApproving || isRejecting}
                    >
                      <Icon name="x" size={16} />
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="dashboard-content">
        <div className="chart-section">
          <h2 className="section-title">Inventory by Category</h2>
          <div className="chart-container">
            {categoryData.length > 0 ? (
              <>
                <div className="chart-bars">
                  {categoryData.map((item, idx) => (
                    <div key={idx} className="chart-bar-wrapper">
                      <div className="chart-bar-label">{item.name}</div>
                      <div className="chart-bar-container">
                        <div
                          className="chart-bar"
                          style={{ height: `${(item.value / maxValue) * 100}%` }}
                        >
                          <span className="chart-bar-value">{item.value}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chart-y-axis">
                  {Array.from({ length: 5 }, (_, i) => Math.floor((maxValue / 4) * i)).map(val => (
                    <div key={val} className="y-axis-label">{val}</div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No category data available
              </div>
            )}
          </div>
          
          <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #e0e0e0' }}>
            <h3 style={{ fontSize: '16px', color: '#333', marginBottom: '15px', fontWeight: '600' }}>
              Recent Borrowing Activities
            </h3>
            {recentActivities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recentActivities.map((activity, idx) => {
                  const activityDate = new Date(activity.createdAt || activity.borrowDate || Date.now());
                  const isPending = activity.status === 'pending';
                  const isBorrowed = activity.status === 'borrowed';
                  const isReturned = activity.status === 'returned';
                  
                  return (
                    <div 
                      key={activity.recordId || idx} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        padding: '12px',
                        backgroundColor: '#f9f9f9',
                        borderRadius: '8px'
                      }}
                    >
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        backgroundColor: isPending ? '#fff3e0' : isBorrowed ? '#e3f2fd' : '#e8f5e9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Icon 
                          name={isPending ? 'clock' : isReturned ? 'check-circle' : 'package'} 
                          size={18} 
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', color: '#333', fontWeight: '500' }}>
                          {activity.componentName}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {activity.userId} • {activity.quantity} unit{activity.quantity !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#666',
                          marginBottom: '2px'
                        }}>
                          {activityDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '500',
                          backgroundColor: isPending ? '#fff3e0' : isBorrowed ? '#e3f2fd' : '#e8f5e9',
                          color: isPending ? '#e65100' : isBorrowed ? '#1976d2' : '#2e7d32'
                        }}>
                          {isPending ? 'PENDING' : isBorrowed ? 'BORROWED' : 'RETURNED'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '14px' }}>
                No recent borrowing activities
              </div>
            )}
          </div>
        </div>

        <div className="urgent-actions">
          <h2 className="section-title">Urgent Actions</h2>
          <div className="action-cards">
            {urgentActions.overdueItems.length > 0 ? (
              urgentActions.overdueItems.slice(0, 1).map((item, idx) => (
                <div key={idx} className="action-card">
                  <div className="action-icon red"><Icon name="clock" size={24} /></div>
                  <div className="action-content">
                    <div className="action-title">Overdue Item</div>
                    <div className="action-detail">{item.componentName}</div>
                    <div className="action-subdetail red">
                      Borrowed by {item.userId} • {item.daysOverdue} day{item.daysOverdue !== 1 ? 's' : ''} overdue
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="action-card">
                <div className="action-icon green"><Icon name="check-circle" size={24} /></div>
                <div className="action-content">
                  <div className="action-title">No Overdue Items</div>
                  <div className="action-detail">All items returned on time</div>
                  <div className="action-subdetail green">Great job!</div>
                </div>
              </div>
            )}

            {urgentActions.procurementAlerts.length > 0 ? (
              <div className="action-card">
                <div className="action-icon pink"><Icon name="alert-triangle" size={24} /></div>
                <div className="action-content">
                  <div className="action-title">Procurement Alert</div>
                  <div className="action-detail">
                    {urgentActions.procurementAlerts.length} item{urgentActions.procurementAlerts.length !== 1 ? 's' : ''} below threshold
                  </div>
                  <div className="action-subdetail red">
                    {urgentActions.procurementAlerts[0]?.componentName || 'Requires ordering'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="action-card">
                <div className="action-icon green"><Icon name="check-circle" size={24} /></div>
                <div className="action-content">
                  <div className="action-title">Stock Levels Good</div>
                  <div className="action-detail">All items above threshold</div>
                  <div className="action-subdetail green">No action needed</div>
                </div>
              </div>
            )}

            <div className="action-card">
              <div className="action-icon green"><Icon name="check-circle" size={24} /></div>
              <div className="action-content">
                <div className="action-title">System Status</div>
                <div className="action-detail">All systems operational</div>
                <div className="action-subdetail green">Last checked just now</div>
              </div>
            </div>
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
                className="reject-btn-dashboard" 
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

export default Dashboard;
