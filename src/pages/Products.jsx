import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase'; // Accesses src/lib/supabase
import { useAuth } from '../contexts/AuthContext'; // Accesses src/contexts/AuthContext
import ProductCard from '../components/ProductCard'; // Accesses src/components/ProductCard
import ProductDetailModal from '../components/ProductDetailModal'; // Accesses src/components/ProductDetailModal
import NearbyShopsMap from '../components/NearbyShopsMap'; // Accesses src/components/NearbyShopsMap
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Star, MapPin, Package } from 'lucide-react';
import toast from 'react-hot-toast';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [showInStock, setShowInStock] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [maxDistance, setMaxDistance] = useState(50);
  const [sellerType, setSellerType] = useState('all');
  const [userLocation, setUserLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const { user } = useAuth();

  // Collapsible sections
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    stock: true,
    seller: true,
    rating: false,
    distance: false
  });

  // Fetch products once
  useEffect(() => {
    fetchProducts();
  }, []);

  // Get user's current location (same as existing logic)
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied:', error);
          // Fallback to Secunderabad
          setUserLocation({
            lat: 17.385,
            lng: 78.486
          });
        }
      );
    }
  }, []);

  const fetchProducts = async () => {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        profiles!seller_id(full_name, role, location_lat, location_lng, location_address)
      `)
      .eq('is_active', true)
      .or('is_public.is.true');

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;

    // Your filtering logic here
    const filteredData = data.filter(product => 
      product.profiles?.role === 'retailer' || product.is_public === true
    );

    setProducts(filteredData);
  } catch (error) {
    console.error('Error fetching products:', error);
    toast.error('Failed to load products');
  } finally {
    setLoading(false);
  }
};

  // Get categories from products
  const categories = useMemo(() => {
    return [...new Set(products.map(p => p.category))];
  }, [products]);

  // Get max price from products
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 1000;
    return Math.ceil(Math.max(...products.map(p => parseFloat(p.price || 0))));
  }, [products]);

  // Filter and sort products - MEMOIZED (Same as existing logic)
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) || 
        p.description?.toLowerCase().includes(search)
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Price filter
    filtered = filtered.filter(p => {
      const price = parseFloat(p.price || 0);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Stock filter
    if (showInStock) {
      filtered = filtered.filter(p => p.stock_quantity > 0);
    }

    // Rating filter (assuming product object has a rating field)
    if (minRating > 0) {
      filtered = filtered.filter((product) => (product.rating || 0) >= minRating);
    }

    // Seller type filter
    if (sellerType !== 'all') {
      filtered = filtered.filter((product) => product.profiles?.role === sellerType);
    }
    
    // Distance filter logic remains the same (assuming geospatial calculation is elsewhere if needed)


    // Sort
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => parseFloat(a.price || 0) - parseFloat(b.price || 0));
        break;
      case 'price-high':
        filtered.sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0));
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }, [products, searchTerm, categoryFilter, priceRange, showInStock, sortBy, minRating, sellerType]);

  const addToCart = async (productId) => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }

    try {
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingItem) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cart_items')
          .insert([{ user_id: user.id, product_id: productId, quantity: 1 }]);

        if (error) throw error;
      }

      toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSortBy('newest');
    setShowInStock(false);
    setMinRating(0);
    setMaxDistance(50);
    setSellerType('all');
    setPriceRange([0, maxPrice]);
  };

  // Get active filters count
  const activeFiltersCount = [
    categoryFilter !== 'all',
    showInStock,
    minRating > 0,
    sellerType !== 'all',
    priceRange[0] > 0 || priceRange[1] < maxPrice
  ].filter(Boolean).length;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const FilterSection = ({ title, section, children }) => (
    <div className="py-4" style={{ borderBottom: '2px solid #fca5a5' }}>
      <button
        onClick={() => toggleSection(section)}
        className="flex items-center justify-between w-full text-left mb-3"
      >
        <h3 className="font-bold text-sm" style={{ color: '#b91c1c' }}>{title}</h3>
        {expandedSections[section] ? (
          <ChevronUp size={18} style={{ color: '#ff5757' }} />
        ) : (
          <ChevronDown size={18} style={{ color: '#ff5757' }} />
        )}
      </button>
      {expandedSections[section] && <div>{children}</div>}
    </div>
  );

  const StarRating = ({ rating, onClick }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={20}
          className="cursor-pointer transition-all"
          style={{ 
            fill: star <= rating ? '#fbbf24' : 'transparent',
            color: star <= rating ? '#fbbf24' : '#fca5a5'
          }}
          onClick={() => onClick(star === rating ? 0 : star)}
        />
      ))}
    </div>
  );

  // Loading Skeleton (Same as existing logic)
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

  if (loading) {
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none" 
                size={20}
                style={{ color: '#ff5757' }}
              />
            </div>

            {/* Map View Toggle Button */}
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg"
              style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
            >
              <MapPin size={20} className="mr-2" />
              {showMap ? 'List View' : 'Map View'}
            </button>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white transition-all shadow-md hover:shadow-lg relative"
              style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
            >
              <SlidersHorizontal size={20} className="mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg" style={{ color: '#ff5757' }}>
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Enhanced Filter Panel */}
          {showFilters && (
            <div className="mt-6 pt-6 grid md:grid-cols-2 gap-6" style={{ borderTop: '2px solid #fca5a5' }}>
              <div>
                {/* Categories */}
                <FilterSection title="Category" section="category">
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
                </FilterSection>

                {/* Enhanced Price Range */}
                <FilterSection title="Price Range" section="price">
                  <div className="space-y-4">
                    <div className="flex gap-3 items-center">
                      <div className="flex-1">
                        <label className="block text-xs font-bold mb-1" style={{ color: '#dc2626' }}>Min Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-bold" style={{ color: '#ff5757' }}>$</span>
                          <input
                            type="number"
                            min="0"
                            max={priceRange[1]}
                            value={priceRange[0]}
                            onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                            className="w-full pl-8 pr-3 py-2 rounded-lg border-2 outline-none font-medium"
                            style={{ 
                              background: '#ffffff', 
                              borderColor: '#fca5a5',
                              color: '#b91c1c'
                            }}
                          />
                        </div>
                      </div>
                      <div className="pt-6 font-bold" style={{ color: '#ff5757' }}>—</div>
                      <div className="flex-1">
                        <label className="block text-xs font-bold mb-1" style={{ color: '#dc2626' }}>Max Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-bold" style={{ color: '#ff5757' }}>$</span>
                          <input
                            type="number"
                            min={priceRange[0]}
                            max={maxPrice}
                            value={priceRange[1]}
                            onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || maxPrice])}
                            className="w-full pl-8 pr-3 py-2 rounded-lg border-2 outline-none font-medium"
                            style={{ 
                              background: '#ffffff', 
                              borderColor: '#fca5a5',
                              color: '#b91c1c'
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-center text-sm font-bold" style={{ color: '#dc2626' }}>
                      ${priceRange[0]} - ${priceRange[1]}
                    </div>
                  </div>
                </FilterSection>

                {/* Stock Toggle */}
                <FilterSection title="Availability" section="stock">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package size={18} style={{ color: '#ff5757' }} />
                      <label className="text-sm font-bold" style={{ color: '#b91c1c' }}>
                        Show In Stock Only
                      </label>
                    </div>
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
                </FilterSection>
              </div>

              <div>
                {/* Seller Type */}
                <FilterSection title="Seller Type" section="seller">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSellerType('all')}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        sellerType === 'all' ? 'text-white shadow-lg' : ''
                      }`}
                      style={
                        sellerType === 'all'
                          ? { background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }
                          : { background: '#ffffff', color: '#b91c1c', border: '2px solid #fca5a5' }
                      }
                    >
                      All Sellers
                    </button>
                    <button
                      onClick={() => setSellerType('retailer')}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        sellerType === 'retailer' ? 'text-white shadow-lg' : ''
                      }`}
                      style={
                        sellerType === 'retailer'
                          ? { background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }
                          : { background: '#ffffff', color: '#b91c1c', border: '2px solid #fca5a5' }
                      }
                    >
                      Retailers
                    </button>
                    <button
                      onClick={() => setSellerType('wholesaler')}
                      className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
                        sellerType === 'wholesaler' ? 'text-white shadow-lg' : ''
                      }`}
                      style={
                        sellerType === 'wholesaler'
                          ? { background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }
                          : { background: '#ffffff', color: '#b91c1c', border: '2px solid #fca5a5' }
                      }
                    >
                      Wholesalers
                    </button>
                  </div>
                </FilterSection>

                {/* Rating Filter */}
                <FilterSection title="Minimum Rating" section="rating">
                  <div className="space-y-2">
                    <StarRating rating={minRating} onClick={setMinRating} />
                    {minRating > 0 && (
                      <p className="text-xs font-bold" style={{ color: '#dc2626' }}>
                        {minRating}+ stars and above
                      </p>
                    )}
                  </div>
                </FilterSection>

                {/* Distance Filter */}
                <FilterSection title="Distance" section="distance">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-bold" style={{ color: '#b91c1c' }}>
                      <MapPin size={18} style={{ color: '#ff5757' }} />
                      <span>Within {maxDistance} km</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={maxDistance}
                      onChange={(e) => setMaxDistance(parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #ff5757 0%, #ff8282 ${maxDistance}%, #fca5a5 ${maxDistance}%, #fca5a5 100%)`
                      }}
                    />
                  </div>
                </FilterSection>
              </div>

              {/* Clear Filters Button */}
              <div className="md:col-span-2 pt-4" style={{ borderTop: '2px solid #fca5a5' }}>
                <button
                  onClick={clearFilters}
                  className="w-full px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                  style={{ background: '#ffffff', color: '#ff5757', border: '2px solid #fca5a5' }}
                >
                  <X size={18} />
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Map View */}
        {showMap && (
          <div className="mb-6">
            <NearbyShopsMap 
              products={filteredProducts.filter(p => p.profiles?.location_lat)} 
              userLocation={userLocation}
            />
          </div>
        )}

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