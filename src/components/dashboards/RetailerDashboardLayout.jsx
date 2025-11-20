import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, BarChart3, CreditCard, Users, HelpCircle, Settings, MessageSquare, Menu, X } from 'lucide-react';

const RetailerDashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { path: '/dashboard/payments', label: 'Payments pending', icon: CreditCard },
  { path: '/dashboard/orders', label: 'Customer Orders', icon: ShoppingBag },
  { path: '/dashboard/queries', label: 'Queries', icon: HelpCircle },
  { path: '/dashboard/settings', label: 'Shop Settings', icon: Settings },
];

  const isActive = (path) => location.pathname === path;

  return (
    <div 
      className="min-h-screen lg:flex lg:items-center lg:justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)'
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

      {/* Sidebar */}
      <nav className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-80 lg:w-auto transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div 
          className="h-full lg:h-auto rounded-3xl lg:rounded-2xl shadow-2xl lg:shadow-lg p-8 lg:p-6 m-4 lg:m-0"
          style={{
            background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)',
            border: '1px solid rgba(255, 130, 130, 0.3)'
          }}
        >
          <div className="text-center mb-6 lg:mb-4">
            <p className="text-sm font-semibold tracking-wide uppercase" style={{ color: '#dc2626' }}>
              Retailer Dashboard
            </p>
          </div>

          <div className="text-center mb-8 lg:mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 lg:w-12 lg:h-12 rounded-full mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}>
              <span className="text-2xl lg:text-xl">🏪</span>
            </div>
            <h1 className="text-2xl lg:text-lg font-bold mb-1" style={{ color: '#b91c1c' }}>
              Welcome Back
            </h1>
            <p className="text-sm lg:text-xs" style={{ color: '#dc2626' }}>
              Manage products and grow business
            </p>
          </div>

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
                      ? 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
                      : '#fff5f5',
                    color: isActive(item.path) ? '#ffffff' : '#b91c1c',
                    border: `2px solid ${isActive(item.path) ? '#ff5757' : '#fca5a5'}`,
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
        <div className="rounded-3xl shadow-2xl p-6 lg:p-8" style={{ background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)', border: '1px solid rgba(255, 130, 130, 0.3)' }}>
          {children}
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
};

export default RetailerDashboardLayout;