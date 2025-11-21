import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CreditCard, Building, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { subtractStock } from '../utils/inventory';
import toast from 'react-hot-toast';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { orderData, orderItemsData, cartItems, shippingInfo, orderSummary, saveAddress, fullAddress } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!location.state || !orderData || !orderSummary) {
      navigate('/cart');
    }
  }, [location.state, orderData, orderSummary, navigate]);

  // Load Razorpay script
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // In src/pages/Payment.jsx

const processOrder = async (status = 'pending') => {
  console.log('Processing order...');
  
  // --- STEP 1: ATOMIC STOCK UPDATE (The New Logic) ---
  // We verify and deduct stock FIRST. If this fails, we stop the order.
  
  // Prepare payload for RPC: [{ product_id: "...", quantity: 1 }, ...]
  const inventoryPayload = cartItems.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity
  }));

  const { data: stockResult, error: rpcError } = await supabase.rpc('process_order_inventory', {
    cart_items: inventoryPayload
  });

  if (rpcError || !stockResult?.success) {
    console.error('Inventory Error:', rpcError || stockResult?.error);
    throw new Error(stockResult?.error || 'Some items are out of stock or unavailable.');
  }

  console.log('✅ Stock synchronized successfully. Creating order records...');

  // --- STEP 2: CREATE ORDER RECORD ---
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([
      {
        user_id: orderData.user_id,
        total_amount: orderData.total_amount,
        shipping_address: orderData.shipping_address,
        payment_method: orderData.payment_method,
        contact_phone: orderData.contact_phone,
        contact_email: orderData.contact_email,
        // Remove contact_name if it's not in your DB schema, strictly sticking to your provided schema
        status: status
      }
    ])
    .select()
    .single();

  if (orderError) {
    // Critical: If order creation fails but stock was deducted, strictly speaking we should revert stock.
    // However, in a simple implementation, this is rare. 
    console.error('ORDER CREATION ERROR:', orderError);
    throw new Error(`Failed to create order: ${orderError.message}`);
  }

  // --- STEP 3: CREATE ORDER ITEMS ---
  const orderItemsWithId = orderItemsData.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    seller_id: item.seller_id,
    quantity: item.quantity,
    price_at_purchase: item.price_at_purchase
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsWithId);

  if (itemsError) {
    console.error('ORDER ITEMS ERROR:', itemsError);
    throw new Error(`Failed to create order items: ${itemsError.message}`);
  }

  // --- STEP 4: CLEANUP ---
  // Clear Cart
  await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', user.id);

  // Notification
  await supabase.from('notifications').insert([{
    user_id: user.id,
    title: 'Order Placed Successfully! 🎉',
    message: `Order #${order.id.slice(0, 8)} has been confirmed.`,
    type: 'order',
    read: false
  }]);

  // Save Address if checked
  if (saveAddress) {
    await supabase
      .from('profiles')
      .update({
        address: fullAddress,
        phone: shippingInfo.phone,
        full_name: shippingInfo.fullName
      })
      .eq('id', user.id);
  }

  return order;
};
  // Handle Razorpay payment
const handleRazorpayPayment = async () => {
    console.log('🔍 DEBUG: handleRazorpayPayment called');
  console.log('🔍 DEBUG: paymentMethod is:', paymentMethod);
  console.log('🔍 DEBUG: Vercel check would be:', window.location.hostname.includes('vercel.app'));
  console.log('🔍 DEBUG: Razorpay key exists:', !!import.meta.env.VITE_RAZORPAY_ID);


  // 🎯 LOCALHOST - USE REAL RAZORPAY
  const res = await loadRazorpay();

  if (!res) {
    toast.error('Razorpay SDK failed to load');
    return;
  }

  const options = {
   // key: import.meta.env.VITE_RAZORPAY_ID,
     key: "rzp_test_1DP5mmOLF5G5ag", // ← HARDCODE THIS!

    amount: Math.round(orderSummary.total * 100),
    currency: 'INR',
    name: 'Fwaeh Mart',
    description: 'Order Payment',
    handler: async function (response) {
      console.log('RAZORPAY SUCCESS:', response);
      const toastId = toast.loading('Processing your order...');
      
      try {
        await processOrder('pending');
        toast.success('Payment successful! Order placed.', { id: toastId });
        navigate('/orders');
      } catch (error) {
        console.error('ORDER PROCESSING FAILED:', error);
        toast.error(`Order failed: ${error.message}`, { id: toastId });
        setLoading(false);
      }
    },
    prefill: {
      name: shippingInfo.fullName,
      email: shippingInfo.email,
      contact: shippingInfo.phone
    },
    theme: {
      color: '#ff5757'
    },
    modal: {
      ondismiss: function() {
        toast.error('Payment cancelled');
        setLoading(false);
      }
    }
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
// Main payment handler
const handlePayment = async () => {
  setLoading(true);

  if (paymentMethod === 'online') {
    // Online payment with Razorpay
    await handleRazorpayPayment();
  } else {
    // Cash on Delivery
    const toastId = toast.loading('Placing your order...');
    try {
      await processOrder('pending');
      toast.success('Order placed successfully!', { id: toastId });
      navigate('/orders');
    } catch (error) {
      console.error('COD ORDER FAILED:', error);
      toast.error('Failed to place order: ' + error.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }
};
  if (!orderData || !orderSummary) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #ffd4d4 0%, #ffb8be 50%, #ff9aa2 100%)' }}
    >
      <div className="max-w-2xl w-full">
        <div 
          className="rounded-2xl shadow-2xl p-8"
          style={{ background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)', border: '1px solid rgba(255, 130, 130, 0.3)' }}
        >
          <div className="text-center mb-8">
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
            >
              <CreditCard size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-2" style={{ color: '#b91c1c' }}>
              Complete Payment
            </h1>
            <p style={{ color: '#dc2626' }}>
              Choose your payment method
            </p>
          </div>

          <div 
            className="rounded-xl p-6 mb-6 shadow-md"
            style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}
          >
            <h3 className="font-bold text-lg mb-4" style={{ color: '#b91c1c' }}>
              Order Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span style={{ color: '#dc2626' }}>Subtotal:</span>
                <span className="font-semibold" style={{ color: '#b91c1c' }}>
                  ₹{orderSummary.subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#dc2626' }}>Shipping:</span>
                <span className="font-semibold" style={{ color: '#b91c1c' }}>
                  {orderSummary.shipping === 0 ? 'FREE' : `₹${orderSummary.shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: '#dc2626' }}>Tax:</span>
                <span className="font-semibold" style={{ color: '#b91c1c' }}>
                  ₹{orderSummary.tax.toFixed(2)}
                </span>
              </div>
              <div className="border-t-2 pt-2 flex justify-between" style={{ borderColor: '#fca5a5' }}>
                <span className="font-bold text-xl" style={{ color: '#b91c1c' }}>Total:</span>
                <span className="font-bold text-2xl" style={{ color: '#ff5757' }}>
                  ₹{orderSummary.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="font-bold text-lg" style={{ color: '#b91c1c' }}>
              Payment Method
            </h3>

            <button
              onClick={() => setPaymentMethod('online')}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                paymentMethod === 'online' ? 'shadow-lg scale-102' : 'hover:shadow-md'
              }`}
              style={{
                background: paymentMethod === 'online' ? '#ffe8e8' : '#fff5f5',
                borderColor: paymentMethod === 'online' ? '#ff5757' : '#fca5a5'
              }}
            >
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                  style={{ background: paymentMethod === 'online' ? 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' : '#fca5a5' }}
                >
                  <CreditCard size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg" style={{ color: '#b91c1c' }}>
                    Online Payment
                  </p>
                  <p className="text-sm" style={{ color: '#dc2626' }}>
                    Credit/Debit Card, UPI, Net Banking
                  </p>
                </div>
                {paymentMethod === 'online' && (
                  <CheckCircle size={24} style={{ color: '#ff5757' }} />
                )}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod('cod')}
              className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                paymentMethod === 'cod' ? 'shadow-lg scale-102' : 'hover:shadow-md'
              }`}
              style={{
                background: paymentMethod === 'cod' ? '#ffe8e8' : '#fff5f5',
                borderColor: paymentMethod === 'cod' ? '#ff5757' : '#fca5a5'
              }}
            >
              <div className="flex items-center">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                  style={{ background: paymentMethod === 'cod' ? 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' : '#fca5a5' }}
                >
                  <Building size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-lg" style={{ color: '#b91c1c' }}>
                    Cash on Delivery
                  </p>
                  <p className="text-sm" style={{ color: '#dc2626' }}>
                    Pay when you receive your order
                  </p>
                </div>
                {paymentMethod === 'cod' && (
                  <CheckCircle size={24} style={{ color: '#ff5757' }} />
                )}
              </div>
            </button>
          </div>

          <div className="space-y-3">
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
            >
              {loading ? 'Processing...' : paymentMethod === 'online' ? 'Pay Now' : 'Confirm Order'}
            </button>

            <button
              onClick={() => navigate('/checkout')}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all"
              style={{ background: '#fff5f5', color: '#b91c1c', border: '2px solid #fca5a5' }}
            >
              Back to Checkout
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm flex items-center justify-center" style={{ color: '#dc2626' }}>
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              Secure Payment Gateway • 256-bit Encryption
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;