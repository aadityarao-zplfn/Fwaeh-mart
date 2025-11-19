import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, LogOut, LayoutDashboard } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count when user logs in
  useEffect(() => {
    if (user && profile?.role === 'customer') {
      fetchCartCount();
      
      // Set up real-time subscription for cart changes
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
            fetchCartCount();
          }
        )
        .subscribe();

      return () => {
        cartSubscription.unsubscribe();
      };
    } else {
      setCartCount(0);
    }
  }, [user, profile]);

  const fetchCartCount = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      setCartCount(total);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setCartCount(0);
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
  {/* <img 
    src="https://i.ibb.co/fYvF8s8V/Whats-App-Image-2025-11-18-at-22-03-30-942d91e3-removebg-preview.png" 
    alt="Fwaeh Mart Logo" 
    className="h-40 w-20 -mr-2 -mt-3 object-contain"
  /> */}
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
                
                {/* Notification Bell */}
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

      {/* Mobile Cart Icon (visible on small screens) */}
      {user && profile?.role === 'customer' && (
        <div 
          className="md:hidden border-t"
          style={{ borderColor: '#fca5a5' }}
        >
          <Link 
            to="/cart" 
            className="flex items-center justify-center py-3 font-medium transition-all relative"
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