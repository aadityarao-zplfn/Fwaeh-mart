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
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2" 
          style={{ borderColor: '#ff5757' }}
        ></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div 
          className="rounded-xl p-6 text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)'
          }}
        >
          <h3 className="text-sm font-medium opacity-90">Total Sales</h3>
          <p className="text-3xl font-bold mt-2">${stats.totalSales.toFixed(2)}</p>
        </div>
        <div 
          className="rounded-xl p-6 text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #ff7b7b 0%, #ffa5a5 100%)'
          }}
        >
          <h3 className="text-sm font-medium opacity-90">Total Orders</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalOrders}</p>
        </div>
        <div 
          className="rounded-xl p-6 text-white shadow-lg"
          style={{
            background: 'linear-gradient(135deg, #ff9999 0%, #ffb8b8 100%)'
          }}
        >
          <h3 className="text-sm font-medium opacity-90">Total Products</h3>
          <p className="text-3xl font-bold mt-2">{stats.totalProducts}</p>
        </div>
      </div>

      <ProductManagement />

      {/* Recent Orders Section */}
      <div 
        className="rounded-xl p-6 shadow-md"
        style={{
          background: '#fff5f5',
          border: '2px solid #fca5a5'
        }}
      >
        <h2 
          className="text-2xl font-bold mb-6"
          style={{ color: '#b91c1c' }}
        >
          Recent Orders
        </h2>

        {orders.length === 0 ? (
          <p 
            className="text-center py-8"
            style={{ color: '#dc2626' }}
          >
            No orders yet
          </p>
        ) : (
          <div className="space-y-4">
            {orders.slice(0, 5).map((order) => (
              <div 
                key={order.id} 
                className="rounded-lg p-4"
                style={{
                  background: '#ffffff',
                  border: '2px solid #fca5a5'
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p 
                      className="text-sm"
                      style={{ color: '#dc2626' }}
                    >
                      Order ID: <span className="font-mono" style={{ color: '#b91c1c' }}>{order.id.slice(0, 8)}</span>
                    </p>
                    <p 
                      className="text-sm"
                      style={{ color: '#dc2626' }}
                    >
                      Date: {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    order.status === 'processing' ? 'bg-rose-100 text-rose-800' :
                    order.status === 'shipped' ? 'bg-pink-100 text-pink-800' :
                    order.status === 'delivered' ? 'bg-red-100 text-red-800' :
                    'bg-red-200 text-red-900'
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
                        style={{ border: '2px solid #fca5a5' }}
                      />
                      <div className="flex-1">
                        <p 
                          className="text-sm font-medium"
                          style={{ color: '#b91c1c' }}
                        >
                          {item.products.name}
                        </p>
                        <p 
                          className="text-xs"
                          style={{ color: '#dc2626' }}
                        >
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p 
                        className="text-sm font-semibold"
                        style={{ color: '#ff5757' }}
                      >
                        ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div 
                  className="border-t pt-3"
                  style={{ borderColor: '#fca5a5' }}
                >
                  <p 
                    className="text-sm"
                    style={{ color: '#dc2626' }}
                  >
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