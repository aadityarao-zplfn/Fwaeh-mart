import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, ShoppingCart, Package, User, Heart } from 'lucide-react';

const CustomerDashboardLayout = ({ children }) => {
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
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #ffc4d4 0%, #ffb8c8 50%, #ffa8b8 100%)'
      }}
    >
      <div className="w-full max-w-5xl">
        {/* Main Card Container */}
        <div 
          className="rounded-3xl shadow-2xl p-8"
          style={{
            background: 'linear-gradient(to bottom, #fff0f3, #ffe8ed)',
            border: '1px solid rgba(255, 180, 200, 0.3)'
          }}
        >
          {/* Top Label */}
          <div className="text-center mb-4">
            <p 
              className="text-sm font-semibold tracking-wide uppercase"
              style={{ color: '#dc2626' }}
            >
              Customer Dashboard
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
                        ? 'linear-gradient(135deg, #e88a9e 0%, #f5a5b8 100%)'
                        : '#fff5f7',
                      color: isActive(item.path) ? '#ffffff' : '#8b3a3a',
                      border: `2px solid ${isActive(item.path) ? '#e88a9e' : '#f5c4d0'}`,
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
              border: '2px solid #f5c4d0'
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboardLayout;