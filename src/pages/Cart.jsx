import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Heart, ArrowRight, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCartItems();
      fetchRecommendedProducts();
      
      // Real-time subscription
      const subscription = supabase
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
            fetchCartItems();
          }
        )
        .subscribe();

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*, profiles(full_name))')
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendedProducts = async () => {
    try {
      // Fetch actual products from your database that aren't already in cart
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .neq('id', cartItems.map(item => item.product_id))
        .limit(4)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRecommendedProducts(data || []);
    } catch (error) {
      console.error('Error fetching recommended products:', error);
      // Fallback to empty array
      setRecommendedProducts([]);
    }
  };

  const updateQuantity = async (itemId, newQuantity, maxStock) => {
    if (newQuantity < 1 || newQuantity > maxStock) {
      toast.error(`Quantity must be between 1 and ${maxStock}`);
      return;
    }

    setUpdatingItem(itemId);
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Cart updated');
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingItem(null);
    }
  };

  const removeItem = async (itemId) => {
    if (!confirm('Remove this item from cart?')) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error('Failed to remove item');
    }
  };

  const applyPromoCode = () => {
    const validCodes = {
      'WELCOME10': 10,
      'SAVE20': 20,
      'SUMMER15': 15,
    };

    if (validCodes[promoCode.toUpperCase()]) {
      setDiscount(validCodes[promoCode.toUpperCase()]);
      toast.success(`Promo code applied! ${validCodes[promoCode.toUpperCase()]}% off`);
      setPromoCode('');
    } else {
      toast.error('Invalid promo code');
      setPromoCode('');
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.products.price) * item.quantity;
    }, 0);
  };

  const calculateDiscount = () => {
    return (calculateSubtotal() * discount) / 100;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    // Check stock availability
    const outOfStock = cartItems.find(
      item => item.quantity > item.products.stock_quantity
    );

    if (outOfStock) {
      toast.error(`${outOfStock.products.name} is out of stock`);
      return;
    }

    navigate('/checkout');
  };

  const addToCart = async (product) => {
    try {
      const { error } = await supabase
        .from('cart_items')
        .insert([
          {
            user_id: user.id,
            product_id: product.id,
            quantity: 1
          }
        ]);

      if (error) throw error;
      toast.success('Product added to cart');
      fetchCartItems();
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add product to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)' }}>
        <div className="text-center">
          <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" 
               style={{ borderColor: '#e57373', borderTopColor: 'transparent' }}></div>
          <p style={{ color: '#a94442' }} className="font-medium">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <ShoppingBag size={64} className="mx-auto text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please login to view your cart</h2>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)' }} className="min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#a94442' }}>Fwaeh Mart</h1>
        <div className="flex gap-6 items-center">
          <button onClick={() => navigate('/products')} className="font-medium" style={{ color: '#cd5c5c' }}>Products</button>
          <button onClick={() => navigate('/dashboard')} className="font-medium" style={{ color: '#cd5c5c' }}>Dashboard</button>
          <button className="px-6 py-2 rounded-lg font-medium text-white" 
                  style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}>
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center mb-4 transition hover:opacity-80"
            style={{ color: '#a94442' }}
          >
            <ArrowLeft size={20} className="mr-2" />
            Continue Shopping
          </button>
          <h2 className="text-4xl font-bold mb-2" style={{ color: '#a94442' }}>
            Shopping Cart
          </h2>
          <p style={{ color: '#cd5c5c' }} className="text-lg">{cartItems.length} items in cart</p>
        </div>

        {/* Empty State */}
        {cartItems.length === 0 ? (
          <div className="text-center py-20 rounded-3xl" style={{ background: 'rgba(255, 255, 255, 0.6)', border: '2px solid #f8b4b4' }}>
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 rounded-full flex items-center justify-center" 
                   style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}>
                <ShoppingBag size={64} className="text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3" style={{ color: '#a94442' }}>Your cart is empty</h2>
            <p style={{ color: '#cd5c5c' }} className="mb-8 text-lg">Start shopping to add items to your cart</p>
            <button
              onClick={() => navigate('/products')}
              className="px-8 py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl p-6 flex gap-6 hover:shadow-xl transition-all"
                  style={{ background: 'rgba(255, 255, 255, 0.7)', border: '2px solid #f8b4b4' }}
                >
                  {/* Image */}
                  <div className="w-32 h-32 rounded-xl overflow-hidden flex-shrink-0" 
                       style={{ background: 'linear-gradient(135deg, #fce4e4 0%, #fef0f0 100%)' }}>
                    <img
                      src={item.products.image_url || 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={item.products.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2" style={{ color: '#a94442' }}>
                      {item.products.name}
                    </h3>
                    <p className="text-sm mb-2" style={{ color: '#cd5c5c' }}>
                      Sold by {item.products.profiles?.full_name || 'Unknown Seller'}
                    </p>
                    
                    {/* Stock Warning */}
                    {item.products.stock_quantity <= 5 && (
                      <p className="text-sm mb-4" style={{ color: '#e57373' }}>
                        ⚠️ Only {item.products.stock_quantity} left in stock
                      </p>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1, item.products.stock_quantity)}
                        disabled={updatingItem === item.id || item.quantity <= 1}
                        className="w-10 h-10 rounded-lg hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
                      >
                        <Minus size={18} className="text-white" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1, item.products.stock_quantity)}
                        className="w-16 text-center py-2 rounded-lg font-bold"
                        style={{ background: 'rgba(255, 255, 255, 0.8)', color: '#a94442', border: '2px solid #f8b4b4' }}
                      />
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1, item.products.stock_quantity)}
                        disabled={updatingItem === item.id || item.quantity >= item.products.stock_quantity}
                        className="w-10 h-10 rounded-lg hover:opacity-90 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
                      >
                        <Plus size={18} className="text-white" />
                      </button>
                    </div>

                    {/* Save for Later */}
                    <button
                      className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                      style={{ color: '#e57373' }}
                    >
                      <Heart size={16} />
                      Save for Later
                    </button>
                  </div>

                  {/* Price and Actions */}
                  <div className="text-right flex flex-col justify-between">
                    <div>
                      <p className="text-3xl font-bold mb-1" style={{ color: '#e57373' }}>
                        ₹{(parseFloat(item.products.price) * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-sm mb-6" style={{ color: '#cd5c5c' }}>
                        ₹{parseFloat(item.products.price).toFixed(2)} each
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-3 rounded-lg hover:opacity-80 transition-all"
                      style={{ background: 'rgba(255, 255, 255, 0.8)', color: '#e57373', border: '2px solid #f8b4b4' }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary Sidebar - FIXED */}
            <div className="lg:col-span-1">
              <div
                className="rounded-3xl p-6 sticky top-6 shadow-xl w-full"
                style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
              >
                <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: '#a94442' }}>
                  Order Summary
                </h3>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Subtotal</span>
                    <span className="font-semibold">₹{calculateSubtotal().toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between text-gray-700">
                    <span className="font-medium">Shipping</span>
                    <span className="font-semibold text-green-600">FREE</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span className="font-medium">Discount ({discount}%)</span>
                      <span className="font-semibold">-₹{calculateDiscount().toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-300 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold" style={{ color: '#a94442' }}>Total</span>
                      <span className="text-2xl font-bold" style={{ color: '#e57373' }}>
                        ₹{calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Promo Code - COMPLETELY FIXED */}
                <div className="mb-6">
                  <p className="text-sm font-bold mb-3 text-center" style={{ color: '#a94442' }}>PROMO CODE</p>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Enter code"
                      className="flex-1 px-3 py-2 rounded-lg text-sm outline-none font-medium w-full"
                      style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                    />
                    <button
                      onClick={applyPromoCode}
                      className="px-4 py-2 rounded-lg font-bold text-white text-sm transition-all hover:opacity-90 whitespace-nowrap"
                      style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Buttons - FIXED Arrow Position */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3"
                    style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={18} className="ml-1" />
                  </button>
                  <button
                    onClick={() => navigate('/products')}
                    className="w-full py-3 rounded-xl font-bold transition-all hover:opacity-80 text-sm"
                    style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                  >
                    Continue Shopping
                  </button>
                </div>

                {/* Security Badges */}
                <div className="mt-6 pt-4 border-t" style={{ borderColor: '#f8b4b4' }}>
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs">Secure Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recommended Products Section - Now uses actual products */}
        {cartItems.length > 0 && recommendedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold mb-8" style={{ color: '#a94442' }}>
              Recommended for You
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recommendedProducts.map((product) => (
                <div
                  key={product.id}
                  className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                  style={{ background: 'rgba(255, 255, 255, 0.7)', border: '2px solid #f8b4b4' }}
                >
                  <div
                    className="h-40 flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #fce4e4 0%, #fef0f0 100%)' }}
                  >
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={56} style={{ color: '#e57373' }} />
                    )}
                  </div>
                  <div className="p-5">
                    <h4 className="font-bold mb-3 text-lg" style={{ color: '#a94442' }}>
                      {product.name}
                    </h4>
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold" style={{ color: '#e57373' }}>
                        ₹{parseFloat(product.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        className="px-5 py-2 rounded-lg font-bold text-white transition-all hover:opacity-90"
                        style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;