// src/pages/RetailerNetwork.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Users, Package, Phone, MapPin, Mail, Box, Search } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const RetailerNetwork = () => {
  const [networkData, setNetworkData] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchRetailerNetwork();
    }
  }, [user]);

  const fetchRetailerNetwork = async () => {
    try {
      setLoading(true);

      // 1. Fetch all products that are proxies linked to this wholesaler
      // We join with the 'profiles' table on the 'seller_id' foreign key to get Retailer details
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          stock_quantity,
          image_url,
          category,
          seller_id,
          retailer:profiles!seller_id (
            full_name,
            email,
            phone,
            address,
            location_address
          )
        `)
        .eq('wholesaler_id', user.id) // Only products sourced from THIS wholesaler
        .eq('is_proxy', true);        // Only proxy products (imports)

      if (error) throw error;

      // 2. Group Data by Retailer
      // Structure: { retailerId: { info: {...}, products: [...] } }
      const groupedData = {};

      data.forEach(product => {
        const retailerId = product.seller_id;
        
        // If this retailer isn't in our list yet, initialize their section
        if (!groupedData[retailerId]) {
          groupedData[retailerId] = {
            info: product.retailer, // Retailer profile details
            products: []            // List of products they took from you
          };
        }

        // Add this product to the retailer's list
        // If they have multiple products, this array grows
        // If they import a new product, it gets added here automatically on next fetch
        groupedData[retailerId].products.push({
          id: product.id,
          name: product.name,
          stock: product.stock_quantity,
          image: product.image_url,
          category: product.category
        });
      });

      setNetworkData(groupedData);

    } catch (error) {
      console.error('Error fetching network:', error);
      toast.error('Failed to load retailer network');
    } finally {
      setLoading(false);
    }
  };

  // Convert object to array for mapping
  const retailers = Object.values(networkData).filter(item => 
    item.info?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-red-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="text-red-600" /> Retailer Network
          </h1>
          <p className="text-gray-500 mt-1">
            Monitor retailers who are selling your products
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search retailers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-red-50 border border-red-100 rounded-xl focus:outline-none focus:border-red-300"
          />
        </div>
      </div>

      {/* Retailers List */}
      {retailers.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <Users size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-800">No Retailers Found</h3>
          <p className="text-gray-500">Retailers who import your products will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {retailers.map((data, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-md border border-red-100 overflow-hidden transition-all hover:shadow-lg">
              
              {/* Retailer Header Section */}
              <div className="p-6 bg-gradient-to-r from-red-50 to-white border-b border-red-100">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold text-xl">
                      {data.info?.full_name?.charAt(0).toUpperCase() || 'R'}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{data.info?.full_name || 'Unknown Retailer'}</h2>
                      <div className="flex flex-wrap gap-3 mt-1 text-sm text-gray-600">
                        {data.info?.phone && (
                          <span className="flex items-center gap-1"><Phone size={14} /> {data.info.phone}</span>
                        )}
                        {data.info?.email && (
                          <span className="flex items-center gap-1"><Mail size={14} /> {data.info.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-red-100 shadow-sm">
                    <Package className="text-red-500" size={20} />
                    <span className="font-bold text-gray-800">{data.products.length}</span>
                    <span className="text-gray-500 text-sm">Products Sourced</span>
                  </div>
                </div>
                
                {(data.info?.location_address || data.info?.address) && (
                  <div className="mt-4 flex items-start gap-2 text-sm text-gray-600 bg-white/50 p-2 rounded-lg w-fit">
                    <MapPin size={16} className="text-red-400 mt-0.5" />
                    {data.info.location_address || data.info.address}
                  </div>
                )}
              </div>

              {/* Products Grid for this Retailer */}
              <div className="p-6">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Products in their Inventory</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data.products.map((product) => (
                    <div key={product.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-red-200 bg-gray-50 hover:bg-red-50 transition-colors">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Box size={20} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate text-sm" title={product.name}>{product.name}</p>
                        <p className={`text-xs font-bold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          Stock: {product.stock}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RetailerNetwork;