import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeadsPage from './pages/LeadsPage';
import AddLeadPage from './pages/AddLeadPage';
import LeadDetailPage from './pages/LeadDetailPage';
import UsersPage from './pages/UsersPage';
import AddUserPage from './pages/AddUserPage';
import RolesPage from './pages/RolesPage';
import './App.css';

// Layout wrapper for authenticated pages
const AuthenticatedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useUser();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="App">
      <Sidebar />
      <main className="app-main">
        {children}
      </main>
    </div>
  );
};

// Main routes component
const AppRoutes: React.FC = () => {
  const { isAuthenticated, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public route - Login */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <DashboardPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <LeadsPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-lead"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <AddLeadPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leads/:id"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout>
              <LeadDetailPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin and TL only routes */}
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['admin', 'team_leader']}>
            <AuthenticatedLayout>
              <UsersPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-user"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuthenticatedLayout>
              <AddUserPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute allowedRoles={['admin', 'team_leader']}>
            <AuthenticatedLayout>
              <RolesPage />
            </AuthenticatedLayout>
          </ProtectedRoute>
        }
      />

      {/* Catch all - redirect to dashboard or login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <UserProvider>
      <Router>
        <AppRoutes />
      </Router>
    </UserProvider>
  );
}

export default App;
