import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#222222]">
        <div className="w-10 h-10 border-4 border-sliit-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. If no user is logged in, send to login page
  if (!user) return <Navigate to="/auth" replace />;

  // 2. If the route specifies allowed roles, check if the user has permission
  if (allowedRoles && allowedRoles.length > 0) {
    // ADMIN has a master key and can access everything
    if (user.role === 'ADMIN') {
        return children;
    }
    
    
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />; // Redirect unauthorized users
    }
  }

  return children;
}