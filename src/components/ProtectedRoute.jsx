import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [], requireRole = true }) => {
  // ✅ ALL HOOKS MUST BE CALLED AT THE TOP LEVEL
  const { user, profile, loading, error } = useAuth();
  const location = useLocation(); // ✅ Moved to top with other hooks

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="text-red-600 font-semibold">
          Error: {error}. Please try refreshing the page.
        </span>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🆕 REMOVED OTP CHECK - Login.jsx already handles this

  // If requireRole is false, allow access (for role selection page)
  if (!requireRole) {
    return children;
  }

  // Check if user has a role assigned
  if (!profile?.role) {
    return <Navigate to="/select-role" replace />;
  }

  // Check if user's role is in allowedRoles (if specified)
  if (allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;