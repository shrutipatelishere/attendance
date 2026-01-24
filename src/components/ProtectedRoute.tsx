import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { UserRole } from '../types/User';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { currentUser, isLoading, isAuthenticated } = useUser();

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(currentUser.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
