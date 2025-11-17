import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const CustomerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
  }, [user]);

const fetchOrders = async () => {
  try {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    const ordersWithItems = await Promise.all(
      ordersData.map(async (order) => {
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select(`
            *,
            products (
              name,
              image_url
            )
          `)
          .eq('order_id', order.id);

        if (itemsError) {
          console.error('Error fetching order items:', itemsError);
          return { ...order, items: [] };
        }

        return { ...order, items: items || [] };
      })
    );

    setOrders(ordersWithItems);
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setLoading(false);
  }
};
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>

        {orders.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-600">
                      Order ID: <span className="font-mono">{order.id.slice(0, 8)}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      Date: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'shipped' ? 'bg-cyan-100 text-cyan-800' :
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-3">
                      <img
                        src={item.products.image_url || 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=100'}
                        alt={item.products.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.products.name}</p>
                        <p className="text-xs text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold">
                        ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-600">Shipping Address:</span>
                  <span className="text-sm font-medium">{order.shipping_address.slice(0, 50)}...</span>
                </div>

                <div className="border-t pt-3 flex justify-between items-center mt-2">
                  <span className="font-semibold">Total Amount:</span>
                  <span className="text-xl font-bold text-primary-600">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
