import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Box, MapPin, Clock, ArrowUpRight, AlertCircle } from 'lucide-react';
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
        .channel('shipping-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, 
          () => fetchOrdersToShip()
        )
        .subscribe();

      return () => { subscription.unsubscribe(); };
    }
  }, [user, profile]);

  const fetchOrdersToShip = async () => {
    try {
      setLoading(true);
      let relevantOrderItems = [];

      if (profile.role === 'retailer') {
        // --- RETAILER VIEW ---
        const { data: myItems, error } = await supabase
          .from('order_items')
          // FIX: Explicitly specify the foreign key relationship
          .select(`*, products:products!order_items_product_id_fkey!inner(name, image_url, is_proxy)`)
          .eq('seller_id', user.id);
        
        if (error) throw error;
        
        relevantOrderItems = myItems.filter(item => item.products.is_proxy === false);

      } else if (profile.role === 'wholesaler') {
        // --- WHOLESALER VIEW ---
        
        // 1. DIRECT SALES
        const { data: directItems, error: directError } = await supabase
          .from('order_items')
          // FIX: Explicitly specify the foreign key relationship
          .select(`*, products:products!order_items_product_id_fkey!inner(name, image_url, is_proxy)`)
          .eq('seller_id', user.id);
        
        if (directError) throw directError;

        // 2. PROXY SALES
        const { data: mySuppliedProducts } = await supabase
          .from('products')
          .select('id')
          .eq('wholesaler_id', user.id);
          
        let proxyItems = [];
        const productIds = mySuppliedProducts?.map(p => p.id) || [];

        if (productIds.length > 0) {
            const { data: pItems, error: pError } = await supabase
                .from('order_items')
                // FIX: Explicitly specify the foreign key relationship
                .select(`*, products:products!order_items_product_id_fkey!inner(name, image_url, is_proxy)`)
                .in('product_id', productIds);
            
            if (pError) throw pError;
            proxyItems = pItems || [];
        }

        relevantOrderItems = [...(directItems || []), ...proxyItems];
      }

      if (relevantOrderItems.length === 0) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const orderIds = [...new Set(relevantOrderItems.map(item => item.order_id))];
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('id', orderIds)
        //.neq('status', 'delivered') 
        //.neq('status', 'cancelled')
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      const combinedOrders = ordersData.reduce((acc, order) => {
        const itemsInOrder = relevantOrderItems.filter(item => item.order_id === order.id);

        if (itemsInOrder.length === 0) return acc;

        const isProxyGroup = itemsInOrder.some(item => item.products.is_proxy === true);

        if (profile.role === 'wholesaler' && isProxyGroup) {
            if (!order.wholesaler_payment_made) {
                return acc;
            }
        }

        acc.push({
            ...order,
            order_items: itemsInOrder,
            is_proxy_shipment: isProxyGroup
        });
        
        return acc;
      }, []);

      setOrders(combinedOrders);

    } catch (error) {
      console.error('❌ Error fetching shipping tasks:', error);
      // Clean error message for UI
      toast.error('Failed to load shipping tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleShipOrder = async (orderId) => {
    const toastId = toast.loading('Dispatching order...');
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'in_transit',
          shipped_at: new Date().toISOString() 
        })
        .eq('id', orderId);
  
      if (error) throw error;
  
      toast.success('Order dispatched successfully!', { id: toastId });
      setOrders(prev => prev.filter(o => o.id !== orderId));
  
    } catch (error) {
      console.error('Shipping error:', error);
      toast.error('Failed to update status', { id: toastId });
    }
  };

  if (loading) return <div className="min-h-screen flex justify-center items-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Status</h1>
          <p className="text-gray-500">
            {profile?.role === 'retailer' 
              ? 'Manage shipments for your physical stock' 
              : 'Manage direct orders & inbound proxy fulfillments'}
          </p>
        </div>
        <div className="bg-red-50 px-4 py-2 rounded-lg border border-red-100">
          <span className="text-red-600 font-bold">{orders.length}</span> pending
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Truck size={48} className="mx-auto mb-4 text-green-500" />
          <h3 className="text-xl font-bold text-gray-800">All Caught Up!</h3>
          <p className="text-gray-500">No orders pending shipment.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-red-100">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-500 font-mono">#{order.id.slice(0, 8)}</span>
                    <span className={`flex items-center text-xs px-2 py-1 rounded font-bold ${
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-50 text-orange-600'
                    }`}>
                      <Clock size={12} className="mr-1" /> {order.status.toUpperCase()}
                    </span>
                    
                    {profile.role === 'wholesaler' && order.is_proxy_shipment && (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold flex items-center">
                            <AlertCircle size={10} className="mr-1"/> PROXY (PAID)
                        </span>
                    )}
                    {profile.role === 'wholesaler' && !order.is_proxy_shipment && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                            DIRECT SALE
                        </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      {order.order_items?.map((item, index) => (
                        <span key={item.id}>
                          {item.products?.name}
                          {index < order.order_items.length - 1 ? ', ' : ''}
                        </span>
                      ))}
                    </p>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="text-gray-400 mt-0.5" size={16} />
                    <p className="text-sm text-gray-600 font-medium">{order.shipping_address}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleShipOrder(order.id)}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 text-sm"
                  >
                    <Box size={16} /> Dispatch Order <ArrowUpRight size={14} />
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
