import { useState, useEffect } from 'react';
import { X, Minus, Plus, ShoppingCart, Store, Clock, Calendar, HelpCircle, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ProductDetailModal = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [productReviews, setProductReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const { profile: userProfile } = useAuth();

  // Fetch reviews for this product
  // Fetch reviews for this product
  useEffect(() => {
    const fetchProductReviews = async () => {
      if (!product?.id) {
        console.log('❌ No product ID');
        return;
      }
      
      console.log('🔄 Fetching reviews for product:', product.id, product.name);
      
      try {
        // First, let's try without the user join to see if that's the issue
        const { data, error } = await supabase
          .from('product_reviews')
          .select('*')
          .eq('product_id', product.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('❌ Error fetching reviews:', error);
          throw error;
        }

        console.log('✅ Reviews fetched:', data);
        setProductReviews(data || []);
        
        // Calculate average rating
        if (data && data.length > 0) {
          const avg = data.reduce((sum, review) => sum + review.rating, 0) / data.length;
          console.log('📊 Average rating calculated:', avg);
          setAverageRating(avg);
        } else {
          console.log('📊 No reviews, setting average to 0');
          setAverageRating(0);
        }
      } catch (error) {
        console.error('❌ Error in fetchProductReviews:', error);
      }
    };

    fetchProductReviews();
  }, [product]);

  const StarRatingDisplay = ({ rating, size = 16 }) => {
    console.log('⭐ Rendering stars with rating:', rating);
    return (
      <div className="flex items-center gap-1">
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={size}
              className={
                star <= Math.round(rating) 
                  ? "text-yellow-400 fill-yellow-400" 
                  : "text-gray-300"
              }
            />
          ))}
        </div>
        <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const getSellerProfile = () => {
    if (!product) return null;
    const data = product.profiles || product.seller;
    return Array.isArray(data) ? data[0] : data;
  };

  const seller = getSellerProfile();

  // In ProductDetailModal.jsx - Replace the handleAddToCart function with this:

const handleAddToCart = async () => {
  if (!product || product.stock_quantity === 0) return;
  
  setIsLoading(true);
  try {
    const toastId = toast.loading(`Adding ${quantity} item(s) to cart...`);
    
    // Pass the quantity to onAddToCart
    if (onAddToCart) {
      await onAddToCart(product.id, quantity);
    }
    
    toast.success(`Added ${quantity} item(s) to cart! 🛒`, { id: toastId });
    onClose();
  } catch (error) {
    console.error('Error adding to cart:', error);
    toast.error('Failed to add to cart');
  } finally {
    setIsLoading(false);
  }
};

  const incrementQuantity = () => {
    if (quantity < product.stock_quantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const productImages = product?.image_url ? [product.image_url] : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop'];

  if (!product) return null;

  const isRetailerOrWholesaler = userProfile?.role === 'retailer' || userProfile?.role === 'wholesaler';
  
  const restockText = product.restock_days === -1 
    ? "Availability Uncertain" 
    : `Restocking in ${product.restock_days} days`;

  console.log('🎯 Final render state - Reviews:', productReviews, 'Avg Rating:', averageRating);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      ></div>

      <div 
        className="fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] shadow-2xl z-50 overflow-y-auto transform transition-transform duration-300"
        style={{ background: 'linear-gradient(to bottom, #ffe8e8, #fff0f0)' }}
      >
        <div 
          className="sticky top-0 z-10 px-6 py-4 flex justify-between items-center shadow-md"
          style={{ background: '#fff5f5', borderBottom: '2px solid #fca5a5' }}
        >
          <h2 className="text-2xl font-bold" style={{ color: '#b91c1c' }}>
            Product Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-all hover:shadow-lg"
            style={{ background: '#ffffff', border: '2px solid #fca5a5' }}
          >
            <X size={24} style={{ color: '#ff5757' }} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div 
              className="aspect-square rounded-2xl overflow-hidden shadow-lg border-2"
              style={{ borderColor: '#fca5a5' }}
            >
              <img
                src={productImages[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>

            {productImages.length > 1 && (
              <div className="flex gap-3">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-1 aspect-square rounded-xl overflow-hidden transition-all ${
                      selectedImage === index ? 'shadow-lg scale-105' : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{ 
                      border: selectedImage === index ? '3px solid #ff5757' : '2px solid #fca5a5'
                    }}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div 
            className="rounded-2xl p-6 shadow-lg space-y-4 border-2"
            style={{ background: '#fff5f5', borderColor: '#fca5a5' }}
          >
            <div>
              <span 
                className="inline-block px-4 py-2 rounded-full text-xs font-bold border-2"
                style={{ background: '#ffffff', color: '#b91c1c', borderColor: '#fca5a5' }}
              >
                {product.category}
              </span>
            </div>

            <div>
              <h1 className="text-3xl font-bold mb-3" style={{ color: '#b91c1c' }}>
                {product.name}
              </h1>
              <p className="text-4xl font-bold" style={{ color: '#ff5757' }}>
                ₹{parseFloat(product.price || 0).toFixed(2)}
              </p>
            </div>

            <div className="pt-4 border-t-2" style={{ borderColor: '#fca5a5' }}>
              <h3 className="font-bold mb-2" style={{ color: '#b91c1c' }}>Description</h3>
              <p className="leading-relaxed" style={{ color: '#dc2626' }}>
                {product.description || 'No description available for this product.'}
              </p>
            </div>

            <div 
              className="rounded-xl p-4 border-2"
              style={{ background: '#ffffff', borderColor: '#fca5a5' }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold" style={{ color: '#b91c1c' }}>Availability:</span>
                {product.stock_quantity > 0 ? (
                  <span className="font-bold" style={{ color: '#22c55e' }}>
                    {product.stock_quantity} units in stock
                  </span>
                ) : (
                  <div className="text-right">
                    <span className="block font-bold text-red-500">Out of Stock</span>
                    
                    {product.restock_days && (
                      <span className="flex items-center justify-end gap-1 text-sm font-bold text-orange-600 mt-1">
                        {product.restock_days === -1 ? <HelpCircle size={14} /> : <Clock size={14} />}
                        {restockText}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {!isRetailerOrWholesaler && product.stock_quantity > 0 && (
              <div className="pt-4 border-t-2" style={{ borderColor: '#fca5a5' }}>
                <label className="block font-bold mb-3" style={{ color: '#b91c1c' }}>
                  Quantity
                </label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="w-12 h-12 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2"
                    style={{ background: '#ffffff', color: '#ff5757', borderColor: '#fca5a5' }}
                  >
                    <Minus size={20} className="mx-auto" />
                  </button>
                  <span className="text-3xl font-bold w-16 text-center" style={{ color: '#b91c1c' }}>
                    {quantity}
                  </span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock_quantity}
                    className="w-12 h-12 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2"
                    style={{ background: '#ffffff', color: '#ff5757', borderColor: '#fca5a5' }}
                  >
                    <Plus size={20} className="mx-auto" />
                  </button>
                </div>
                <p className="text-sm mt-3 font-medium" style={{ color: '#dc2626' }}>
                  Total: <span className="text-xl font-bold" style={{ color: '#ff5757' }}>
                    ₹{(parseFloat(product.price || 0) * quantity).toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            {!isRetailerOrWholesaler && (
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity === 0 || isLoading}
                className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all flex items-center justify-center shadow-lg hover:shadow-xl ${
                  product.stock_quantity === 0 || isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent mr-2"></div>
                    Adding...
                  </>
                ) : product.stock_quantity === 0 ? (
                  product.restock_days ? (
                    <span className="flex items-center">
                      {product.restock_days === -1 ? (
                          <> <HelpCircle className="mr-2" /> Check Back Later </>
                      ) : (
                          <> <Calendar className="mr-2" /> Available in {product.restock_days} Days </>
                      )}
                    </span>
                  ) : 'Out of Stock'
                ) : (
                  <>
                    <ShoppingCart size={24} className="mr-2" />
                    Add {quantity} to Cart
                  </>
                )}
              </button>
            )}
          </div>

          {/* Reviews Section */}
          <div 
            className="rounded-2xl p-6 shadow-lg border-2"
            style={{ background: '#fff5f5', borderColor: '#fca5a5' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{ color: '#b91c1c' }}>Customer Reviews</h3>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <StarRatingDisplay rating={averageRating} size={20} />
                  <span className="font-bold" style={{ color: '#b91c1c' }}>
                    ({productReviews.length} reviews)
                  </span>
                </div>
              </div>
            </div>

                  {productReviews.length === 0 ? (
            <p className="text-center py-4" style={{ color: '#dc2626' }}>
              No reviews yet. Be the first to review!
            </p>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {productReviews.map((review) => (
                <div key={review.id} className="pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold" style={{ color: '#b91c1c' }}>
                      Customer
                    </span>
                    <StarRatingDisplay rating={review.rating} size={16} />
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
          </div>

          {/* Seller Information Card */}
          <div 
            className="rounded-2xl p-6 shadow-lg border-2"
            style={{ background: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)', borderColor: '#fca5a5' }}
          >
            <div className="flex items-center mb-3">
              <Store size={24} style={{ color: '#ff5757' }} className="mr-2" />
              <h3 className="text-xl font-bold" style={{ color: '#b91c1c' }}>
                Seller Information
              </h3>
            </div>
            
            <div className="flex items-center space-x-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
              >
                {seller?.full_name?.charAt(0).toUpperCase() || 'S'}
              </div>
              <div className="flex-1">
                <p className="text-xl font-bold mb-1" style={{ color: '#b91c1c' }}>
                  {seller?.full_name || 'Unknown Seller'}
                </p>
                <div className="text-sm" style={{ color: '#dc2626' }}>
                  <span className="font-medium">
                    {seller?.role === 'retailer' ? '🏪 Verified Retailer' : 
                     seller?.role === 'wholesaler' ? '🏭 Verified Wholesaler' : '👤 Customer Seller'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductDetailModal;