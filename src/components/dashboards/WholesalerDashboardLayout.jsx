import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';  // ✅ Fixed: contexts (plural)
import { Warehouse, Package, Users, TrendingUp, LogOut, User } from 'lucide-react';

const WholesalerDashboardLayout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: Warehouse },
    { path: '/dashboard/inventory', label: 'Inventory', icon: Package },
    { path: '/dashboard/retailers', label: 'Retailers', icon: Users },
    { path: '/dashboard/reports', label: 'Reports', icon: TrendingUp },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Warehouse className="w-8 h-8 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Wholesaler Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-700">
                <User className="w-4 h-4" />
                <span>{user?.name || 'Wholesaler'}</span>
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

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-white shadow-sm min-h-screen p-6">
          <nav className="space-y-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive(path)
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
};

export default WholesalerDashboardLayout;