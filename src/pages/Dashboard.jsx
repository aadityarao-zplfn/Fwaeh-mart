import { useAuth } from '../contexts/AuthContext';
import CustomerDashboard from '../components/CustomerDashboard';
import SellerDashboard from '../components/SellerDashboard';

const Dashboard = () => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile?.full_name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Role: <span className="font-medium capitalize">{profile?.role}</span>
        </p>
      </div>

      {profile?.role === 'customer' ? (
        <CustomerDashboard />
      ) : (
        <SellerDashboard />
      )}
    </div>
  );
};

export default Dashboard;
