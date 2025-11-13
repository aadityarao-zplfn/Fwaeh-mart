import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useProducts, useAddToCart } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import ProductDetailModal from '../components/ProductDetailModal';
import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { debounce } from '../utils/debounce';

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStock, setShowInStock] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { user } = useAuth();

  // Debounced search function
  const debouncedSearchUpdate = useCallback(
    debounce((value) => {
      setDebouncedSearch(value);
    }, 500),
    []
  );

  // Use React Query hooks with debounced search - SIMPLIFIED
  const { data: products = [], isLoading, error } = useProducts({
    search: debouncedSearch,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
  });

  const addToCartMutation = useAddToCart();

  // Set up real-time subscription for instant updates
  useEffect(() => {
    const productsSubscription = supabase
      .channel('products_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products',
        },
        (payload) => {
          console.log('Product changed:', payload);
        }
      )
      .subscribe();
      
    return () => {
      productsSubscription.unsubscribe();
    };
  }, []);

  // Extract categories only once when products first load
  useEffect(() => {
    if (products.length > 0 && categories.length === 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category))];
      setCategories(uniqueCategories);
    }
  }, [products, categories.length]);

  // Set price range only once when products first load
  useEffect(() => {
    if (products.length > 0 && priceRange[1] === 1000) {
      const maxPrice = Math.max(...products.map(p => parseFloat(p.price || 0)));
      if (maxPrice > 0) {
        setPriceRange([0, Math.ceil(maxPrice)]);
      }
    }
  }, [products, priceRange[1]]);

  // Filter and sort products - SIMPLIFIED to avoid state updates
  const filteredProducts = useCallback(() => {
    let filtered = [...products];

    // Stock filter
    if (showInStock) {
      filtered = filtered.filter((product) => product.stock_quantity > 0);
    }

    // Sort
    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
      case 'price-high':
        return filtered.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
      case 'name':
        return filtered.sort((a, b) => a.name.localeCompare(b.name));
      case 'newest':
      default:
        return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
  }, [products, showInStock, sortBy])();

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearchUpdate(value);
  };

  const addToCart = async (productId) => {
    if (!user) {
      alert('Please login to add items to cart');
      return;
    }

    addToCartMutation.mutate({
      userId: user.id,
      productId,
      quantity: 1,
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setCategoryFilter('all');
    setSortBy('newest');
    setShowInStock(false);
    if (products.length > 0) {
      const maxPrice = Math.max(...products.map(p => parseFloat(p.price || 0)));
      setPriceRange([0, Math.ceil(maxPrice)]);
    } else {
      setPriceRange([0, 1000]);
    }
  };

  // Loading Skeleton
  const SkeletonCard = () => (
    <div className="rounded-2xl overflow-hidden shadow-lg animate-pulse" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
      <div className="w-full h-48 bg-gradient-to-br from-red-100 to-red-200"></div>
      <div className="p-5 space-y-3">
        <div className="h-6 bg-red-200 rounded w-3/4"></div>
        <div className="h-4 bg-red-200 rounded w-full"></div>
        <div className="h-4 bg-red-200 rounded w-5/6"></div>
        <div className="flex justify-between items-center pt-2">
          <div className="h-8 bg-red-200 rounded w-24"></div>
          <div className="h-10 bg-red-200 rounded w-32"></div>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, #ffe8e8 0%, #fff0f0 50%, #ffe8e8 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, #ffe8e8 0%, #fff0f0 50%, #ffe8e8 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-16 rounded-2xl shadow-lg" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#b91c1c' }}>
              Error loading products
            </h3>
            <p style={{ color: '#dc2626' }}>{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, #ffe8e8 0%, #fff0f0 50%, #ffe8e8 100%)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#b91c1c' }}>
            Browse Products
          </h1>
          <p style={{ color: '#dc2626' }}>Discover amazing deals from local sellers</p>
        </div>

        {/* Search and Filter Bar */}
        <div className="rounded-2xl shadow-lg p-4 mb-6" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search 
                className="absolute left-4 top-1/2 transform -translate-y-1/2" 
                size={20} 
                style={{ color: '#ff5757' }}
              />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-12 pr-4 py-3 rounded-xl border-2 outline-none transition-all"
                style={{ 
                  background: '#ffffff', 
                  borderColor: '#fca5a5',
                  color: '#b91c1c'
                }}
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                className="appearance-none px-6 pr-10 py-3 rounded-xl border-2 outline-none font-medium transition-all cursor-pointer"
                style={{ 
                  background: '#ffffff', 
                  borderColor: '#fca5a5',
                  color: '#b91c1c'
                }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
              <ChevronDown 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" 
                size={20}
                style={{ color: '#ff5757' }}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
            >
              <SlidersHorizontal size={20} className="mr-2" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 space-y-6" style={{ borderTop: '2px solid #fca5a5' }}>
              {/* Categories */}
              <div>
                <label className="block text-sm font-bold mb-3" style={{ color: '#b91c1c' }}>
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCategoryFilter('all')}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                      categoryFilter === 'all' ? 'text-white shadow-lg' : ''
                    }`}
                    style={
                      categoryFilter === 'all'
                        ? { background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }
                        : { background: '#ffffff', color: '#b91c1c', border: '2px solid #fca5a5' }
                    }
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setCategoryFilter(category)}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        categoryFilter === category ? 'text-white shadow-lg' : ''
                      }`}
                      style={
                        categoryFilter === category
                          ? { background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }
                          : { background: '#ffffff', color: '#b91c1c', border: '2px solid #fca5a5' }
                      }
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-bold mb-3" style={{ color: '#b91c1c' }}>
                  Price Range: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <input
                  type="range"
                  min="0"
                  max={Math.max(...products.map(p => parseFloat(p.price || 0)), 1000)}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #ff5757 0%, #ff8282 ${(priceRange[1] / Math.max(...products.map(p => parseFloat(p.price || 0)), 1000)) * 100}%, #fca5a5 ${(priceRange[1] / Math.max(...products.map(p => parseFloat(p.price || 0)), 1000)) * 100}%, #fca5a5 100%)`
                  }}
                />
              </div>

              {/* Stock Toggle */}
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold" style={{ color: '#b91c1c' }}>
                  Show In Stock Only
                </label>
                <button
                  onClick={() => setShowInStock(!showInStock)}
                  className={`relative w-14 h-7 rounded-full transition-all ${
                    showInStock ? 'shadow-lg' : ''
                  }`}
                  style={{ 
                    background: showInStock 
                      ? 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' 
                      : '#fca5a5'
                  }}
                >
                  <span
                    className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                      showInStock ? 'translate-x-7' : ''
                    }`}
                  ></span>
                </button>
              </div>

              <button
                onClick={clearFilters}
                className="text-sm font-bold flex items-center transition-all"
                style={{ color: '#ff5757' }}
              >
                <X size={16} className="mr-1" />
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="font-medium" style={{ color: '#b91c1c' }}>
            Showing <span className="font-bold">{filteredProducts.length}</span> products
          </p>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl shadow-lg" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#b91c1c' }}>
              No products found
            </h3>
            <p className="mb-6" style={{ color: '#dc2626' }}>
              Try adjusting your filters or search terms
            </p>
            <button 
              onClick={clearFilters}
              className="px-6 py-3 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all"
              style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
            {filteredProducts.map((product) => (
              <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className="cursor-pointer"
              >
                <ProductCard
                  product={product}
                  onAddToCart={addToCart}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={addToCart}
        />
      )}
    </div>
  );
};

export default Products;