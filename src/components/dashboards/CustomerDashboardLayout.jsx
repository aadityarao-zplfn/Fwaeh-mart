import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, Package, User, Heart, Menu, X } from 'lucide-react';

const CustomerDashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: Home },
    { path: '/products', label: 'Browse Products', icon: ShoppingBag },
    { path: '/cart', label: 'My Cart', icon: ShoppingCart },
    { path: '/orders', label: 'My Orders', icon: Package },
    { path: '/wishlist', label: 'Wishlist', icon: Heart },
    { path: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div 
      className="min-h-screen lg:flex lg:items-center lg:justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #ffc4d4 0%, #ffb8c8 50%, #ffa8b8 100%)'
      }}
    >
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-6 right-6 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 rounded-xl shadow-lg transition-all hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
          }}
        >
          {sidebarOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <Menu size={24} className="text-white" />
          )}
        </button>
      </div>

      {/* Sidebar - Hidden on mobile, slides in when open */}
      <nav className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-80 lg:w-auto transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div 
          className="h-full lg:h-auto rounded-3xl lg:rounded-2xl shadow-2xl lg:shadow-lg p-8 lg:p-6 m-4 lg:m-0"
          style={{
            background: 'linear-gradient(to bottom, #fff0f3, #ffe8ed)',
            border: '1px solid rgba(255, 180, 200, 0.3)'
          }}
        >
          {/* Top Label - Hidden on mobile in sidebar */}
          <div className="text-center mb-6 lg:mb-4">
            <p 
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ color: '#dc2626' }}
            >
              Customer Dashboard
            </p>
          </div>

          {/* Header with Icon - Hidden on mobile in sidebar */}
          <div className="text-center mb-8 lg:mb-6">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 lg:w-12 lg:h-12 rounded-full mb-3 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
              }}
            >
              <span className="text-2xl lg:text-xl">🛍️</span>
            </div>
            <h1 
              className="text-2xl lg:text-lg font-bold mb-1"
              style={{ color: '#b91c1c' }}
            >
              Welcome Back
            </h1>
            <p 
              className="text-sm lg:text-xs"
              style={{ color: '#dc2626' }}
            >
              Explore products and manage orders
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center px-4 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                  style={{
                    background: isActive(item.path) 
                      ? 'linear-gradient(135deg, #e88a9e 0%, #f5a5b8 100%)'
                      : '#fff5f7',
                    color: isActive(item.path) ? '#ffffff' : '#8b3a3a',
                    border: `2px solid ${isActive(item.path) ? '#e88a9e' : '#f5c4d0'}`,
                    transform: isActive(item.path) ? 'scale(1.02)' : 'scale(1)'
                  }}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="text-lg lg:text-base">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="lg:flex-1 lg:max-w-4xl w-full">
        {/* Main Card Container */}
        <div 
          className="rounded-3xl shadow-2xl p-6 lg:p-8"
          style={{
            background: 'linear-gradient(to bottom, #fff0f3, #ffe8ed)',
            border: '1px solid rgba(255, 180, 200, 0.3)'
          }}
        >
          {/* Top Label - Only show on desktop (hidden in mobile sidebar) */}
          <div className="text-center mb-4 hidden lg:block">
            <p 
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ color: '#dc2626' }}
            >
              Customer Dashboard
            </p>
          </div>

          {/* Header with Icon - Only show on desktop (hidden in mobile sidebar) */}
          <div className="text-center mb-8 hidden lg:block">
            <div 
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
              }}
            >
              <span className="text-4xl">🛍️</span>
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
              Explore products and manage your orders
            </p>
          </div>

          {/* Main Content Area */}
          <div 
            className="rounded-2xl shadow-inner p-6 lg:p-8"
            style={{
              background: '#ffffff',
              border: '2px solid #f5c4d0'
            }}
          >
            {children}
          </div>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default CustomerDashboardLayout;