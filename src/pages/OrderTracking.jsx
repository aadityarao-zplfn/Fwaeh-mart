// OrderTrackingPage.jsx - Updated version
import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Clock, Eye, ArrowLeft, MessageCircle, Star } from 'lucide-react';
import { supabase } from '../lib/supabase'; 
import toast from 'react-hot-toast';

export default function OrderTrackingPage() {
  const [view, setView] = useState('list');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState({}); // Store reviews by order_item_id

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

      // Check for auto-delivery updates
      const updatedOrders = await Promise.all(
        ordersWithDetails.map(async (order) => {
          if (order.status === 'in_transit' && order.shipped_at) {
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

  if (view === 'detail' && selectedOrder) {
    const statusFlow = ['pending', 'in_transit', 'delivered'];
    const currentStatusIndex = statusFlow.indexOf(selectedOrder.status);
    
    return (
      <div className="min-h-screen p-8" style={{ background: '#fff0f3' }}>
         <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
            <button onClick={() => setView('list')} className="flex items-center mb-6 text-pink-600 font-bold">
              <ArrowLeft className="mr-2"/> Back to Orders
            </button>
            
            <div className="flex justify-between items-center mb-8">
               <h1 className="text-3xl font-bold text-gray-800">Order #{selectedOrder.id.slice(0,8)}</h1>
               <a 
                 href={`mailto:support@fwaehmart.com?subject=Query for Order ${selectedOrder.id}`} 
                 className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all"
               >
                  <MessageCircle size={18}/> Send Query to Seller
               </a>
            </div>

            <div className="flex justify-between items-center mb-12 relative">
               <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10"></div>
               {statusFlow.map((step, i) => {
                  const isActive = i <= currentStatusIndex;
                  const isCurrent = i === currentStatusIndex;
                  
                  return (
                    <div key={step} className="flex flex-col items-center bg-white px-4 z-10">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 ${
                          isActive ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-300'
                        } ${isCurrent ? 'ring-4 ring-green-200' : ''}`}>
                           {step === 'pending' && <Clock size={20} />}
                           {step === 'in_transit' && <Truck size={20} />}
                           {step === 'delivered' && <CheckCircle size={20} />}
                        </div>
                        <span className={`mt-2 font-bold capitalize text-sm ${
                          isActive ? 'text-green-600' : 'text-gray-400'
                        }`}>
                           {step === 'in_transit' ? 'In Transit' : step}
                        </span>
                        {isCurrent && (
                          <span className="text-xs text-gray-500 mt-1">Current</span>
                        )}
                    </div>
                  );
               })}
            </div>

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
                     
                     {/* Review Section */}
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
                  </div>
               ))}
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-xl">
              <h4 className="font-bold text-gray-700 mb-2">Shipping Information</h4>
              <p className="text-gray-600">{selectedOrder.shipping_address}</p>
              {selectedOrder.contact_phone && (
                <p className="text-gray-600">Phone: {selectedOrder.contact_phone}</p>
              )}
            </div>
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
             ) : orders.map(order => (
                <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm flex justify-between items-center">
                   <div>
                      <h3 className="font-bold text-lg">Order #{order.id.slice(0,8)}</h3>
                      <p className="text-gray-500 text-sm">{new Date(order.created_at).toLocaleDateString()}</p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold capitalize 
                         ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                           order.status === 'in_transit' ? 'bg-blue-100 text-blue-700' : 
                           'bg-yellow-100 text-yellow-700'}`}>
                         {order.status === 'in_transit' ? 'In Transit' : order.status}
                      </span>
                   </div>
                   <button 
                     onClick={() => { setSelectedOrder(order); setView('detail'); }} 
                     className="px-6 py-3 bg-pink-500 text-white rounded-xl font-bold hover:bg-pink-600 transition-all flex items-center gap-2"
                   >
                      <Eye size={18} /> View Details & Track
                   </button>
                </div>
             ))}
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