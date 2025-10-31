import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';  // ✅ Fixed: contexts (plural)
import { ShoppingCart, Package, Store, LogOut, User } from 'lucide-react';

const CustomerDashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'My Orders', icon: Package },
    { path: '/products', label: 'Browse Products', icon: Store },
    { path: '/cart', label: 'Cart', icon: ShoppingCart },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span>{user?.name || 'Guest'}</span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <nav className="mb-8">
          <div className="flex space-x-2 bg-white rounded-lg shadow-sm p-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all ${
                  isActive(path)
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* Page Content */}
        <main>{children}</main>
      </div>
    </div>
  );
};

export default CustomerDashboardLayout;