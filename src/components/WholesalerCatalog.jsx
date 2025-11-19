import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Package, Plus, Search, Store } from 'lucide-react';
import toast from 'react-hot-toast';

const WholesalerCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user, profile } = useAuth(); 
  const RETAILER_MARKUP = 1.15; // 15% markup as per your flow

  useEffect(() => {
    // Only attempt to fetch data if the profile has loaded and the role is retailer
    if (profile && profile.role === 'retailer') {
      fetchWholesalerProducts();
    } else if (profile) {
      setLoading(false); // Stop loading if profile is loaded but role is wrong
    }
  }, [profile]);

  // Security Guard: Prevents non-retailers from seeing the catalog list
  if (!profile || profile.role !== 'retailer') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-red-50 rounded-xl border-2 border-red-200">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-red-800 mb-2">Access Restricted</h2>
        <p className="text-red-600">
          The Wholesaler Catalog is exclusively available for Retailer accounts.
        </p>
      </div>
    );
  }

  const fetchWholesalerProducts = async () => {
    try {
      // Fetch only active products where the seller is a 'wholesaler' 
      // AND the product is NOT public (is_public = false)
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles!seller_id(role, full_name)')
        .eq('profiles.role', 'wholesaler')
        .eq('is_public', false) // CRITICAL: Only show hidden catalog items
        .eq('is_active', true);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching catalog:', error);
      toast.error('Failed to load wholesaler products');
    } finally {
      setLoading(false);
    }
  };

  const importProduct = async (product) => {
    if (!confirm(`Import "${product.name}" to your store? This will set your selling price to $${(parseFloat(product.price) * RETAILER_MARKUP).toFixed(2)}.`)) return;

    try {
      const markupPrice = (parseFloat(product.price) * RETAILER_MARKUP).toFixed(2);

      // Create a new proxy product row for the retailer in the 'products' table
      const { error } = await supabase.from('products').insert([
        {
          seller_id: user.id, // You (Retailer) own this listing
          name: product.name,
          description: product.description,
          price: markupPrice, // Your desired selling price (with markup)
          category: product.category,
          stock_quantity: product.stock_quantity, // Initial sync to W's stock
          image_url: product.image_url,
          is_public: true, // Retailer wants to sell it publicly on the main page
          is_proxy: true, // Mark as proxy
          wholesaler_product_id: product.id, // Link to original W product
          wholesaler_id: product.seller_id, // Link to the W seller ID
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
      toast.success(`${product.name} imported and listed for sale!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import product: ' + error.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-red-800">Wholesaler Catalog</h2>
          <p className="text-gray-600">Browse and sell products from wholesalers directly. Items here are hidden from customers.</p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
          <Package size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No wholesaler products found available in the catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <div key={product.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg transition-all flex flex-col h-full">
              <div className="relative aspect-video mb-4 overflow-hidden rounded-lg bg-gray-100">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Package size={48} />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Store size={12} /> Wholesaler Cost
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-gray-800 mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                  <Store size={14} /> {product.profiles?.full_name || 'Unknown Wholesaler'}
                </p>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t mt-auto">
                <div>
                  <p className="text-xs text-gray-500">Your Cost</p>
                  <p className="font-bold text-xl text-red-600">${parseFloat(product.price).toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-green-500">Sell At</p>
                    <p className="font-bold text-xl text-green-700">
                        ${(parseFloat(product.price) * RETAILER_MARKUP).toFixed(2)}
                    </p>
                </div>
                <button 
                  onClick={() => importProduct(product)}
                  className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                >
                  <Plus size={18} /> Import
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WholesalerCatalog;