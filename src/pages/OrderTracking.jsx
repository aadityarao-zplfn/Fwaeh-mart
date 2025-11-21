import { useState, useEffect } from 'react';
import { Package, Truck, X, CheckCircle, Clock, Eye, ArrowLeft, MessageCircle, Star, Store } from 'lucide-react';
import { supabase } from '../lib/supabase'; 
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OrderTrackingPage() {
  const [view, setView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [querySubject, setQuerySubject] = useState('');
  const [queryMessage, setQueryMessage] = useState('');
  const [submittingQuery, setSubmittingQuery] = useState(false);
  const navigate = useNavigate();

  // Add this inside your OrderTrackingPage component
useEffect(() => {
  // 1. Subscribe to ALL changes in the 'orders' table
  const subscription = supabase
    .channel('public:orders')
    .on(
      'postgres_changes',
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'orders',
        // Optional: Filter for current user's orders only if you have the user ID handy
        // filter: `user_id=eq.${user?.id}` 
      },
      (payload) => {
        console.log('🔴 Real-time update received:', payload);
        
        // 2. When a change happens, update the local state automatically
        setOrders(currentOrders => 
          currentOrders.map(order => 
            order.id === payload.new.id 
              ? { ...order, ...payload.new } 
              : order
          )
        );
        
        // Also update the selected order view if open
        if (selectedOrder && selectedOrder.id === payload.new.id) {
           setSelectedOrder(prev => ({ ...prev, ...payload.new }));
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [selectedOrder]); // Dependency array

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order) => {
          const { data: items, error: itemsError } = await supabase
            .from('order_items')
            .select('*')
            .eq('order_id', order.id);

          if (itemsError) {
            console.error('Error fetching order items:', itemsError);
            return { ...order, order_items: [] };
          }

          const itemsWithProducts = await Promise.all(
            (items || []).map(async (item) => {
              const { data: product, error: productError } = await supabase
                .from('products')
                .select('name, image_url')
                .eq('id', item.product_id)
                .single();

              const { data: review } = await supabase
                .from('product_reviews')
                .select('*')
                .eq('order_item_id', item.id)
                .single();

              return {
                ...item,
                products: product || { name: 'Product', image_url: '' },
                review: review || null
              };
            })
          );

          return {
            ...order,
            order_items: itemsWithProducts
          };
        })
      );

      // Check for auto-delivery updates (only for online orders)
      const updatedOrders = await Promise.all(
        ordersWithDetails.map(async (order) => {
          if (order.fulfillment_type !== 'offline_pickup' && order.status === 'in_transit' && order.shipped_at) {
            const timeSinceShipped = Date.now() - new Date(order.shipped_at).getTime();
            if (timeSinceShipped > 180000) {
              try {
                const { error: updateError } = await supabase
                  .from('orders')
                  .update({ status: 'delivered' })
                  .eq('id', order.id);
                
                if (!updateError) {
                  return { ...order, status: 'delivered' };
                }
              } catch (updateError) {
                console.error('Error updating delivery status:', updateError);
              }
            }
          }
          return order;
        })
      );

      setOrders(updatedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const openPickupConfirmation = (order) => {
    navigate('/pickup-success', { 
      state: { 
        order: order, 
        pickupTime: order.scheduled_at 
      } 
    });
  };

  const submitReview = async (orderItemId, productId, rating, comment) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to submit review');
        return;
      }

      const { data, error } = await supabase
        .from('product_reviews')
        .upsert({
          user_id: user.id,
          product_id: productId,
          order_id: selectedOrder.id,
          order_item_id: orderItemId,
          rating: rating,
          comment: comment,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setSelectedOrder(prev => ({
        ...prev,
        order_items: prev.order_items.map(item => 
          item.id === orderItemId 
            ? { ...item, review: data }
            : item
        )
      }));

      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  const submitQuery = async (e) => {
    e.preventDefault();
    if (!querySubject.trim() || !queryMessage.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmittingQuery(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login to submit query');
        return;
      }

      let retailerId = user.id;
      let productId = selectedOrder.order_items[0]?.product_id;

      if (productId) {
        try {
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('*')
            .eq('id', productId)
            .single();

          if (product && product.seller_id) {
            retailerId = product.seller_id;
          }
        } catch (productErr) {
          console.log('Product fetch failed:', productErr);
        }
      }

      const { data, error } = await supabase
        .from('customer_queries')
        .insert({
          order_id: selectedOrder.id,
          user_id: user.id,
          retailer_id: retailerId,
          product_id: productId,
          subject: querySubject,
          message: queryMessage,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Query submitted successfully!');
      setShowQueryModal(false);
      setQuerySubject('');
      setQueryMessage('');
    } catch (error) {
      console.error('Error submitting query:', error);
      toast.error('Failed to submit query: ' + error.message);
    } finally {
      setSubmittingQuery(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-rose-500 border-t-transparent"></div></div>;

  if (view === 'detail' && selectedOrder) {
    const isOffline = selectedOrder.fulfillment_type === 'offline_pickup';
    const statusFlow = isOffline 
      ? ['pending', 'delivered']
      : ['pending', 'in_transit', 'delivered'];
    const currentStatusIndex = statusFlow.indexOf(selectedOrder.status);
    
    return (
      <div className="min-h-screen p-8" style={{ background: '#fff0f3' }}>
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
          <button onClick={() => setView('list')} className="flex items-center mb-6 text-rose-600 font-bold">
            <ArrowLeft className="mr-2"/> Back to Orders
          </button>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Order #{selectedOrder.id.slice(0,8)}</h1>
              {isOffline && (
                <span className="inline-flex items-center mt-2 px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-sm font-bold">
                  <Store size={16} className="mr-1"/> Offline Pickup
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              {isOffline && selectedOrder.status === 'pending' && (
                <button 
                  onClick={() => openPickupConfirmation(selectedOrder)}
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md"
                >
                  <CheckCircle size={18}/> Confirm Pickup
                </button>
              )}
              
              <button 
                onClick={() => setShowQueryModal(true)}
                className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
              >
                <MessageCircle size={18}/> Send Query to Seller
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
            {statusFlow.map((step, i) => {
              const isActive = i <= currentStatusIndex;
              const isCurrent = i === currentStatusIndex;
              
              let label = step;
              if(isOffline) {
                if(step === 'pending') label = 'Scheduled';
                if(step === 'delivered') label = 'Picked Up';
              } else {
                if(step === 'in_transit') label = 'In Transit';
              }

              return (
                <div key={step} className="flex flex-col items-center bg-white px-4 z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                    isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-300'
                  } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}>
                    {step.includes('pending') && <Clock size={20} />}
                    {step === 'in_transit' && <Truck size={20} />}
                    {step === 'delivered' && <CheckCircle size={20} />}
                  </div>
                  <span className={`mt-2 font-bold capitalize text-sm ${
                    isActive ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-gray-500 mt-1">Current</span>
                  )}
                </div>
              );
            })}
          </div>

          {isOffline && selectedOrder.scheduled_at && (
            <div className="mb-6 p-4 bg-rose-50 rounded-xl border border-rose-100">
              <h4 className="font-bold text-rose-700 mb-2">Pickup Information</h4>
              <p className="text-rose-800">
                Scheduled for: <span className="font-semibold">
                  {new Date(selectedOrder.scheduled_at).toLocaleString([], { 
                    dateStyle: 'medium', 
                    timeStyle: 'short' 
                  })}
                </span>
              </p>
              <p className="text-rose-600 text-sm mt-1">
                Location: Fwaeh Mart Store, Secunderabad
              </p>
            </div>
          )}

          <div className="space-y-6">
            <h3 className="font-bold text-gray-700 text-lg">Order Items</h3>
            {selectedOrder.order_items?.map(item => (
              <div key={item.id} className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={item.products?.image_url || '/placeholder.svg'} 
                    className="w-16 h-16 rounded-lg object-cover"
                    alt={item.products?.name}
                  />
                  <div>
                    <p className="font-bold">{item.products?.name || 'Product'}</p>
                    <p className="text-gray-500">Qty: {item.quantity} • ₹{item.price_at_purchase}</p>
                  </div>
                </div>
                
                {selectedOrder.status === 'delivered' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {item.review ? (
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-green-800">Your Review:</span>
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= item.review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-green-700">{item.review.comment}</p>
                      </div>
                    ) : (
                      <ReviewForm 
                        orderItemId={item.id}
                        productId={item.product_id}
                        productName={item.products?.name}
                        onSubmit={submitReview}
                      />
                    )}
                  </div>
                )}

                <QueryResponses 
                  orderId={selectedOrder.id} 
                  productId={item.product_id}
                />
              </div>
            ))}
          </div>

          {!isOffline && (
            <div className="mt-8 p-4 bg-rose-50 rounded-xl">
              <h4 className="font-bold text-gray-700 mb-2">Shipping Information</h4>
              <p className="text-gray-600">{selectedOrder.shipping_address}</p>
              {selectedOrder.contact_phone && (
                <p className="text-gray-600">Phone: {selectedOrder.contact_phone}</p>
              )}
            </div>
          )}

          {showQueryModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Send Query to Seller</h3>
                  <button 
                    onClick={() => setShowQueryModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>
                
                <form onSubmit={submitQuery}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={querySubject}
                      onChange={(e) => setQuerySubject(e.target.value)}
                      placeholder="What is your query about?"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={queryMessage}
                      onChange={(e) => setQueryMessage(e.target.value)}
                      placeholder="Describe your query in detail..."
                      rows="4"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowQueryModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingQuery}
                      className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {submittingQuery ? 'Submitting...' : 'Send Query'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8" style={{ background: '#fff0f3' }}>
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>
        <div className="space-y-6">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <Package size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-bold text-gray-800">No Orders Yet</h3>
              <p className="text-gray-500">Your orders will appear here</p>
            </div>
          ) : orders.map(order => {
            const isOffline = order.fulfillment_type === 'offline_pickup';
            
            return (
              <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg">Order #{order.id.slice(0,8)}</h3>
                    {isOffline && (
                      <span className="text-xs bg-rose-100 text-rose-700 px-2 py-1 rounded font-bold flex items-center">
                        <Store size={12} className="mr-1"/> Pickup
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                  
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold capitalize 
                    ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                      order.status === 'pending' && isOffline ? 'bg-orange-100 text-orange-700' : 
                      order.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 
                      'bg-yellow-100 text-yellow-700'}`}>
                    {isOffline && order.status === 'pending' ? 'Waiting for Pickup' : 
                      order.status === 'in_transit' ? 'In Transit' : order.status}
                  </span>

                  {isOffline && order.scheduled_at && order.status === 'pending' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Pickup: {new Date(order.scheduled_at).toLocaleString([], { 
                        dateStyle: 'short', 
                        timeStyle: 'short' 
                      })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {isOffline && order.status === 'pending' && (
                    <button 
                      onClick={() => openPickupConfirmation(order)}
                      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold transition-all flex items-center gap-2 text-sm shadow-sm"
                    >
                      <CheckCircle size={16} /> Confirm Pickup
                    </button>
                  )}

                  <button 
                    onClick={() => { setSelectedOrder(order); setView('detail'); }} 
                    className="px-6 py-3 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 transition-all flex items-center gap-2"
                  >
                    <Eye size={18} /> View Details & Track
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Keep the ReviewForm and QueryResponses components exactly as you had them
// Review Form Component
const ReviewForm = ({ orderItemId, productId, productName, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    await onSubmit(orderItemId, productId, rating, comment);
    setIsSubmitting(false);
    setRating(0);
    setComment('');
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200">
      <h4 className="font-bold text-gray-700 mb-3">Rate {productName}</h4>
      <form onSubmit={handleSubmit}>
        <div className="flex gap-1 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={28}
                className={
                  star <= (hoverRating || rating) 
                    ? "text-yellow-400 fill-yellow-400" 
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="w-full p-3 border border-gray-300 rounded-lg mb-3 resize-none"
          rows="3"
        />

        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-6 py-2 bg-rose-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-600 transition-all"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};

// Query Responses Component
const QueryResponses = ({ orderId, productId }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponses();
  }, [orderId, productId]);

  const fetchResponses = async () => {
    try {
      const { data: queries, error: queriesError } = await supabase
        .from('customer_queries')
        .select('id, product_id')
        .eq('order_id', orderId);

      if (queries && queries.length > 0) {
        const queryIds = queries.map(q => q.id);
        const { data: responseData, error: responseError } = await supabase
          .from('query_responses')
          .select('*')
          .in('query_id', queryIds)
          .order('created_at', { ascending: true });

        setResponses(responseData || []);
      } else {
        setResponses([]);
      }
    } catch (error) {
      console.error('🚨 Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading responses...</div>;
  }

  if (responses.length === 0) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <h4 className="font-bold text-yellow-800 mb-2 flex items-center gap-2">
          <MessageCircle size={16} />
          No Seller Responses Yet
        </h4>
        <p className="text-yellow-700 text-sm">The seller hasn't responded to your queries yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
      <h4 className="font-bold text-rose-800 mb-3 flex items-center gap-2">
        <MessageCircle size={16} />
        Seller Responses ({responses.length})
      </h4>
      <div className="space-y-3">
        {responses.map((response) => (
          <div key={response.id} className="bg-white rounded-lg p-3 border border-rose-200">
            <div className="flex justify-between items-start mb-2">
              <span className="font-medium text-rose-700">Seller</span>
              <span className="text-xs text-gray-500">
                {new Date(response.created_at).toLocaleString()}
              </span>
            </div>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              {response.message}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};