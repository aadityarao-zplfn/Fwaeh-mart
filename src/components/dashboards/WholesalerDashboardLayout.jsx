import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, TruckIcon, BarChart3, Users, Settings } from 'lucide-react';

const WholesalerDashboardLayout = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/products', label: 'Bulk Products', icon: Package },
    { path: '/dashboard/orders', label: 'Bulk Orders', icon: TruckIcon },
    { path: '/dashboard/analytics', label: 'Sales Analytics', icon: BarChart3 },
    { path: '/dashboard/retailers', label: 'Retailer Network', icon: Users },
    { path: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)'
      }}
    >
      <div className="w-full max-w-5xl">
        {/* Main Card Container */}
        <div 
          className="rounded-3xl shadow-2xl p-8"
          style={{
            background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)',
            border: '1px solid rgba(255, 130, 130, 0.3)'
          }}
        >
          {/* Top Label */}
          <div className="text-center mb-4">
            <p 
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ color: '#dc2626' }}
            >
              Wholesaler Dashboard
            </p>
          </div>

          {/* Header with Icon */}
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
              }}
            >
              <span className="text-4xl">🏭</span>
            </div>
            <h1 
              className="text-4xl font-bold mb-2"
              style={{ color: '#b91c1c' }}
            >
              Welcome Back
            </h1>
            <p 
              className="text-base"
              style={{ color: '#dc2626' }}
            >
              Manage bulk inventory and retailer relationships
            </p>
          </div>

          {/* Navigation Tabs */}
          <nav className="mb-8">
            <div className="flex flex-wrap justify-center gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex items-center px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                    style={{
                      background: isActive(item.path) 
                        ? 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
                        : '#fff5f5',
                      color: isActive(item.path) ? '#ffffff' : '#b91c1c',
                      border: `2px solid ${isActive(item.path) ? '#ff5757' : '#fca5a5'}`,
                      transform: isActive(item.path) ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    <Icon size={18} className="mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Main Content Area */}
          <div 
            className="rounded-2xl shadow-inner p-8"
            style={{
              background: '#ffffff',
              border: '2px solid #fca5a5'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WholesalerDashboardLayout;