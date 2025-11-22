import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import ProductManagement from './ProductManagement';
import WholesalerCatalog from './WholesalerCatalog';

const SellerDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, totalProducts: 0 });
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  
  const { user, profile, loading: authLoading, error: authError } = useAuth();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#ff5757' }}></div>
        <span className="ml-4 text-red-600 font-semibold">Loading your account...</span>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-red-600 font-semibold">Error: {authError}</span>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="text-red-600 font-semibold">Unable to load your profile. Please try logging in again.</span>
      </div>
    );
  }

  useEffect(() => {
    if (user) {
      fetchSellerData();
    }
  }, [user]);

  const fetchSellerData = async () => {
    try {
      setDashboardLoading(true);
      
      // Step 1: Get order items for this seller using the explicit relationship
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (itemsError) throw itemsError;

      // Step 2: Get related orders
      const orderIds = orderItems ? [...new Set(orderItems.map(item => item.order_id))] : [];
      let ordersData = [];
      
      if (orderIds.length > 0) {
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('id', orderIds)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        ordersData = orders || [];
      }

      // Step 3: Get related products using the explicit product_id relationship
      const productIds = orderItems ? [...new Set(orderItems.map(item => item.product_id))] : [];
      let productsData = [];
      
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);

        if (productsError) throw productsError;
        productsData = products || [];
      }

      // Combine the data
      const productMap = new Map(productsData.map(p => [p.id, p]));
      const orderMap = new Map(ordersData.map(o => [o.id, o]));

      const uniqueOrders = [];
      const processedOrderIds = new Set();

      if (orderItems) {
        orderItems.forEach(item => {
          if (item.order_id && orderMap.has(item.order_id) && !processedOrderIds.has(item.order_id)) {
            const order = orderMap.get(item.order_id);
            processedOrderIds.add(item.order_id);
            
            // Get all items for this order
            const orderItemsForOrder = orderItems.filter(oi => oi.order_id === item.order_id);
            
            uniqueOrders.push({
              ...order,
              items: orderItemsForOrder.map(oi => ({
                ...oi,
                products: productMap.get(oi.product_id) || { name: 'Unknown Product', image_url: null }
              }))
            });
          }
        });
      }
      
      setOrders(uniqueOrders);

      // Calculate stats
      const totalSales = orderItems ? orderItems.reduce((sum, item) =>
        sum + (parseFloat(item.price_at_purchase || 0) * (item.quantity || 0)), 0
      ) : 0;

      const { data: products, error: productsCountError } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', user.id);

      if (productsCountError) throw productsCountError;

      setStats({
        totalSales,
        totalOrders: uniqueOrders.length,
        totalProducts: products?.length || 0
      });

    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2" 
          style={{ borderColor: '#ff5757' }}
        ></div>
        <span className="ml-4 text-red-600 font-semibold">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex space-x-4 border-b-2 border-red-200 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'text-white shadow-lg'
              : 'text-red-600 bg-white border-2 border-red-200'
          }`}
          style={{
            background: activeTab === 'products' ? 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' : 'transparent'
          }}
        >
          My Products
        </button>
        
        {profile?.role === 'retailer' && (
          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'text-white shadow-lg'
                : 'text-red-600 bg-white border-2 border-red-200'
            }`}
            style={{
              background: activeTab === 'catalog' ? 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' : 'transparent'
            }}
          >
            Wholesaler Catalog
          </button>
        )}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'products' && (
        <>
          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Sales */}
            <div className="rounded-xl p-6 text-white shadow-lg transition-transform hover:-translate-y-1 cursor-pointer" 
                 style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Total Sales</p>
                  <p className="text-4xl font-bold mt-2">₹{stats.totalSales.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div className="rounded-xl p-6 text-white shadow-lg transition-transform hover:-translate-y-1 cursor-pointer"
                 style={{ background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Total Orders</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalOrders}</p>
                </div>
              </div>
            </div>

            {/* Total Products */}
            <div className="rounded-xl p-6 text-white shadow-lg transition-transform hover:-translate-y-1 cursor-pointer"
                 style={{ background: 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Total Products</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalProducts}</p>
                </div>
              </div>
            </div>

            {/* Average Order Value */}
            <div className="rounded-xl p-6 text-white shadow-lg transition-transform hover:-translate-y-1 cursor-pointer"
                 style={{ background: 'linear-gradient(135deg, #fda4af 0%, #fb7185 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-90 font-medium">Avg. Order Value</p>
                  <p className="text-4xl font-bold mt-2">
                    ₹{stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders).toFixed(2) : '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[800px] overflow-y-auto pr-2 custom-scrollbar border-2 border-transparent hover:border-red-100 rounded-xl transition-all">
            <ProductManagement />
          </div>

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
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
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
                            src={item.products?.image_url || 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=100'}
                            alt={item.products?.name || 'Product'}
                            className="w-12 h-12 object-cover rounded"
                            style={{ border: '2px solid #fca5a5' }}
                          />
                          <div className="flex-1">
                            <p 
                              className="text-sm font-medium"
                              style={{ color: '#b91c1c' }}
                            >
                              {item.products?.name || 'Unknown Product'}
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
                            ₹{(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}
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
                        Shipping to: {order.shipping_address?.slice(0, 50)}...
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'catalog' && profile?.role === 'retailer' && (
        <WholesalerCatalog />
      )}
    </div>
  );
};

export default SellerDashboard;