import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], requireRole = true }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
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

  // Check if user has a role assigned
  if (!profile?.role) {
    // User is authenticated but has no role - redirect to role selection
    return <Navigate to="/select-role" replace />;
  }

  // Check if user's role is in allowedRoles (if specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    // User doesn't have permission for this route
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
