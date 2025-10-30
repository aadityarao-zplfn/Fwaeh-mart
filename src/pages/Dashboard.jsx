import { useAuth } from '../contexts/AuthContext';
import CustomerDashboard from '../components/CustomerDashboard';
import SellerDashboard from '../components/SellerDashboard';

const Dashboard = () => {
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {profile.full_name}
        </h1>
        <p className="text-gray-600 mt-2">
          Role: <span className="font-semibold capitalize">{profile.role}</span>
        </p>
      </div>

      {profile.role === 'customer' ? (
        <CustomerDashboard />
      ) : (
        <SellerDashboard />
      )}
    </div>
  );
};

export default Dashboard;
