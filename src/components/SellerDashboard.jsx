import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProductManagement from './ProductManagement';

const SellerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0 });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchSellerData();
  }, [user]);

  const fetchSellerData = async () => {
    try {
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*, orders(id, created_at, status, shipping_address), products(name, image_url)')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      const uniqueOrders = [];
      const orderMap = new Map();

      orderItems.forEach(item => {
        if (!orderMap.has(item.orders.id)) {
          orderMap.set(item.orders.id, {
            ...item.orders,
            items: []
          });
        }
        orderMap.get(item.orders.id).items.push(item);
      });

      uniqueOrders.push(...orderMap.values());
      setOrders(uniqueOrders);

      const totalSales = orderItems.reduce((sum, item) =>
        sum + (parseFloat(item.price_at_purchase) * item.quantity), 0
      );

      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id);

      setStats({
        totalSales,
        totalOrders: uniqueOrders.length,
        totalProducts: products?.length || 0
      });

    } catch (error) {
      console.error('Error fetching seller data:', error);
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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Sales</h3>
          <p className="text-3xl font-bold mt-2">${stats.totalSales.toFixed(2)}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Orders</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Products</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
        </div>
      </div>

      <ProductManagement />

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Orders</h2>

        {orders.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No orders yet</p>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
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

                <div className="border-t pt-3">
                  <p className="text-sm text-gray-600">
                    Shipping to: {order.shipping_address.slice(0, 50)}...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
