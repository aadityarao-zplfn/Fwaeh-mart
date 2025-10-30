const ProductCard = ({ product, onAddToCart, showActions = true }) => {
  return (
    <div className="card hover:shadow-lg transition-shadow duration-200">
      <div className="aspect-w-16 aspect-h-9 mb-4">
        <img
          src={product.image_url || 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=400'}
          alt={product.name}
          className="w-full h-48 object-cover rounded-lg"
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
        <p className="text-sm text-gray-600 line-clamp-2 h-10">
          {product.description || 'No description available'}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
            {product.category}
          </span>
          <span className="text-xs text-gray-500">
            Stock: {product.stock_quantity}
          </span>
        </div>
        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-bold text-primary-600">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          {showActions && (
            <button
              onClick={() => onAddToCart(product.id)}
              disabled={product.stock_quantity === 0}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
          )}
        </div>
        {product.profiles && (
          <p className="text-xs text-gray-500">
            Sold by: {product.profiles.full_name}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
