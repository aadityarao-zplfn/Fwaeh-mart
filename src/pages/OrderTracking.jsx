'use client';

import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, XCircle, Eye, Search, Filter, Calendar, MapPin, Phone, Mail, FileText, ArrowLeft, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Make sure you have this configured

export default function OrderTrackingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [view, setView] = useState('list');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user logged in');
        setOrders([]);
        setLoading(false);
        return;
      }

      // Fetch orders from your actual database
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
        return;
      }

      // Transform the data to match your component structure
      const formattedOrders = data.map(order => ({
        id: order.order_number || order.id,
        date: order.created_at,
        time: new Date(order.created_at).toLocaleTimeString('en-IN', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }),
        status: order.status || 'processing',
        items: order.order_items?.length || 0,
        total: order.total_amount || 0,
        itemsPreview: order.order_items?.slice(0, 3).map(item => ({
          name: item.products?.name || 'Product',
          image: item.products?.image_url || '/api/placeholder/60/60',
          quantity: item.quantity || 1,
          price: item.price || 0
        })) || [],
        estimatedDelivery: order.estimated_delivery,
        deliveredDate: order.delivered_date,
        shipping_address: order.shipping_address,
        contact_phone: order.contact_phone,
        contact_email: order.contact_email,
        payment_method: order.payment_method
      }));

      setOrders(formattedOrders);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      delivered: {
        label: 'Delivered',
        icon: CheckCircle,
        color: '#4caf50',
        bg: 'rgba(76, 175, 80, 0.1)',
        border: 'rgba(76, 175, 80, 0.3)'
      },
      shipped: {
        label: 'Shipped',
        icon: Truck,
        color: '#2196f3',
        bg: 'rgba(33, 150, 243, 0.1)',
        border: 'rgba(33, 150, 243, 0.3)'
      },
      processing: {
        label: 'Processing',
        icon: Clock,
        color: '#ff9800',
        bg: 'rgba(255, 152, 0, 0.1)',
        border: 'rgba(255, 152, 0, 0.3)'
      },
      cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        color: '#f44336',
        bg: 'rgba(244, 67, 54, 0.1)',
        border: 'rgba(244, 67, 54, 0.3)'
      }
    };
    return configs[status] || configs.processing;
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setView('detail');
  };

  const handleBackToList = () => {
    setView('list');
    setSelectedOrder(null);
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === '' || 
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toUpperCase().includes(searchQuery.toUpperCase());
    const matchesFilter = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div style={{ background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)' }} className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (view === 'detail' && selectedOrder) {
    return <OrderDetailView order={selectedOrder} onBack={handleBackToList} />;
  }

  return (
    <div style={{ background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)' }} className="min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#a94442' }}>Fwach Mart</h1>
        <div className="flex gap-6 items-center">
          <a href="/products" className="font-medium" style={{ color: '#cd5c5c' }}>Products</a>
          <a href="/cart" className="font-medium" style={{ color: '#cd5c5c' }}>Cart</a>
          <button 
            className="px-6 py-2 rounded-lg font-medium text-white" 
            style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
            onClick={() => window.location.href = '/dashboard'}
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-4xl font-bold mb-2" style={{ color: '#a94442' }}>
            My Orders
          </h2>
          <p style={{ color: '#cd5c5c' }} className="text-lg">
            {orders.length === 0 ? 'Start shopping to see your orders here' : 'Track and manage all your orders'}
          </p>
        </div>

        {/* Search and Filter Bar - Only show if there are orders */}
        {orders.length > 0 && (
          <div 
            className="rounded-2xl p-6 mb-8 shadow-lg"
            style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
          >
            <div className="grid md:grid-cols-2 gap-4">
              {/* Search */}
              <div className="relative">
                <Search 
                  size={20} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2" 
                  style={{ color: '#cd5c5c' }} 
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Order ID..."
                  className="w-full pl-12 pr-4 py-3 rounded-lg outline-none font-medium"
                  style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                />
              </div>

              {/* Filter */}
              <div className="relative">
                <Filter 
                  size={20} 
                  className="absolute left-4 top-1/2 transform -translate-y-1/2" 
                  style={{ color: '#cd5c5c' }} 
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-lg outline-none font-medium appearance-none"
                  style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                >
                  <option value="all">All Orders</option>
                  <option value="delivered">Delivered</option>
                  <option value="shipped">Shipped</option>
                  <option value="processing">Processing</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div 
            className="text-center py-20 rounded-3xl animate-fade-in"
            style={{ background: 'rgba(255, 255, 255, 0.6)', border: '2px solid #f8b4b4' }}
          >
            <ShoppingBag size={64} className="mx-auto mb-4" style={{ color: '#e57373' }} />
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#a94442' }}>
              No orders yet
            </h3>
            <p style={{ color: '#cd5c5c' }} className="mb-6">
              Start shopping to see your orders here
            </p>
            <button 
              className="px-8 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
              onClick={() => window.location.href = '/products'}
            >
              Start Shopping
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div 
            className="text-center py-20 rounded-3xl"
            style={{ background: 'rgba(255, 255, 255, 0.6)', border: '2px solid #f8b4b4' }}
          >
            <Package size={64} className="mx-auto mb-4" style={{ color: '#e57373' }} />
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#a94442' }}>
              No orders found
            </h3>
            <p style={{ color: '#cd5c5c' }}>
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={order.id}
                  className="rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all animate-scale-in"
                  style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Order Info */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold" style={{ color: '#a94442' }}>
                              Order #{order.id}
                            </h3>
                            <div 
                              className="flex items-center gap-2 px-3 py-1 rounded-full"
                              style={{ 
                                background: statusConfig.bg, 
                                border: `2px solid ${statusConfig.border}` 
                              }}
                            >
                              <StatusIcon size={16} style={{ color: statusConfig.color }} />
                              <span className="text-sm font-bold" style={{ color: statusConfig.color }}>
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm" style={{ color: '#cd5c5c' }}>
                            <div className="flex items-center gap-2">
                              <Calendar size={16} />
                              <span>{new Date(order.date).toLocaleDateString('en-IN')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock size={16} />
                              <span>{order.time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-bold mb-1" style={{ color: '#cd5c5c' }}>
                            Total Amount
                          </p>
                          <p className="text-2xl font-bold" style={{ color: '#e57373' }}>
                            ₹{order.total.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Items Preview */}
                      {order.itemsPreview.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-bold mb-3" style={{ color: '#a94442' }}>
                            {order.items} {order.items === 1 ? 'Item' : 'Items'}
                          </p>
                          <div className="flex gap-3 flex-wrap">
                            {order.itemsPreview.map((item, index) => (
                              <div 
                                key={index}
                                className="w-16 h-16 rounded-lg overflow-hidden"
                                style={{ background: 'linear-gradient(135deg, #fce4e4 0%, #fef0f0 100%)' }}
                              >
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = '/api/placeholder/60/60';
                                  }}
                                />
                              </div>
                            ))}
                            {order.items > order.itemsPreview.length && (
                              <div 
                                className="w-16 h-16 rounded-lg flex items-center justify-center font-bold"
                                style={{ background: 'rgba(229, 115, 115, 0.1)', color: '#e57373', border: '2px solid #f8b4b4' }}
                              >
                                +{order.items - order.itemsPreview.length}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Delivery Info */}
                      {order.status === 'shipped' && order.estimatedDelivery && (
                        <div 
                          className="p-3 rounded-lg flex items-center gap-2 mb-4"
                          style={{ background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.3)' }}
                        >
                          <Truck size={18} style={{ color: '#2196f3' }} />
                          <span className="text-sm font-medium" style={{ color: '#1976d2' }}>
                            Estimated delivery: {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}

                      {order.status === 'delivered' && order.deliveredDate && (
                        <div 
                          className="p-3 rounded-lg flex items-center gap-2 mb-4"
                          style={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}
                        >
                          <CheckCircle size={18} style={{ color: '#4caf50' }} />
                          <span className="text-sm font-medium" style={{ color: '#2e7d32' }}>
                            Delivered on {new Date(order.deliveredDate).toLocaleDateString('en-IN', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}

                      {order.status === 'processing' && order.estimatedDelivery && (
                        <div 
                          className="p-3 rounded-lg flex items-center gap-2 mb-4"
                          style={{ background: 'rgba(255, 152, 0, 0.1)', border: '1px solid rgba(255, 152, 0, 0.3)' }}
                        >
                          <Clock size={18} style={{ color: '#ff9800' }} />
                          <span className="text-sm font-medium" style={{ color: '#f57c00' }}>
                            Processing - Expected by {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="flex items-center">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="px-8 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2 whitespace-nowrap"
                        style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
                      >
                        <Eye size={20} />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Summary Stats - Only show if there are orders */}
        {orders.length > 0 && (
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            {[
              { label: 'Total Orders', value: orders.length, icon: Package, color: '#e57373' },
              { label: 'Delivered', value: orders.filter(o => o.status === 'delivered').length, icon: CheckCircle, color: '#4caf50' },
              { label: 'In Transit', value: orders.filter(o => o.status === 'shipped').length, icon: Truck, color: '#2196f3' },
              { label: 'Processing', value: orders.filter(o => o.status === 'processing').length, icon: Clock, color: '#ff9800' }
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                 key={index}
className="rounded-2xl p-6 shadow-lg animate-fade-in-up"
style={{ 
  animationDelay: `${index * 0.1}s`,
  background: 'rgba(255, 255, 255, 0.8)', 
  border: '2px solid #f8b4b4' 
}} >
                  <div className="flex items-center justify-between mb-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ background: `${stat.color}20` }}
                    >
                      <Icon size={24} style={{ color: stat.color }} />
                    </div>
                    <span className="text-3xl font-bold" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                  </div>
                  <p className="font-bold" style={{ color: '#a94442' }}>
                    {stat.label}
                </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Order Detail Component
function OrderDetailView({ order, onBack }) {
  const getStatusConfig = (status) => {
    const configs = {
      delivered: {
        label: 'Delivered',
        icon: CheckCircle,
        color: '#4caf50',
        bg: 'rgba(76, 175, 80, 0.1)',
        border: 'rgba(76, 175, 80, 0.3)'
      },
      shipped: {
        label: 'Shipped',
        icon: Truck,
        color: '#2196f3',
        bg: 'rgba(33, 150, 243, 0.1)',
        border: 'rgba(33, 150, 243, 0.3)'
      },
      processing: {
        label: 'Processing',
        icon: Clock,
        color: '#ff9800',
        bg: 'rgba(255, 152, 0, 0.1)',
        border: 'rgba(255, 152, 0, 0.3)'
      },
      cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        color: '#f44336',
        bg: 'rgba(244, 67, 54, 0.1)',
        border: 'rgba(244, 67, 54, 0.3)'
      }
    };
    return configs[status];
  };

  const getOrderSteps = (status) => {
    const steps = [
      { key: 'processing', label: 'Processing', icon: Package },
      { key: 'shipped', label: 'Shipped', icon: Truck },
      { key: 'delivered', label: 'Delivered', icon: CheckCircle },
    ];

    const statusOrder = ['processing', 'shipped', 'delivered'];
    const currentIndex = statusOrder.indexOf(status);

    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      active: index === currentIndex,
    }));
  };

  const orderSteps = getOrderSteps(order.status);
  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div style={{ background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)' }} className="min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#a94442' }}>Fwaeh Mart</h1>
        <div className="flex gap-6 items-center">
          <a href="#" className="font-medium" style={{ color: '#cd5c5c' }}>Products</a>
          <a href="#" className="font-medium" style={{ color: '#cd5c5c' }}>Cart</a>
          <button 
            className="px-6 py-2 rounded-lg font-medium text-white" 
            style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
            onClick={() => window.location.href = '/orders'}
          >
            Dashboard
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center mb-6 font-bold transition-all hover:scale-105"
          style={{ color: '#a94442' }}
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Orders
        </button>

        {/* Header */}
        <div 
          className="rounded-3xl p-6 mb-6 shadow-lg"
          style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#a94442' }}>Order Tracking</h1>
              <p className="font-medium" style={{ color: '#cd5c5c' }}>
                Order ID: <span className="font-mono font-bold">{order.id}</span>
              </p>
            </div>
            <div 
              className="flex items-center gap-2 px-4 py-2 rounded-full self-start"
              style={{ 
                background: statusConfig.bg, 
                border: `2px solid ${statusConfig.border}` 
              }}
            >
              <StatusIcon size={20} style={{ color: statusConfig.color }} />
              <span className="font-bold" style={{ color: statusConfig.color }}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          <p className="font-medium" style={{ color: '#cd5c5c' }}>
            Ordered on {new Date(order.date).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>

        {/* Order Status Timeline */}
        <div 
          className="rounded-3xl p-6 mb-6 shadow-lg"
          style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: '#a94442' }}>Order Status</h2>
          
          <div className="relative">
            {/* Progress Line */}
            <div className="absolute top-6 left-6 right-6 h-2" style={{ background: 'rgba(248, 180, 180, 0.3)' }}>
              <div
                className="h-full transition-all duration-500"
                style={{ 
                  background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)',
                  width: `${(orderSteps.filter(s => s.completed).length - 1) / (orderSteps.length - 1) * 100}%`
                }}
              />
            </div>

            {/* Steps */}
            <div className="relative flex justify-between">
              {orderSteps.map((step, index) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.key} className="flex flex-col items-center flex-1">
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all z-10 ${
                        step.active ? 'ring-4 shadow-lg' : ''
                      }`}
                      style={{ 
                        background: step.completed 
                          ? 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' 
                          : 'rgba(248, 180, 180, 0.3)',
                        color: step.completed ? 'white' : '#cd5c5c',
                        border: step.active ? '4px solid rgba(229, 115, 115, 0.3)' : 'none'
                      }}
                    >
                      {step.completed ? (
                        <CheckCircle size={24} />
                      ) : (
                        <StepIcon size={24} />
                      )}
                    </div>
                    <span 
                      className="mt-2 font-bold text-center"
                      style={{ color: step.completed ? '#a94442' : '#cd5c5c' }}
                    >
                      {step.label}
                    </span>
                    {step.active && (
                      <span className="mt-1 text-sm text-center max-w-xs" style={{ color: '#cd5c5c' }}>
                        {step.key === 'processing' && 'Your order is being prepared for shipment'}
                        {step.key === 'shipped' && 'Your order is on the way'}
                        {step.key === 'delivered' && 'Your order has been delivered successfully'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Items */}
          <div className="lg:col-span-2 space-y-6">
            <div 
              className="rounded-3xl p-6 shadow-lg"
              style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: '#a94442' }}>Order Items</h2>
              <div className="space-y-4">
                {order.itemsPreview.map((item, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-4 p-4 rounded-xl"
                    style={{ background: 'rgba(255, 255, 255, 0.9)', border: '2px solid #f8b4b4' }}
                  >
                    <div 
                      className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #fce4e4 0%, #fef0f0 100%)' }}
                    >
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg" style={{ color: '#a94442' }}>{item.name}</h3>
                      <p className="font-medium" style={{ color: '#cd5c5c' }}>Quantity: {item.quantity || 1}</p>
                      {item.price && (
                        <p className="font-medium" style={{ color: '#cd5c5c' }}>
                          Price: ₹{item.price.toFixed(2)} each
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold" style={{ color: '#e57373' }}>
                        ₹{((item.price || order.total / order.items) * (item.quantity || 1)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t" style={{ borderColor: '#f8b4b4' }}>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold" style={{ color: '#a94442' }}>Total Amount</span>
                  <span className="text-3xl font-bold" style={{ color: '#e57373' }}>
                    ₹{order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Delivery Information */}
            <div 
              className="rounded-3xl p-6 shadow-lg"
              style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: '#a94442' }}>Delivery Information</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin size={20} className="mt-1 mr-3 flex-shrink-0" style={{ color: '#e57373' }} />
                  <div>
                    <p className="font-bold mb-1" style={{ color: '#a94442' }}>Shipping Address</p>
                    <p className="font-medium" style={{ color: '#cd5c5c' }}>{order.shipping_address}</p>
                  </div>
                </div>

                {order.contact_phone && (
                  <div className="flex items-start">
                    <Phone size={20} className="mt-1 mr-3 flex-shrink-0" style={{ color: '#e57373' }} />
                    <div>
                      <p className="font-bold mb-1" style={{ color: '#a94442' }}>Contact Phone</p>
                      <p className="font-medium" style={{ color: '#cd5c5c' }}>{order.contact_phone}</p>
                    </div>
                  </div>
                )}

                {order.contact_email && (
                  <div className="flex items-start">
                    <Mail size={20} className="mt-1 mr-3 flex-shrink-0" style={{ color: '#e57373' }} />
                    <div>
                      <p className="font-bold mb-1" style={{ color: '#a94442' }}>Contact Email</p>
                      <p className="font-medium" style={{ color: '#cd5c5c' }}>{order.contact_email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information */}
            <div 
              className="rounded-3xl p-6 shadow-lg"
              style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
            >
              <h2 className="text-xl font-bold mb-4" style={{ color: '#a94442' }}>Payment Information</h2>
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: '#a94442' }}>Payment Method</span>
                <span className="font-bold" style={{ color: '#e57373' }}>
                  {order.payment_method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button 
                className="w-full py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
              >
                <FileText size={20} className="mr-2" />
                Download Invoice
              </button>
              <button 
                className="w-full py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                style={{ background: 'rgba(255, 255, 255, 0.8)', color: '#a94442', border: '2px solid #f8b4b4' }}
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}