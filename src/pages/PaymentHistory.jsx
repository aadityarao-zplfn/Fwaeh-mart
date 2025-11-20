import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // ✅ CHANGED: Query 'orders' table instead of 'payments'
      const { data, error } = await supabase
        .from('orders') // ✅ FIXED: Changed from 'payments' to 'orders'
        .select(`
          id,
          payment_id,
          total_amount,
          status,
          shipping_address,
          created_at
        `)
        .eq('user_id', user.id)
        .not('payment_id', 'is', null) // ✅ Only orders with payment_id (online payments)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPayments(data || []);
      
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': 
      case 'delivered': 
      case 'success': 
        return <CheckCircle size={20} className="text-green-500" />;
      case 'cancelled': 
      case 'failed': 
      case 'refunded': 
        return <XCircle size={20} className="text-red-500" />;
      case 'pending': 
      case 'processing': 
        return <Clock size={20} className="text-yellow-500" />;
      default: 
        return <Clock size={20} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'completed': 
      case 'delivered': 
      case 'success': 
        return '#10b981';
      case 'cancelled': 
      case 'failed': 
      case 'refunded': 
        return '#ef4444';
      case 'pending': 
      case 'processing': 
        return '#f59e0b';
      default: 
        return '#6b7280';
    }
  };

  const formatStatus = (status) => {
    return status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#fde8e8' }}>
        <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#ffffff' }}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold" style={{ color: '#a73636' }}>
              Fwaeh Mart
            </h1>
          </div>
        </header>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#e89999', borderTopColor: 'transparent' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ background: '#fde8e8' }}>
        <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#ffffff' }}>
          <div className="max-w-7xl mx-auto px-4 py-4">
            <h1 className="text-2xl font-bold" style={{ color: '#a73636' }}>
              Fwaeh Mart
            </h1>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="rounded-2xl shadow-md text-center py-12" style={{ background: '#ffffff' }}>
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: '#ffe5e5' }}
            >
              <XCircle size={32} style={{ color: '#e89999' }} />
            </div>
            <p className="text-lg font-medium" style={{ color: '#a73636' }}>
              Error loading payments
            </p>
            <p className="text-sm mt-2" style={{ color: '#b94a4a' }}>
              {error}
            </p>
            <button 
              onClick={fetchPayments}
              className="mt-4 px-4 py-2 rounded-lg font-medium hover:opacity-80 transition-opacity"
              style={{ background: '#a73636', color: 'white' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#fde8e8' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#ffffff' }}>
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center gap-2 hover:opacity-70 transition-opacity"
              style={{ color: '#a73636' }}
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
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#a73636' }}>
            Payment History
          </h2>
          <p style={{ color: '#b94a4a' }}>
            View all your past transactions
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="rounded-2xl shadow-md text-center py-12" style={{ background: '#ffffff' }}>
            <div 
              className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
              style={{ background: '#ffe5e5' }}
            >
              <CreditCard size={32} style={{ color: '#e89999' }} />
            </div>
            <p className="text-lg font-medium" style={{ color: '#a73636' }}>
              No payments yet
            </p>
            <p className="text-sm mt-2" style={{ color: '#b94a4a' }}>
              Your completed transactions will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div 
                key={payment.id}
                className="rounded-2xl shadow-md p-6 hover:shadow-lg transition-shadow"
                style={{ background: '#ffffff' }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: '#ffe5e5' }}
                      >
                        <CreditCard size={20} style={{ color: '#e89999' }} />
                      </div>
                      <div>
                        <p className="font-bold text-2xl" style={{ color: '#a73636' }}>
                          ₹{parseFloat(payment.total_amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm font-mono mb-1" style={{ color: '#b94a4a' }}>
                      Payment ID: {payment.payment_id}
                    </p>
                    <p className="text-xs" style={{ color: '#b94a4a' }}>
                      {new Date(payment.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div 
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: '#ffe5e5' }}
                  >
                    {getStatusIcon(payment.status)}
                    <span 
                      className="text-sm font-semibold capitalize"
                      style={{ color: getStatusColor(payment.status) }}
                    >
                      {formatStatus(payment.status)}
                    </span>
                  </div>
                </div>
                
                <div className="pt-4 border-t-2 flex justify-between items-center" style={{ borderColor: '#fde8e8' }}>
                  <p className="text-sm font-medium" style={{ color: '#a73636' }}>
                    Order ID: #{payment.id.slice(0, 8).toUpperCase()}
                  </p>
                  {payment.shipping_address && (
                    <p className="text-xs" style={{ color: '#b94a4a' }}>
                      {payment.shipping_address.length > 30 
                        ? payment.shipping_address.slice(0, 30) + '...' 
                        : payment.shipping_address}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;