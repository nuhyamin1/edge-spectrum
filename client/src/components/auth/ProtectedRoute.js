import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    // You can replace this with a loading spinner component
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If allowedRoles is empty, allow access to any authenticated user
  if (allowedRoles.length === 0) {
    // If children is a function, call it with user
    if (typeof children === 'function') {
      return children({ user });
    }
    return children;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    // Redirect teachers to teacher dashboard and students to student dashboard
    return <Navigate to={user.role === 'teacher' ? '/dashboard' : '/dashboard/student'} replace />;
  }

  // If children is a function, call it with user
  if (typeof children === 'function') {
    return children({ user });
  }
  return children;
};

export default ProtectedRoute; 