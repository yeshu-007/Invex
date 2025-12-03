import React, { useMemo } from 'react';
import './Dashboard.css';
import Icon from '../Icon';
import { 
  useGetComponentsQuery, 
  useGetBorrowingRecordsQuery 
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

  // Transform and calculate stats from cached data
  const { stats, categoryData, urgentActions } = useMemo(() => {
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
        overdueItems: overdueItemsCount,
        lowStockAlerts,
        efficiencyRate
      },
      categoryData,
      urgentActions: {
        overdueItems: overdueItemsDetails,
        procurementAlerts: lowStockComponents
      }
    };
  }, [componentsData, borrowingRecordsData]);

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
    </div>
  );
};

export default Dashboard;
