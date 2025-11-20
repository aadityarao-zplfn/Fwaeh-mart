import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import { Package, Search, Store, DollarSign, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const WholesalerCatalog = () => {
  const [products, setProducts] = useState([]);
  const [existingImports, setExistingImports] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // We track both price and quantity for imports now
  const [importConfig, setImportConfig] = useState({}); 
  
  const { user, profile } = useAuth();

  useEffect(() => {
    if (profile?.role === 'retailer') {
      loadCatalogAndInventory();
    } else if (profile) {
      setLoading(false);
    }
  }, [profile]);

  const loadCatalogAndInventory = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Wholesaler Products (The Catalog)
      const { data: catalogData, error: catalogError } = await supabase
        .from('products')
        .select('*, profiles!seller_id(full_name)')
        .eq('is_active', true)
        .eq('is_public', false)
        // We filter manually for wholesaler role if needed, or rely on RLS/Data structure
        // Assuming you want to see products from users who are wholesalers:
        .eq('profiles.role', 'wholesaler'); 

      if (catalogError) throw catalogError;

      // 2. Fetch Retailer's EXISTING Imports (To prevent duplicates)
      const { data: myData, error: myError } = await supabase
        .from('products')
        .select('id, stock_quantity, price, wholesaler_product_id')
        .eq('seller_id', user.id)
        .eq('is_proxy', true);

      if (myError) throw myError;

      // Map existing imports by their ORIGINAL wholesaler ID for fast lookup
      // Key: wholesaler_product_id, Value: My Product Object
      const importMap = new Map();
      myData.forEach(p => {
        if (p.wholesaler_product_id) {
          importMap.set(p.wholesaler_product_id, p);
        }
      });

      setProducts(catalogData || []);
      setExistingImports(importMap);

    } catch (error) {
      console.error('Error loading catalog:', error);
      toast.error('Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (productId, field, value) => {
    setImportConfig(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleImport = async (wholesalerProduct) => {
    const config = importConfig[wholesalerProduct.id] || {};
    const importPrice = config.price ? parseFloat(config.price) : 0;
    const importQty = config.qty ? parseInt(config.qty) : 0;

    // --- VALIDATION LOGIC ---

    // 1. Validate Price
    if (importPrice <= parseFloat(wholesalerProduct.price)) {
      toast.error(`Price must be higher than cost ($${wholesalerProduct.price})`);
      return;
    }

    // 2. Validate Quantity Input
    if (importQty <= 0) {
      toast.error("Please enter a quantity to import");
      return;
    }

    // 3. Validate Wholesaler Availability
    if (importQty > wholesalerProduct.stock_quantity) {
      toast.error(`Wholesaler only has ${wholesalerProduct.stock_quantity} available.`);
      return;
    }

    // Check if we already have this product
    const existingProduct = existingImports.get(wholesalerProduct.id);
    
    try {
      if (existingProduct) {
        // --- UPDATE EXISTING PRODUCT ---
        
        const newTotalStock = existingProduct.stock_quantity + importQty;

        // 4. Validate Total Limit
        // Rule: Your total stock cannot exceed wholesaler's total original stock (as per your requirement)
        // Note: This implies if wholesaler has 5, and you have 3, you can only add 2 more.
        if (newTotalStock > wholesalerProduct.stock_quantity) {
            toast.error(`Import limit reached. You have ${existingProduct.stock_quantity}, Wholesaler has ${wholesalerProduct.stock_quantity}. You can max add ${wholesalerProduct.stock_quantity - existingProduct.stock_quantity} more.`);
            return;
        }

        const { error } = await supabase
          .from('products')
          .update({
            stock_quantity: newTotalStock, // Add to existing stock
            price: importPrice, // Update price to new preference
            updated_at: new Date().toISOString()
          })
          .eq('id', existingProduct.id);

        if (error) throw error;
        toast.success(`Stock updated! Added ${importQty} units.`);

      } else {
        // --- CREATE NEW PRODUCT ---
        
        const { error } = await supabase.from('products').insert([
          {
            seller_id: user.id,
            name: wholesalerProduct.name,
            description: wholesalerProduct.description,
            category: wholesalerProduct.category,
            image_url: wholesalerProduct.image_url,
            
            // Custom fields
            price: importPrice,
            stock_quantity: importQty,
            
            // Linking fields
            is_public: true,
            is_proxy: true,
            wholesaler_product_id: wholesalerProduct.id,
            wholesaler_id: wholesalerProduct.seller_id,
            is_active: true
          }
        ]);

        if (error) throw error;
        toast.success(`${wholesalerProduct.name} imported successfully!`);
      }

      // Clear inputs and refresh data
      setImportConfig(prev => {
        const next = { ...prev };
        delete next[wholesalerProduct.id];
        return next;
      });
      loadCatalogAndInventory();

    } catch (error) {
      console.error('Import error:', error);
      toast.error('Operation failed: ' + error.message);
    }
  };

  // Filtering
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!profile || profile.role !== 'retailer') return <div className="p-8 text-center">Access Restricted</div>;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#ff5757' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-red-100">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: '#b91c1c' }}>Wholesaler Catalog</h2>
          <p className="text-gray-600">Import products to your store. Stocks are synced with your inventory.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search catalog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 bg-red-50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => {
            const alreadyOwned = existingImports.get(product.id);
            const currentConfig = importConfig[product.id] || {};

            return (
            <div key={product.id} className="border border-red-100 rounded-2xl p-4 bg-white hover:shadow-xl transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                
                {/* Existing Badge */}
                {alreadyOwned && (
                    <div className="absolute top-0 left-0 bg-green-100 text-green-800 px-3 py-1 rounded-br-xl text-xs font-bold z-10 border-b border-r border-green-200 flex items-center">
                        <RefreshCw size={12} className="mr-1" />
                        In Your Store ({alreadyOwned.stock_quantity})
                    </div>
                )}

                <div className="relative aspect-video mb-4 overflow-hidden rounded-xl bg-gray-100">
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-lg shadow-sm">
                        Stock: {product.stock_quantity}
                    </div>
                </div>
                
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800 mb-1 text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3 flex items-center gap-1">
                        <Store size={14} /> {product.profiles?.full_name || 'Unknown Supplier'}
                    </p>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{product.description}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-red-50 space-y-3">
                    <div className="flex justify-between items-center bg-red-50 p-2 rounded-lg">
                        <span className="text-sm font-medium text-red-800">Cost Price:</span>
                        <span className="font-bold text-red-600 text-lg">${product.price}</span>
                    </div>

                    {/* Inputs Container */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Price Input */}
                        <div>
                            <label className="text-xs text-gray-500 font-semibold ml-1">Your Price</label>
                            <div className="relative">
                                <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    className="w-full pl-6 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-400 outline-none"
                                    value={currentConfig.price || ''}
                                    onChange={(e) => handleConfigChange(product.id, 'price', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Quantity Input */}
                        <div>
                            <label className="text-xs text-gray-500 font-semibold ml-1">Import Qty</label>
                            <div className="relative">
                                <Package size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="number" 
                                    placeholder={`Max ${product.stock_quantity}`}
                                    max={product.stock_quantity}
                                    className="w-full pl-7 pr-2 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-400 outline-none"
                                    value={currentConfig.qty || ''}
                                    onChange={(e) => handleConfigChange(product.id, 'qty', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={() => handleImport(product)}
                        disabled={product.stock_quantity === 0}
                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center ${
                            product.stock_quantity === 0 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                            : 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:shadow-lg active:scale-95'
                        }`}
                    >
                        {product.stock_quantity === 0 ? (
                            'Out of Stock'
                        ) : alreadyOwned ? (
                            <>
                                <RefreshCw size={16} className="mr-2" />
                                Update Stock & Price
                            </>
                        ) : (
                            <>
                                <Package size={16} className="mr-2" />
                                Import Product
                            </>
                        )}
                    </button>

                    {alreadyOwned && (
                         <p className="text-xs text-center text-green-600 font-medium flex items-center justify-center">
                            <AlertCircle size={12} className="mr-1" />
                            You currently own {alreadyOwned.stock_quantity} units
                        </p>
                    )}
                </div>
            </div>
        )})}
      </div>
    </div>
  );
};

export default WholesalerCatalog;