import React, { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalComponents: 110,
    availableComponents: 66,
    activeBorrows: 2,
    overdueItems: 1,
    lowStockAlerts: 2,
    efficiencyRate: 94
  });

  const [categoryData] = useState([
    { name: 'Sensors', value: 45 },
    { name: 'Actuators', value: 28 },
    { name: 'Microcontrollers', value: 22 },
    { name: 'SBCs', value: 15 }
  ]);

  useEffect(() => {
    // Fetch dashboard data from API
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const maxValue = Math.max(...categoryData.map(d => d.value));

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
          <div className="stat-icon purple">📦</div>
          <div className="stat-content">
            <div className="stat-label">Total Components</div>
            <div className="stat-value">{stats.totalComponents}</div>
            <div className="stat-detail">{stats.availableComponents} currently available</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">⏰</div>
          <div className="stat-content">
            <div className="stat-label">Active Borrows</div>
            <div className="stat-value">{stats.activeBorrows}</div>
            <div className="stat-detail red">{stats.overdueItems} item overdue</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pink">⚠️</div>
          <div className="stat-content">
            <div className="stat-label">Low Stock Alerts</div>
            <div className="stat-value">{stats.lowStockAlerts}</div>
            <div className="stat-detail red">Requires attention</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">📈</div>
          <div className="stat-content">
            <div className="stat-label">Efficiency Rate</div>
            <div className="stat-value">{stats.efficiencyRate}%</div>
            <div className="stat-detail green">↑ +2.5% from last month</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section">
          <h2 className="section-title">Inventory by Category</h2>
          <div className="chart-container">
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
              {[0, 15, 30, 45, 60].map(val => (
                <div key={val} className="y-axis-label">{val}</div>
              ))}
            </div>
          </div>
        </div>

        <div className="urgent-actions">
          <h2 className="section-title">Urgent Actions</h2>
          <div className="action-cards">
            <div className="action-card">
              <div className="action-icon red">⏰</div>
              <div className="action-content">
                <div className="action-title">Overdue Item</div>
                <div className="action-detail">Raspberry Pi 4</div>
                <div className="action-subdetail red">Borrowed by stu001</div>
              </div>
            </div>

            <div className="action-card">
              <div className="action-icon pink">⚠️</div>
              <div className="action-content">
                <div className="action-title">Procurement Alert</div>
                <div className="action-detail">2 items below threshold</div>
                <div className="action-subdetail red">Requires ordering</div>
              </div>
            </div>

            <div className="action-card">
              <div className="action-icon green">✓</div>
              <div className="action-content">
                <div className="action-title">System Status</div>
                <div className="action-detail">All systems operational</div>
                <div className="action-subdetail green">Last checked 2 mins ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

