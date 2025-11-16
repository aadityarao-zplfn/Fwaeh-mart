import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], requireRole = true }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // 🆕 CRITICAL FIX: Show loading until we have both user AND profile state
  if (loading || (user && !profile)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If requireRole is false, allow access (for role selection page)
  if (!requireRole) {
    return children;
  }

  // 🆕 FIX: Only redirect to role selection if profile exists but has no role
  // This prevents redirecting while profile is still loading
  if (profile && !profile.role) {
    return <Navigate to="/select-role" replace />;
  }

  // Check if user's role is in allowedRoles (if specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
