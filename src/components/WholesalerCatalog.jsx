import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Package, Plus, Search, Store, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const WholesalerCatalog = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [importPrices, setImportPrices] = useState({}); // Store custom prices
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile?.role === 'retailer') {
      fetchWholesalerProducts();
    } else if (profile) {
      setLoading(false);
    }
  }, [profile]);

  const fetchWholesalerProducts = async () => {
    try {
      // Fetch active, non-public (catalog-only) products
      const { data, error } = await supabase
        .from('products')
        .select('*, profiles!seller_id(full_name)')
        .eq('profiles.role', 'wholesaler')
        .eq('is_public', false)
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

  const handlePriceChange = (productId, value) => {
    setImportPrices(prev => ({ ...prev, [productId]: value }));
  };

  const importProduct = async (product) => {
    const customPrice = importPrices[product.id];
    
    if (!customPrice || parseFloat(customPrice) <= parseFloat(product.price)) {
      toast.error(`Please set a selling price higher than the cost ($${product.price})`);
      return;
    }

    if (!confirm(`Import "${product.name}" and sell for $${customPrice}?`)) return;

    try {
      const { error } = await supabase.from('products').insert([
        {
          seller_id: user.id,
          name: product.name,
          description: product.description,
          price: parseFloat(customPrice), // Use the custom price
          category: product.category,
          stock_quantity: product.stock_quantity, // Sync stock initially
          image_url: product.image_url,
          is_public: true,
          is_proxy: true,
          wholesaler_product_id: product.id,
          wholesaler_id: product.seller_id,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ]);

      if (error) throw error;
      toast.success(`${product.name} imported successfully!`);
      
      // Optional: Remove from list or mark as imported
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import: ' + error.message);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!profile || profile.role !== 'retailer') return <div className="p-8 text-center">Access Restricted</div>;
  if (loading) return <div className="p-8 text-center">Loading catalog...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-red-800">Wholesaler Catalog</h2>
          <p className="text-gray-600">Select items to add to your store.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="border border-gray-200 rounded-xl p-4 bg-white hover:shadow-lg transition-all flex flex-col h-full">
            <div className="relative aspect-video mb-4 overflow-hidden rounded-lg bg-gray-100">
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                Wholesale
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="font-bold text-gray-800 mb-1">{product.name}</h3>
              {/* Shows Wholesaler Name */}
              <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                <Store size={14} /> {products.seller_id?.full_name || 'Unknown Supplier'}
              </p>
            </div>
            
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Cost Price:</span>
                <span className="font-bold text-red-600">${product.price}</span>
              </div>

              {/* Custom Price Input */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="number" 
                    placeholder="Set your price"
                    className="w-full pl-6 pr-2 py-1.5 border rounded text-sm"
                    onChange={(e) => handlePriceChange(product.id, e.target.value)}
                  />
                </div>
                <button 
                  onClick={() => importProduct(product)}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm font-semibold rounded hover:bg-red-700"
                >
                  Import
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WholesalerCatalog;