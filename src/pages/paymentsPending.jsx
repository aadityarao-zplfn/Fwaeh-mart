import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { fulfillProxyOrder } from '../utils/retailerService';
import { CreditCard, ArrowRight, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const PaymentsPending = () => {
  const [pendingItems, setPendingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) fetchPendingProxyOrders();
  }, [user]);

  const fetchPendingProxyOrders = async () => {
    try {
      setLoading(true);
      
      // Step 1: Get all order items for this seller
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;
      if (!orderItems || orderItems.length === 0) {
        setPendingItems([]);
        return;
      }

      // Step 2: Get related products to check which are proxy
      const productIds = [...new Set(orderItems.map(item => item.product_id))];
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds)
        .eq('is_proxy', true);

      if (productsError) throw productsError;

      // Step 3: Filter order items to only include proxy products
      const proxyProductIds = new Set(products.map(p => p.id));
      const proxyOrderItems = orderItems.filter(item => proxyProductIds.has(item.product_id));

      if (proxyOrderItems.length === 0) {
        setPendingItems([]);
        return;
      }

      // Step 4: Get related orders for proxy items
      const orderIds = [...new Set(proxyOrderItems.map(item => item.order_id))];
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        .eq('status', 'pending')
        .eq('wholesaler_payment_made', false)
        .is('wholesaler_fulfillment_order_id', null);

      if (ordersError) throw ordersError;

      // Combine the data
      const productMap = new Map(products.map(p => [p.id, p]));
      const orderMap = new Map(orders.map(o => [o.id, o]));

      const combinedItems = proxyOrderItems
        .filter(item => orderMap.has(item.order_id))
        .map(item => ({
          ...item,
          products: productMap.get(item.product_id),
          orders: orderMap.get(item.order_id)
        }));

      console.log('🔍 Combined proxy items:', combinedItems); // Debug log
      setPendingItems(combinedItems);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (item) => {
    // Validate price before proceeding
    const costPrice = item.wholesaler_price;
    if (!costPrice || isNaN(costPrice)) {
      toast.error('Invalid product price. Cannot process payment.');
      return;
    }

    if (!confirm(`Confirm payment of ₹${(costPrice * item.quantity).toFixed(2)} to Wholesaler for ${item.products.name}?`)) return;
    
    setProcessingId(item.id);
    const toastId = toast.loading('Processing payment to wholesaler...');

    try {
      const result = await fulfillProxyOrder(item.orders, item);
      
      if (result.success) {
        toast.success('Payment successful! Order forwarded to Wholesaler.', { id: toastId });
        setPendingItems(prev => prev.filter(i => i.id !== item.id));
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(`Payment failed: ${error.message}`, { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments Pending</h1>
          <p className="text-gray-500">Pay wholesalers to fulfill proxy orders (Case 3)</p>
        </div>
        <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100">
          <span className="text-red-600 font-bold">{pendingItems.length}</span> pending
        </div>
      </div>

      {pendingItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-bold text-gray-800">All Caught Up!</h3>
          <p className="text-gray-500">No pending payments to wholesalers.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {pendingItems.map((item) => {
            // SAFE CALCULATION: Handle null/undefined prices
            const costPrice = parseFloat(item.wholesaler_price) || 0;
            const totalCost = costPrice * item.quantity;
            
            // Skip items with invalid prices
            if (costPrice <= 0) {
              console.warn('Invalid price for item:', item);
              return null;
            }

            return (
              <div key={item.id} className="bg-white p-6 rounded-2xl shadow-md border border-red-100">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                      <img src={item.products.image_url || '/placeholder.svg'} className="w-full h-full object-cover" alt="Product" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{item.products.name}</h3>
                      <p className="text-sm text-gray-500">Order #{item.orders.id.slice(0, 8)} • Qty: {item.quantity}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Proxy Product</span>
                    </div>
                  </div>
                  <div className="text-right px-4 border-l border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold">Amount Due</p>
                    <p className="text-2xl font-bold text-red-600">₹{totalCost.toFixed(2)}</p>
                    <p className="text-xs text-gray-500">{item.quantity} × ₹{costPrice.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handlePayment(item)}
                    disabled={processingId === item.id}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {processingId === item.id ? <LoadingSpinner size="sm" /> : <><CreditCard size={18} /> Pay Wholesaler <ArrowRight size={18} /></>}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PaymentsPending;