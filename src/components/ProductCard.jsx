import { ShoppingCart, Store, MapPin } from "lucide-react"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { calculateDistance, formatDistance } from "../utils/location"

const ProductCard = ({ product, onAddToCart, userLocation }) => {
  const [isLoading, setIsLoading] = useState(false)
  const { profile } = useAuth()

  const handleAddToCart = async (e) => {
    e.stopPropagation(); // Prevent clicking card when clicking button
    if (!product || product.stock_quantity === 0) return;
    
    setIsLoading(true)
    try {
      if (onAddToCart) {
        await onAddToCart(product.id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!product) return null

  // Calculate distance if locations are available
  const sellerData = product.seller || product.profiles;
  
  const distance = (userLocation && sellerData?.location_lat && sellerData?.location_lng)
    ? calculateDistance(
        userLocation.lat, 
        userLocation.lng, 
        sellerData.location_lat, 
        sellerData.location_lng
      )
    : null;

  const isRetailerOrWholesaler = profile?.role === 'retailer' || profile?.role === 'wholesaler'

  return (
    <div className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border-2" style={{ borderColor: '#E8B4B8' }}>
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden" style={{ background: 'linear-gradient(135deg, #FDD9D7 0%, #F5C9C6 100%)' }}>
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />

        {/* Distance Badge */}
        {distance !== null && (
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-lg text-xs font-bold shadow-md flex items-center gap-1">
            <MapPin size={12} className="text-red-500" />
            {formatDistance(distance)}
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-bold shadow-md border-2" style={{ color: '#8B4343', borderColor: '#E8B4B8' }}>
            {product.category}
          </span>
        </div>

        {/* Out of Stock Overlay */}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center backdrop-blur-sm">
            <span className="text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg" style={{ backgroundColor: '#E88B8B' }}>
              Out of Stock
            </span>
          </div>
        )}
        
        {product.stock_quantity > 0 && product.stock_quantity <= 5 && (
          <div className="absolute top-3 right-3 text-white px-4 py-2 rounded-full text-xs font-bold shadow-lg animate-pulse" style={{ backgroundColor: '#E88B8B' }}>
            Only {product.stock_quantity} left!
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold line-clamp-2 min-h-[3.5rem] transition-colors" style={{ color: '#8B4343' }}>
          {product.name}
        </h3>
        
        <p className="text-sm text-gray-600 line-clamp-2 min-h-[2.5rem]">
          {product.description || "No description available"}
        </p>

        <div className="flex items-end justify-between pt-3 border-t-2" style={{ borderColor: '#E8B4B8' }}>
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <span className="text-3xl font-bold" style={{ color: '#E88B8B' }}>
              ₹{Number.parseFloat(product.price).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Seller Info */}
        {sellerData && (
          <div className="flex items-center pt-3 border-t-2" style={{ borderColor: '#E8B4B8' }}>
             <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md mr-3" style={{ backgroundColor: '#E88B8B' }}>
              {sellerData.full_name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <p className="text-xs text-gray-500 flex items-center">
                <Store size={12} className="mr-1" style={{ color: '#E88B8B' }} />
                Sold by
              </p>
              <p className="text-sm font-semibold text-gray-700">{sellerData.full_name || 'Unknown Seller'}</p>
            </div>
          </div>
        )}

        {/* Add to Cart Button */}
        {!isRetailerOrWholesaler && (
          <button
            onClick={handleAddToCart}
            disabled={product.stock_quantity === 0 || isLoading}
            className={`w-full py-3 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center space-x-2 shadow-md ${
              product.stock_quantity === 0 || isLoading
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "active:scale-95 hover:shadow-lg"
            }`}
            style={product.stock_quantity === 0 || isLoading ? {} : { backgroundColor: '#E88B8B' }}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></div>
            ) : product.stock_quantity === 0 ? (
              <span>Out of Stock</span>
            ) : (
              <>
                <ShoppingCart size={20} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

export default ProductCard