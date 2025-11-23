import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Truck, Box, MapPin, Clock, ArrowUpRight, AlertCircle, Store, Check } from 'lucide-react';
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

      // Common select part including Seller (Retailer) details
      // We fetch the seller profile to know WHERE to ship for proxy orders
      const selectQuery = `
        *,
        products:products!order_items_product_id_fkey!inner(name, image_url, is_proxy),
        seller:profiles!seller_id(full_name, address, location_address)
      `;

      if (profile.role === 'retailer') {
        // --- RETAILER VIEW ---
        const { data: myItems, error } = await supabase
          .from('order_items')
          .select(selectQuery)
          .eq('seller_id', user.id);
        
        if (error) throw error;
        // Retailer only ships their OWN stock (not proxy items they bought)
        relevantOrderItems = myItems.filter(item => item.products.is_proxy === false);

      } else if (profile.role === 'wholesaler') {
        // --- WHOLESALER VIEW ---
        
        // 1. DIRECT SALES (Wholesaler selling directly to customer)
        const { data: directItems, error: directError } = await supabase
          .from('order_items')
          .select(selectQuery)
          .eq('seller_id', user.id);
        
        if (directError) throw directError;

        // 2. PROXY SALES (Retailer selling Wholesaler's product)
        const { data: mySuppliedProducts } = await supabase
          .from('products')
          .select('id')
          .eq('wholesaler_id', user.id);
          
        let proxyItems = [];
        const productIds = mySuppliedProducts?.map(p => p.id) || [];

        if (productIds.length > 0) {
            const { data: pItems, error: pError } = await supabase
                .from('order_items')
                .select(selectQuery)
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
        .in('status', ['pending', 'processing'])
        .order('created_at', { ascending: true });

      if (ordersError) throw ordersError;

      const combinedOrders = ordersData.reduce((acc, order) => {
        const itemsInOrder = relevantOrderItems.filter(item => item.order_id === order.id);

        if (itemsInOrder.length === 0) return acc;

        const isProxyGroup = itemsInOrder.some(item => item.products.is_proxy === true);

        // For Wholesaler Proxy: Only show if Retailer has paid
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
      toast.error('Failed to load shipping tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleShipOrder = async (orderId) => {
    const toastId = toast.loading('Updating status...');
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: 'in_transit', // Maps to "At Store" (Direct) or "On Way" (Proxy)
          shipped_at: new Date().toISOString() 
        })
        .eq('id', orderId);
  
      if (error) throw error;
  
      toast.success('Status updated successfully!', { id: toastId });
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
              ? 'Manage store readiness' 
              : 'Manage shipments & fulfillments'}
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
          <p className="text-gray-500">No orders pending action.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const isOffline = order.fulfillment_type === 'offline_pickup';
            let actionLabel = "Dispatch Order";
            let actionIcon = <Box size={16} />;
            let destinationAddress = order.shipping_address;
            let destinationLabel = "Shipping Address";

            // Logic for Offline Orders (Case 1, 2, 3)
            if (isOffline) {
                if (profile.role === 'wholesaler' && order.is_proxy_shipment) {
                    // Case 3: Wholesaler shipping to Retailer
                    actionLabel = "Dispatch to Retailer";
                    actionIcon = <Truck size={16} />;
                    
                    // Show Retailer's Address (fetched from profiles relation)
                    const retailer = order.order_items[0]?.seller;
                    destinationAddress = retailer?.location_address || retailer?.address || "Address not available";
                    destinationLabel = `Ship to Retailer (${retailer?.full_name || 'Store'})`;
                } else {
                    // Case 1 & 2: Direct Sale (Item is at the shop)
                    actionLabel = "Mark Ready at Store";
                    actionIcon = <Store size={16} />;
                    destinationAddress = "Customer will pick up at store";
                    destinationLabel = "Pickup";
                }
            }

            return (
            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-all border border-red-100">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-500 font-mono">#{order.id.slice(0, 8)}</span>
                    
                    {/* Status Badge */}
                    <span className={`flex items-center text-xs px-2 py-1 rounded font-bold ${
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-50 text-orange-600'
                    }`}>
                      <Clock size={12} className="mr-1" /> {order.status.toUpperCase()}
                    </span>
                    
                    {/* Type Badge */}
                    {profile.role === 'wholesaler' && order.is_proxy_shipment ? (
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold flex items-center">
                            <AlertCircle size={10} className="mr-1"/> PROXY (PAID)
                        </span>
                    ) : isOffline && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold flex items-center">
                            <Store size={10} className="mr-1"/> OFFLINE PICKUP
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

                  {/* Dynamic Address Display */}
                  <div className="flex items-start gap-3 bg-gray-50 p-2 rounded-lg">
                    <MapPin className="text-red-500 mt-0.5 shrink-0" size={16} />
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase mb-0.5">{destinationLabel}</p>
                        <p className="text-sm text-gray-800 font-medium leading-tight">
                            {destinationAddress}
                        </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleShipOrder(order.id)}
                    className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center gap-2 text-sm"
                  >
                    {actionIcon} {actionLabel} <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default ShippingStatus;
