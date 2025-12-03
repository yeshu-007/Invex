import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StudentView from './components/StudentView';
import AdminLogin from './components/Admin/AdminLogin';
import AdminLayout from './components/Admin/AdminLayout';
import Dashboard from './components/Admin/Dashboard';
import Inventory from './components/Admin/Inventory';
import Procurement from './components/Admin/Procurement';
import SmartLab from './components/Admin/SmartLab';
import './App.css';

// Protected Route component for admin pages
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || user.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Student View - Default Route */}
        <Route path="/" element={<StudentView />} />
        
        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* Admin Routes - Protected */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Inventory />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/procurement"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Procurement />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/smart-lab"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <SmartLab />
              </AdminLayout>
            </ProtectedRoute>
          }
        />
        
        {/* Redirect admin root to dashboard */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
