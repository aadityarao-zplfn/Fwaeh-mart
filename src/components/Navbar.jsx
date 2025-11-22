import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, LogOut, LayoutDashboard } from 'lucide-react';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';
import { useCart } from '../contexts/CartContext';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { cartCount, updateCartCount, refreshCart } = useCart(); // ✅ Use the correct functions

  // Fetch cart count when user logs in
  useEffect(() => {
    if (user && profile?.role === 'customer') {
      refreshCart(); // ✅ Use refreshCart instead of fetchCartCount
      
      const cartSubscription = supabase
        .channel('cart_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            refreshCart(); // ✅ Use refreshCart on cart changes
          }
        )
        .subscribe();

      return () => {
        cartSubscription.unsubscribe();
      };
    } else {
      updateCartCount(0); // ✅ Reset when user logs out or is not customer
    }
  }, [user, profile]);

  const handleSignOut = async () => {
    updateCartCount(0); // ✅ Reset cart count on logout using updateCartCount
    await signOut();
    navigate('/login');
  };

  return (
    <nav 
      className="shadow-md sticky top-0 z-50"
      style={{ background: 'linear-gradient(to right, #fff5f5, #ffe8e8)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center text-2xl font-bold transition-all hover:opacity-80"
            style={{ color: '#b91c1c' }}
          >
            <img 
              src="/logo.png" 
              alt="Fwaeh Mart Logo" 
              className="h-10 w-10 mr-3 object-contain" 
            />
            Fwaeh Mart
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/products" 
              className="font-medium transition-all hover:opacity-80"
              style={{ color: '#dc2626' }}
            >
              Products
            </Link>
            {/* ✅ NEW SHOPS LINK */}
            <Link 
              to="/shops" 
              className="font-medium transition-all hover:opacity-80"
              style={{ color: '#dc2626' }}
            >
              Shops
            </Link>

            {user && profile?.role === 'customer' && (
              <Link 
                to="/cart" 
                className="font-medium transition-all hover:opacity-80 flex items-center relative"
                style={{ color: '#dc2626' }}
              >
                <ShoppingCart size={20} className="mr-1" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount > 0 && (
                  <span 
                    className="absolute -top-2 -right-2 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center font-medium transition-all hover:opacity-80"
                  style={{ color: '#dc2626' }}
                >
                  <LayoutDashboard size={20} className="mr-1" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                
                <NotificationBell />

                <button
                  onClick={handleSignOut}
                  className="flex items-center font-medium transition-all hover:opacity-80"
                  style={{ color: '#dc2626' }}
                >
                  <LogOut size={20} className="mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
                <div 
                  className="text-sm hidden lg:block font-medium"
                  style={{ color: '#b91c1c' }}
                >
                  {profile?.full_name}
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="font-medium transition-all hover:opacity-80"
                  style={{ color: '#dc2626' }}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg font-medium text-white transition-all shadow-md hover:shadow-lg hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Cart Icon */}
      {user && profile?.role === 'customer' && (
        <div 
          className="md:hidden border-t flex justify-around py-2"
          style={{ borderColor: '#fca5a5' }}
        >
          <Link 
            to="/products" 
            className="font-medium transition-all hover:opacity-80"
            style={{ color: '#dc2626' }}
          >
            Products
          </Link>
          <Link 
            to="/shops" 
            className="font-medium transition-all hover:opacity-80"
            style={{ color: '#dc2626' }}
          >
            Shops
          </Link>
          <Link 
            to="/cart" 
            className="flex items-center justify-center font-medium transition-all relative"
            style={{ color: '#dc2626' }}
          >
            <ShoppingCart size={20} className="mr-2" />
            <span>Cart</span>
            {cartCount > 0 && (
              <span 
                className="ml-2 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;