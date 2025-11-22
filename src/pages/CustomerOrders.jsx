import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Package, Search, Calendar, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const CustomerOrders = () => {
  const [customersData, setCustomersData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCustomerOrders();
      
      const subscription = supabase
        .channel('customer_orders_updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          () => {
            fetchCustomerOrders();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);

      // 1. Get all products that belong to this retailer
      const { data: retailerProducts, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id);

      if (productsError) throw productsError;

      if (!retailerProducts || retailerProducts.length === 0) {
        setCustomersData({});
        setLoading(false);
        return;
      }

      const productIds = retailerProducts.map(p => p.id);

      // 2. Get order items. 
      // 🔴 CHANGE: Removed 'payments' from the select query
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price_at_purchase,
          product_id,
          order_id,
          orders!inner (
            id,
            user_id,
            total_amount,
            status,
            created_at,
            payment_method
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // 3. Filter for valid orders (e.g., not cancelled)
      // 🔴 CHANGE: Check order status instead of non-existent 'payments' table
      // In your flow, if an order exists, it is considered "paid" or "confirmed" unless cancelled.
      const completedOrderItems = orderItems.filter(item => 
        item.orders.status !== 'cancelled'
      );

      // 4. Get customer profiles
      const customerIds = [...new Set(completedOrderItems.map(item => item.orders.user_id))];
      let profilesMap = {};
      
      if (customerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', customerIds);
        
        if (profilesError) throw profilesError;
        
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }

      // 5. Get product details
      const { data: products, error: productsDetailsError } = await supabase
        .from('products')
        .select('id, name, image_url')
        .in('id', productIds);

      if (productsDetailsError) throw productsDetailsError;

      const productsMap = products.reduce((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {});

      // Group data by customer
      const grouped = {};
      
      completedOrderItems.forEach(item => {
        const customerId = item.orders.user_id;
        const customerProfile = profilesMap[customerId];
        const product = productsMap[item.product_id];

        if (!grouped[customerId]) {
          grouped[customerId] = {
            profile: customerProfile || { full_name: 'Unknown Customer' },
            orders: []
          };
        }

        grouped[customerId].orders.push({
          id: `${item.order_id}-${item.id}`,
          orderId: item.order_id,
          productName: product?.name || 'Unknown Product',
          productImage: product?.image_url,
          quantity: item.quantity,
          totalPayment: item.orders.total_amount,
          date: item.orders.created_at,
          status: item.orders.status,
          // Note: schema uses 'price_at_purchase', your code had 'price_at_time'
          itemPrice: item.price_at_purchase 
        });
      });

      setCustomersData(grouped);

    } catch (error) {
      console.error('Error fetching customer orders:', error);
      toast.error('Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  const filteredCustomers = Object.values(customersData).filter(data => 
    data.profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-red-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="text-red-600" /> Customer Orders
          </h1>
          <p className="text-gray-500 mt-1">
            History of customers who have purchased from you
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-red-50 border border-red-100 rounded-xl focus:outline-none focus:border-red-300"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
          No customer orders found.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCustomers.map((customer, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-md border border-red-100 overflow-hidden flex flex-col h-[500px]">
              <div className="p-4 bg-gradient-to-r from-red-50 to-white border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
                    {customer.profile.full_name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{customer.profile.full_name}</h3>
                    <span className="text-xs text-gray-500">{customer.orders.length} Orders</span>
                  </div>
                </div>
              </div>

              <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                {customer.orders.map((order) => (
                  <div key={order.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-red-200 transition-all">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-gray-200 flex-shrink-0">
                        <img 
                          src={order.productImage || '/placeholder.svg'} 
                          alt={order.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate" title={order.productName}>
                          {order.productName}
                        </p>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Package size={10} /> Qty: {order.quantity}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar size={10} /> {new Date(order.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between items-center">
                      <span className="text-xs text-gray-500">Transaction Total:</span>
                      <span className="text-sm font-bold text-red-600 flex items-center gap-1">
                        <CreditCard size={12} /> ₹{order.totalPayment}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerOrders;