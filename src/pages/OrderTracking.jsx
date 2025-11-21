import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, Eye, ArrowLeft, MessageCircle, Star, Store } from 'lucide-react';
import { supabase } from '../lib/supabase'; 
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function OrderTrackingPage() {
  const [view, setView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({});
  const navigate = useNavigate();

  useEffect(() => { 
    fetchOrders(); 
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // ✅ Added scheduled_at and fulfillment_type to query
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

              // Fetch existing review for this order item
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
          // Only auto-update online shipping orders, not offline pickup orders
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

  // ✅ New Helper to re-open confirmation page
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

      // Update local state
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

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div></div>;

  // Detail View
  if (view === 'detail' && selectedOrder) {
    // Determine which status flow to show based on fulfillment type
    const isOffline = selectedOrder.fulfillment_type === 'offline_pickup';
    
    const statusFlow = isOffline 
        ? ['pending', 'delivered'] // Offline Flow: pending → delivered
        : ['pending', 'in_transit', 'delivered']; // Online Flow

    const currentStatusIndex = statusFlow.indexOf(selectedOrder.status);
    
    return (
      <div className="min-h-screen p-8" style={{ background: '#fff0f3' }}>
         <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
            <button onClick={() => setView('list')} className="flex items-center mb-6 text-pink-600 font-bold">
              <ArrowLeft className="mr-2"/> Back to Orders
            </button>
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
               <div>
                   <h1 className="text-3xl font-bold text-gray-800">Order #{selectedOrder.id.slice(0,8)}</h1>
                   {isOffline && (
                       <span className="inline-flex items-center mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                           <Store size={16} className="mr-1"/> Offline Pickup
                       </span>
                   )}
               </div>
               
               {/* Action Buttons */}
               <div className="flex gap-3">
                   {isOffline && selectedOrder.status === 'pending' && (
                       <button 
                         onClick={() => openPickupConfirmation(selectedOrder)}
                         className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-md"
                       >
                          <CheckCircle size={18}/> Confirm Pickup
                       </button>
                   )}
                   
                   <a 
                     href={`mailto:support@fwaehmart.com?subject=Query for Order ${selectedOrder.id}`} 
                     className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
                   >
                      <MessageCircle size={18}/> Support
                   </a>
               </div>
            </div>

            {/* Progress Tracker */}
            <div className="flex justify-between items-center mb-12 relative">
               <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
               {statusFlow.map((step, i) => {
                  const isActive = i <= currentStatusIndex;
                  const isCurrent = i === currentStatusIndex;
                  
                  // Map DB status to Display Label
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

            {/* Show Pickup Information for Offline Orders */}
            {isOffline && selectedOrder.scheduled_at && (
              <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <h4 className="font-bold text-blue-700 mb-2">Pickup Information</h4>
                <p className="text-blue-800">
                  Scheduled for: <span className="font-semibold">
                    {new Date(selectedOrder.scheduled_at).toLocaleString([], { 
                      dateStyle: 'medium', 
                      timeStyle: 'short' 
                    })}
                  </span>
                </p>
                <p className="text-blue-600 text-sm mt-1">
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
                     
                     {/* Review Section - Only show for delivered orders */}
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
                  </div>
               ))}
            </div>

            {/* Shipping Information - Only show for online orders */}
            {!isOffline && (
              <div className="mt-8 p-4 bg-blue-50 rounded-xl">
                <h4 className="font-bold text-gray-700 mb-2">Shipping Information</h4>
                <p className="text-gray-600">{selectedOrder.shipping_address}</p>
                {selectedOrder.contact_phone && (
                  <p className="text-gray-600">Phone: {selectedOrder.contact_phone}</p>
                )}
              </div>
            )}
         </div>
      </div>
    );
  }

  // List View
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
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded font-bold flex items-center">
                                  <Store size={12} className="mr-1"/> Pickup
                              </span>
                          )}
                      </div>
                      <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                      
                      {/* Dynamic Status Badge */}
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold capitalize 
                         ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                           order.status === 'pending' && isOffline ? 'bg-orange-100 text-orange-700' : 
                           order.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 
                           'bg-yellow-100 text-yellow-700'}`}>
                         {isOffline && order.status === 'pending' ? 'Waiting for Pickup' : 
                          order.status === 'in_transit' ? 'In Transit' : order.status}
                      </span>

                      {/* Show pickup time for offline orders */}
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
                       {/* ✅ The Button you asked for: Access Confirmation Page */}
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
                         className="px-4 py-2 border-2 border-gray-200 hover:border-pink-500 hover:text-pink-600 rounded-lg font-bold transition-all flex items-center gap-2 text-sm"
                       >
                          <Eye size={16} /> Details
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
        {/* Star Rating */}
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

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          className="w-full p-3 border border-gray-300 rounded-lg mb-3 resize-none"
          rows="3"
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-6 py-2 bg-pink-500 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-pink-600 transition-all"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};