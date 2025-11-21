import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, MapPin, CheckCircle, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const SchedulePickup = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [processing, setProcessing] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchCartItems();
  }, [user]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      if (!data || data.length === 0) {
        navigate('/cart');
        return;
      }
      setCartItems(data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load cart items');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.products.price * item.quantity), 0);
  };

  const validateDateTime = (dateTime) => {
    const selected = new Date(dateTime);
    const now = new Date();
    
    // Check if date is in the future
    if (selected <= now) {
      return 'Please select a future date and time';
    }
    
    // Check if at least 2 hours from now
    if (selected.getTime() - now.getTime() < 2 * 60 * 60 * 1000) {
      return 'Please select a time at least 2 hours from now';
    }
    
    // Check business hours (9 AM - 8 PM)
    const hour = selected.getHours();
    const day = selected.getDay();
    
    // Sunday (0) is closed
    if (day === 0) {
      return 'Store is closed on Sundays. Please select another day.';
    }
    
    // Business hours: Mon-Sat, 9 AM - 8 PM
    if (hour < 9 || hour >= 20) {
      return 'Store hours are 9 AM to 8 PM. Please select a time within these hours.';
    }
    
    return null;
  };

  const handleConfirmSchedule = async () => {
  if (!selectedDate) {
    toast.error('Please select a pickup date and time');
    return;
  }

  // Validate the selected date and time
  const validationError = validateDateTime(selectedDate);
  if (validationError) {
    toast.error(validationError);
    return;
  }

  setProcessing(true);
  const toastId = toast.loading('Scheduling pickup & reserving stock...');

  try {
    // 1. Prepare Inventory Payload
    const inventoryPayload = cartItems.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity
    }));

    // 2. Atomic Stock Deduction (RPC)
    const { data: stockResult, error: rpcError } = await supabase.rpc('process_order_inventory', {
      cart_items: inventoryPayload
    });

    if (rpcError) {
      throw new Error(`Database error: ${rpcError.message}`);
    }
    
    if (!stockResult || !stockResult.success) {
      throw new Error(stockResult?.error || 'Failed to reserve stock. Items may be out of stock.');
    }

    // 3. Create Offline Order - USE EXISTING STATUS
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        total_amount: calculateTotal(),
        status: 'pending', // ← CHANGED: Use existing status
        fulfillment_type: 'offline_pickup',
        scheduled_at: new Date(selectedDate).toISOString(),
        shipping_address: 'Offline Pickup at Store',
        contact_phone: profile?.phone || '',
        contact_email: user.email,
        pickup_status: 'pending'
      }])
      .select()
      .single();

    if (orderError) throw orderError;

    // 4. Create Order Items
    const orderItemsData = cartItems.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      seller_id: item.products.seller_id,
      quantity: item.quantity,
      price_at_purchase: item.products.price
    }));

    const { error: orderItemsError } = await supabase.from('order_items').insert(orderItemsData);
    if (orderItemsError) throw orderItemsError;

    // 5. Clear Cart
    await supabase.from('cart_items').delete().eq('user_id', user.id);

    // 6. Navigate to Success Page
    toast.success('Pickup scheduled successfully!', { id: toastId });
    navigate('/pickup-success', { state: { order, pickupTime: selectedDate } });

  } catch (error) {
    console.error('Scheduling failed:', error);
    
    // Attempt to restore stock if we have the restore function
    try {
      if (typeof supabase.rpc('restore_order_inventory') === 'function') {
        await supabase.rpc('restore_order_inventory', {
          cart_items: inventoryPayload
        });
      }
    } catch (restoreError) {
      console.error('Failed to restore stock:', restoreError);
    }
    
    toast.error(`Failed: ${error.message}`, { id: toastId });
  } finally {
    setProcessing(false);
  }
};

  // Get min date (2 hours from now)
  const getMinDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 2);
    return now.toISOString().slice(0, 16);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#fff0f3' }}>
      <div className="text-center">
        <div className="w-16 h-16 border-4 rounded-full animate-spin mx-auto mb-4" 
             style={{ borderColor: '#e57373', borderTopColor: 'transparent' }}></div>
        <p style={{ color: '#a94442' }} className="font-medium">Loading pickup schedule...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen p-4 lg:p-8" style={{ background: '#fff0f3' }}>
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl p-8 border border-pink-100">
        <h1 className="text-3xl font-bold text-red-800 mb-2">Schedule Offline Pickup</h1>
        <p className="text-gray-600 mb-8">Choose a time to visit the store and collect your items.</p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Date Picker Section */}
          <div className="space-y-6">
            <div className="bg-pink-50 p-6 rounded-2xl border border-pink-200">
              <label className="block text-sm font-bold text-red-700 mb-3">
                <Calendar className="inline mr-2" size={18} />
                Select Date & Time
              </label>
              <input
                type="datetime-local"
                min={getMinDate()}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-pink-200 outline-none focus:border-red-400 text-lg bg-white"
              />
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <p>* Stock is reserved immediately upon confirmation</p>
                <p>* Store hours: Mon-Sat, 9 AM - 8 PM</p>
                <p>* Please arrive within your selected 30-minute window</p>
              </div>
            </div>

            <div className="bg-white border-2 border-gray-100 p-4 rounded-xl">
              <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="text-red-500" size={18} />
                Pickup Location
              </h3>
              <div className="text-sm text-gray-600">
                <p className="font-semibold">Fwaeh Mart Main Store</p>
                <p>Secunderabad, Telangana</p>
                <p>500003</p>
                <p className="mt-2 text-green-600 font-medium">✓ Pay when you pickup</p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="font-bold text-gray-800 mb-4 text-lg">Items to Pickup</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-500 bg-white px-2 py-1 rounded">{item.quantity}x</span>
                    <span className="text-sm font-medium text-gray-700">{item.products.name}</span>
                  </div>
                  <span className="font-bold text-red-500">₹{item.products.price * item.quantity}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-xl font-bold text-gray-900">
                <span>Total Pay at Store:</span>
                <span className="text-red-600">₹{calculateTotal()}</span>
              </div>
            </div>

            <button
              onClick={handleConfirmSchedule}
              disabled={processing || !selectedDate}
              className="w-full mt-6 py-4 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Reserving Stock...
                </>
              ) : (
                <>
                  Confirm Schedule <ArrowRight size={20} />
                </>
              )}
            </button>

            {!selectedDate && (
              <p className="text-center text-sm text-gray-500 mt-2">
                Please select a date and time to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePickup;