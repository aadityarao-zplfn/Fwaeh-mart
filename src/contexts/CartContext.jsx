import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  const fetchCartCount = async () => {
    if (!user) {
      setCartCount(0);
      return;
    }

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

  const updateCartCount = (change) => {
    console.log('🛒 CartContext: updateCartCount called with change:', change);
  console.log('🛒 CartContext: Previous count was:', cartCount);
    setCartCount(prev => {
    const newCount = Math.max(0, prev + change);
    console.log('🛒 CartContext: New count will be:', newCount);
    return newCount;
  });
}

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }

    fetchCartCount();

    const subscription = supabase
      .channel(`cart_updates_${user.id}`)
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
      subscription.unsubscribe();
    };
  }, [user]);

  return (
    <CartContext.Provider value={{
      cartCount,
      updateCartCount,
      refreshCart: fetchCartCount
    }}>
      {children}
    </CartContext.Provider>
  );
};