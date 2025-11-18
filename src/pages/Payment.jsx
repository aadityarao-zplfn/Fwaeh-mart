import { useState } from 'react';
import { CreditCard, Building, CheckCircle, Lock, ArrowLeft } from 'lucide-react';
import { initiatePayment } from '../utils/razorpay';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('online');
  const [loading, setLoading] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const orderDetails = {
    subtotal: 72.67,
    shipping: 5.00,
    tax: 7.77,
    total: 85.44
  };

  // If no user, show error
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Error</h2>
          <p>Please log in again</p>
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    setLoading(true);

    if (paymentMethod === 'online') {
      try {
        await initiatePayment(
          {
            total: orderDetails.total,
            userName: user.user_metadata?.full_name || 'Customer',
            userEmail: user.email,
            userPhone: user.user_metadata?.phone || ''
          },
          // Success callback - SIMPLIFIED
          (response) => {
            console.log('🟢 Payment successful:', response);
            toast.success('Payment successful!');
            navigate('/payment-success');
            setLoading(false);
          },
          // Failure callback
          (error) => {
            console.error('Payment failed:', error);
            toast.error('Payment failed. Please try again.');
            navigate('/payment-failure');
            setLoading(false);
          }
        );
      } catch (error) {
        console.error('Payment error:', error);
        toast.error('Payment failed. Please try again.');
        setLoading(false);
      }
    } else {
      // Cash on Delivery
      toast.success('Order confirmed! Pay on delivery.');
      navigate('/orders');
      setLoading(false);
    }
  };

  // ADD THE RETURN STATEMENT WITH YOUR JSX HERE
  return (
    <div className="min-h-screen" style={{ background: '#fde8e8' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              style={{ color: '#a73636' }}
              onClick={() => window.history.back()}
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
            <h1 className="text-2xl font-bold" style={{ color: '#a73636' }}>
              Fwaeh Mart
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#8b3a3a' }}>
            Complete Payment
          </h2>
          <p style={{ color: '#a85858' }}>
            Choose your preferred payment method
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Payment Methods - Left Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-2xl shadow-md p-6" style={{ background: '#ffffff' }}>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#8b3a3a' }}>
                Payment Method
              </h3>

              {/* Online Payment Option */}
              <button
                onClick={() => setPaymentMethod('online')}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all mb-3 ${
                  paymentMethod === 'online' ? 'shadow-md' : ''
                }`}
                style={{
                  background: paymentMethod === 'online' ? '#fef2f2' : '#fafafa',
                  borderColor: paymentMethod === 'online' ? '#dc9b9b' : '#e5e5e5'
                }}
              >
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                    style={{ 
                      background: paymentMethod === 'online' ? '#dc9b9b' : '#e0d4d4' 
                    }}
                  >
                    <CreditCard size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base" style={{ color: '#8b3a3a' }}>
                      Online Payment
                    </p>
                    <p className="text-sm" style={{ color: '#a85858' }}>
                      Credit/Debit Card, UPI, Net Banking
                    </p>
                  </div>
                  {paymentMethod === 'online' && (
                    <CheckCircle size={22} style={{ color: '#dc9b9b' }} />
                  )}
                </div>
              </button>

              {/* Cash on Delivery Option */}
              <button
                onClick={() => setPaymentMethod('cod')}
                className={`w-full p-5 rounded-xl border-2 text-left transition-all ${
                  paymentMethod === 'cod' ? 'shadow-md' : ''
                }`}
                style={{
                  background: paymentMethod === 'cod' ? '#fef2f2' : '#fafafa',
                  borderColor: paymentMethod === 'cod' ? '#dc9b9b' : '#e5e5e5'
                }}
              >
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                    style={{ 
                      background: paymentMethod === 'cod' ? '#dc9b9b' : '#e0d4d4' 
                    }}
                  >
                    <Building size={22} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-base" style={{ color: '#8b3a3a' }}>
                      Cash on Delivery
                    </p>
                    <p className="text-sm" style={{ color: '#a85858' }}>
                      Pay when you receive your order
                    </p>
                  </div>
                  {paymentMethod === 'cod' && (
                    <CheckCircle size={22} style={{ color: '#dc9b9b' }} />
                  )}
                </div>
              </button>
            </div>

            {/* Security Notice */}
            <div className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#fef2f2' }}>
              <Lock size={20} style={{ color: '#dc9b9b' }} />
              <p className="text-sm" style={{ color: '#8b3a3a' }}>
                <span className="font-semibold">Secure Payment:</span> All transactions are encrypted with 256-bit SSL
              </p>
            </div>
          </div>

          {/* Order Summary - Right Column */}
          <div className="md:col-span-1">
            <div className="rounded-2xl shadow-md p-6 sticky top-24" style={{ background: '#ffffff' }}>
              <h3 className="font-bold text-xl mb-4" style={{ color: '#8b3a3a' }}>
                Order Summary
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#8b3a3a' }}>Subtotal</span>
                  <span className="font-semibold" style={{ color: '#8b3a3a' }}>
                    ${orderDetails.subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#8b3a3a' }}>Shipping</span>
                  <span className="font-semibold" style={{ color: '#8b3a3a' }}>
                    ${orderDetails.shipping.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#8b3a3a' }}>Tax</span>
                  <span className="font-semibold" style={{ color: '#8b3a3a' }}>
                    ${orderDetails.tax.toFixed(2)}
                  </span>
                </div>
                
                <div className="border-t-2 pt-3" style={{ borderColor: '#f5e6e6' }}>
                  <div className="flex justify-between">
                    <span className="font-bold text-lg" style={{ color: '#8b3a3a' }}>
                      Total
                    </span>
                    <span className="font-bold text-xl" style={{ color: '#8b3a3a' }}>
                      ${orderDetails.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full py-3 rounded-xl font-semibold text-white shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: '#dc9b9b' }}
              >
                {loading ? 'Processing...' : paymentMethod === 'online' ? 'Pay Now' : 'Confirm Order'}
              </button>

              {/* TEST BUTTON */}
              <button 
                onClick={() => navigate('/payment-success')}
                className="w-full mt-4 p-2 bg-blue-500 text-white rounded"
              >
                Test Redirect to Success Page
              </button>

              <button
                onClick={() => window.history.back()}
                className="w-full mt-3 py-3 rounded-xl font-semibold transition-all border-2"
                style={{ 
                  background: 'transparent', 
                  color: '#8b3a3a',
                  borderColor: '#dc9b9b'
                }}
              >
                Back to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;