import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AttendanceProvider } from './context/AttendanceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Landing from './components/Landing';
import MemberManager from './components/MemberManager';
import History from './components/History';
import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import MissPunchRequests from './components/MissPunchRequests';
import Payroll from './components/Payroll';
import Settings from './components/Settings';
import MonthlyReport from './components/MonthlyReport';

const AdminDashboard = () => <div className="glass-panel"><h2>Admin Dashboard</h2><p>Overview of all employee activities.</p></div>;

// Protected Route Wrapper
const PrivateRoute = ({ children, requireAdmin }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Prevent premature redirect
  if (!currentUser) return <Navigate to="/login" />;

  // If route requires Admin but user is Staff, redirect to employee portal
  if (requireAdmin && userRole !== 'Admin') {
    return <Navigate to="/employee" />;
  }

  return children;
};

// Layout wrapper to keep Navbar consistent
const Layout = ({ children }) => {
  return (
    <div className="app-container animate-fade-in">
      <Navbar />
      <main style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: 'clamp(0.75rem, 3vw, 2rem)'
      }}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AttendanceProvider>
        <Router>
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            {/* Staff Route - Combined Dashboard with Tabs */}
            <Route path="/employee" element={
              <PrivateRoute>
                <Layout>
                  <EmployeeDashboard />
                </Layout>
              </PrivateRoute>
            } />

            {/* Legacy routes - redirect to new employee dashboard */}
            <Route path="/attendance" element={<Navigate to="/employee" replace />} />
            <Route path="/my-history" element={<Navigate to="/employee" replace />} />

            {/* Admin Routes */}
            <Route path="/" element={
              <PrivateRoute requireAdmin={true}>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/staff" element={
              <PrivateRoute requireAdmin={true}>
                <Layout>
                  <MemberManager />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/history" element={
              <PrivateRoute requireAdmin={true}>
                <Layout>
                  <History />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/admin" element={
              <PrivateRoute requireAdmin={true}>
                <Layout>
                  <AdminDashboard />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/payroll" element={
              <PrivateRoute requireAdmin={true}>
                <Layout>
                  <Payroll />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/settings" element={
              <PrivateRoute requireAdmin={true}>
                <Layout>
                  <Settings />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/miss-punch-requests" element={
              <PrivateRoute requireAdmin={true}>
                <Layout>
                  <MissPunchRequests />
                </Layout>
              </PrivateRoute>
            } />

            <Route path="/reports" element={
              <PrivateRoute requireAdmin={true}>
                <Layout>
                  <MonthlyReport />
                </Layout>
              </PrivateRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AttendanceProvider>
    </AuthProvider>
  );
}

export default App;
