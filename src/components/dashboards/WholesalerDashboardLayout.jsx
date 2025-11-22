import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, HelpCircle, TruckIcon, BarChart3, Users, CreditCard, Settings, Menu, X } from 'lucide-react';

const WholesalerDashboardLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', label: 'Overview', icon: LayoutDashboard },
    { path: '/dashboard/retailers', label: 'Retailers Network', icon: Users },
    { path: '/dashboard/transactions', label: 'Transactions with retailers', icon: CreditCard },
    { path: '/wholesaler/shipping', label: 'Shipping Status', icon: TruckIcon }, // ✅ FIXED PATH
      { path: '/wholesaler/queries', label: 'Queries', icon: HelpCircle }, // ← ADD THIS LINE

    { path: '/wholesaler/settings', label: 'Shop Settings', icon: Settings },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen lg:flex lg:items-center lg:justify-center p-4" style={{ background: 'linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)' }}>
      <div className="lg:hidden fixed top-6 right-6 z-50">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-3 rounded-xl shadow-lg transition-all hover:scale-110" style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}>
          {sidebarOpen ? <X size={24} className="text-white" /> : <Menu size={24} className="text-white" />}
        </button>
      </div>

      <nav className={`fixed lg:static inset-y-0 left-0 z-40 w-80 lg:w-auto transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="h-full lg:h-auto rounded-3xl lg:rounded-2xl shadow-2xl lg:shadow-lg p-8 lg:p-6 m-4 lg:m-0" style={{ background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)', border: '1px solid rgba(255, 130, 130, 0.3)' }}>
          <div className="text-center mb-8 lg:mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 lg:w-12 lg:h-12 rounded-full mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}><span className="text-2xl lg:text-xl">🏭</span></div>
            <h1 className="text-2xl lg:text-lg font-bold mb-1" style={{ color: '#b91c1c' }}>Wholesaler</h1>
          </div>
          <div className="space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} className="flex items-center px-4 py-3 rounded-xl font-medium transition-all shadow-md hover:shadow-lg"
                  style={{ background: isActive(item.path) ? 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' : '#fff5f5', color: isActive(item.path) ? '#ffffff' : '#b91c1c', border: `2px solid ${isActive(item.path) ? '#ff5757' : '#fca5a5'}` }}>
                  <Icon size={20} className="mr-3" /><span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      <div className="lg:flex-1 lg:max-w-4xl w-full">
        <div className="rounded-2xl shadow-inner p-6 lg:p-8" style={{ background: '#ffffff', border: '2px solid #fca5a5' }}>{children}</div>
      </div>
      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

export default WholesalerDashboardLayout;