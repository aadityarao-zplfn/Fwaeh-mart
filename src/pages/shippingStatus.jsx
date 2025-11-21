import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Box, MapPin, Clock, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const ShippingStatus = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, profile } = useAuth();

  useEffect(() => {
    if (user && profile) {
        fetchOrdersToShip();

        const subscription = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'orders',
          filter: `status=eq.pending`
        },
        (payload) => {
          console.log('🔔 Real-time order change detected:', payload);
          // Refresh the orders list
          fetchOrdersToShip();
        }
      )
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
    }
  }, [user, profile]);

  const fetchOrdersToShip = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching shipping tasks for:', profile?.role, user.id);

      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // SIMPLIFIED DIRECT APPROACH
      let query = supabase
        .from('order_items')
        .select(`
          *,
          orders!inner (
            id,
            created_at,
            status,
            shipping_address,
            contact_phone,
            contact_email,
            wholesaler_fulfillment_order_id,
            order_type,
            shipped_at
          ),
          products!order_items_product_id_fkey(
            name,
            image_url,
            is_proxy
          )
        `)
        .eq('orders.status', 'pending');

      // Add role-specific filters
      if (profile?.role === 'retailer') {
        query = query.eq('seller_id', user.id);
      } else if (profile?.role === 'wholesaler') {
        // Wholesalers see their own items OR fulfillment orders
        query = query.or(`seller_id.eq.${user.id},orders.wholesaler_fulfillment_order_id.not.is.null`);
      }

      const { data: orderItems, error } = await query;
      
      if (error) throw error;

      console.log('📦 Found order items:', orderItems?.length);

      if (!orderItems || orderItems.length === 0) {
        setOrders([]);
        return;
      }

      // Group order items by order
      const ordersMap = new Map();
      
      orderItems.forEach(item => {
        const orderId = item.orders.id;
        
        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, {
            ...item.orders,
            order_items: []
          });
        }
        
        ordersMap.get(orderId).order_items.push({
          ...item,
          products: item.products || { name: 'Unknown Product', image_url: null, is_proxy: false }
        });
      });

      const combinedOrders = Array.from(ordersMap.values());
      console.log('✅ Final combined orders:', combinedOrders.length);
      setOrders(combinedOrders);

    } catch (error) {
      console.error('❌ Error fetching shipping tasks:', error);
      console.error('Error details:', error);
      toast.error('Failed to load shipping tasks');
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your handleShipOrder and JSX remains the same
  const handleShipOrder = async (orderId, orderType, linkedOrderId) => {
    const toastId = toast.loading('Dispatching order...');

    try {
      const timestamp = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          status: 'in_transit', 
          shipped_at: timestamp 
        })
        .eq('id', orderId);

      if (updateError) throw updateError;

      // If this is a proxy fulfillment order, also update the original customer order
      if (linkedOrderId) {
        console.log('🔗 Updating linked customer order:', linkedOrderId);
        const { error: linkedError } = await supabase
          .from('orders')
          .update({ 
            status: 'in_transit',
            shipped_at: timestamp 
          })
          .eq('id', linkedOrderId);
        
        if (linkedError) throw linkedError;
      }

      toast.success('Order dispatched! Status: In Transit', { id: toastId });
      setOrders(prev => prev.filter(o => o.id !== orderId));

      // Auto-delivery after 3 minutes
      setTimeout(async () => {
        console.log('🚚 Auto-delivering order:', orderId);
        const { error: deliverError } = await supabase
          .from('orders')
          .update({ status: 'delivered' })
          .eq('id', orderId);
        
        if (deliverError) console.error('Delivery update failed:', deliverError);

        if (linkedOrderId) {
          const { error: linkedDeliverError } = await supabase
            .from('orders')
            .update({ status: 'delivered' })
            .eq('id', linkedOrderId);
          
          if (linkedDeliverError) console.error('Linked delivery update failed:', linkedDeliverError);
        }
        
        toast.success(`Order #${orderId.slice(0,8)} marked as Delivered!`, { duration: 5000 });
      }, 180000);

    } catch (error) {
      console.error('Shipping error:', error);
      toast.error('Failed to update status', { id: toastId });
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Status</h1>
          <p className="text-gray-500">
            {profile?.role === 'retailer' 
              ? 'Dispatch your products and proxy orders' 
              : 'Dispatch your products and retailer fulfillment orders'}
          </p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
          <span className="text-blue-600 font-bold">{orders.length}</span> to ship
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Truck size={48} className="mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-bold text-gray-800">All Orders Shipped!</h3>
          <p className="text-gray-500">No pending shipping requests.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-blue-50">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded font-mono">#{order.id.slice(0, 8)}</span>
                    <span className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded font-bold">
                      <Clock size={12} className="mr-1" /> Pending Shipment
                    </span>
                    {order.wholesaler_fulfillment_order_id && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold">
                        {profile?.role === 'retailer' ? 'My Proxy Order' : 'Retailer Fulfillment'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 mt-1" size={18} />
                    <p className="text-sm text-gray-600 font-medium w-full md:w-2/3">{order.shipping_address}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    {order.order_items?.map((item, i) => (
                      <img 
                        key={i} 
                        src={item.products?.image_url || '/placeholder.svg'} 
                        className="w-10 h-10 rounded-lg border border-gray-200 object-cover" 
                        alt={item.products?.name} 
                      />
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleShipOrder(order.id, order.order_type, order.wholesaler_fulfillment_order_id)}
                    className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Box size={20} /> Dispatch Order <ArrowUpRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShippingStatus;