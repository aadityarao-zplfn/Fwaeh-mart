import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Trigger confetti animation if canvas-confetti is available
    if (window.confetti) {
      window.confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  }, []);

  const handleTrackOrder = () => {
    navigate('/orders'); // or '/tracking' if you have a separate tracking page
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#fde8e8' }}
    >
      <div className="max-w-md w-full text-center">
        <div 
          className="rounded-2xl shadow-lg p-8"
          style={{ background: '#ffffff' }}
        >
          {/* Success Icon */}
          <div className="mb-6">
            <div 
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 shadow-md"
              style={{ background: '#10b981', animation: 'bounce 1s ease-in-out 3' }}
            >
              <CheckCircle size={48} className="text-white" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#a73636' }}>
            Payment Successful! 🎉
          </h1>
          <p className="text-lg mb-2" style={{ color: '#b94a4a' }}>
            Thank you for your order!
          </p>
          <p className="text-sm mb-8" style={{ color: '#b94a4a' }}>
            We've sent a confirmation email with your order details.
          </p>

          {/* Order Info */}
          <div 
            className="rounded-xl p-6 mb-6 text-left"
            style={{ background: '#ffe5e5', border: '2px solid #e89999' }}
          >
            <p className="text-sm mb-2" style={{ color: '#b94a4a' }}>
              Order ID: <span className="font-mono font-bold" style={{ color: '#a73636' }}>#ORD123456</span>
            </p>
            <p className="text-sm" style={{ color: '#b94a4a' }}>
              You can track your order in the Orders section
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleTrackOrder}
              className="w-full py-4 rounded-xl font-semibold text-lg text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center"
              style={{ background: '#e89999' }}
            >
              <Package size={20} className="mr-2" />
              Track My Order
              <ArrowRight size={20} className="ml-2" />
            </button>

            <button
              onClick={handleContinueShopping}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all border-2"
              style={{ 
                background: 'transparent', 
                color: '#a73636',
                borderColor: '#e89999'
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentSuccess;