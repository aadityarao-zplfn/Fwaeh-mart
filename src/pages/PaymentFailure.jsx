import { XCircle, RotateCcw, ArrowLeft } from 'lucide-react';

const PaymentFailure = () => {
  const handleTryAgain = () => {
    alert('Redirecting to payment page...');
  };

  const handleBackToCart = () => {
    alert('Redirecting to cart...');
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
          {/* Failure Icon */}
          <div className="mb-6">
            <div 
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 shadow-md"
              style={{ background: '#ef4444', animation: 'shake 0.5s ease-in-out 2' }}
            >
              <XCircle size={48} className="text-white" />
            </div>
          </div>

          {/* Failure Message */}
          <h1 className="text-4xl font-bold mb-4" style={{ color: '#a73636' }}>
            Payment Failed
          </h1>
          <p className="text-lg mb-2" style={{ color: '#b94a4a' }}>
            We couldn't process your payment.
          </p>
          <p className="text-sm mb-8" style={{ color: '#b94a4a' }}>
            Please try again or choose a different payment method.
          </p>

          {/* Possible Reasons */}
          <div 
            className="rounded-xl p-6 mb-6 text-left"
            style={{ background: '#ffe5e5', border: '2px solid #e89999' }}
          >
            <p className="font-bold mb-3" style={{ color: '#a73636' }}>
              Possible reasons:
            </p>
            <ul className="space-y-2 text-sm" style={{ color: '#b94a4a' }}>
              <li>• Insufficient funds</li>
              <li>• Incorrect card details</li>
              <li>• Bank declined the transaction</li>
              <li>• Network connection issue</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleTryAgain}
              className="w-full py-4 rounded-xl font-semibold text-lg text-white shadow-sm hover:shadow-md transition-all flex items-center justify-center"
              style={{ background: '#e89999' }}
            >
              <RotateCcw size={20} className="mr-2" />
              Try Again
            </button>

            <button
              onClick={handleBackToCart}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all border-2 flex items-center justify-center"
              style={{ 
                background: 'transparent', 
                color: '#a73636',
                borderColor: '#e89999'
              }}
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Cart
            </button>
          </div>

          {/* Support */}
          <div className="mt-6">
            <p className="text-sm" style={{ color: '#b94a4a' }}>
              Need help? <a href="#" className="font-bold hover:underline" style={{ color: '#a73636' }}>Contact Support</a>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentFailure;