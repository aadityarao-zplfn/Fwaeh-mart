import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, User, Package, Calendar, Search } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';

const RetailerTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // 1. UPDATED QUERY: Fetch 'wholesaler_price'
      const { data: items, error } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          price_at_purchase,
          wholesaler_price, 
          created_at,
          seller_id,
          products!order_items_product_id_fkey!inner (
            name, 
            image_url,
            wholesaler_id
          ),
          orders!inner (
            id,
            total_amount,
            status,
            wholesaler_payment_made
          )
        `)
        .eq('products.wholesaler_id', user.id)
        .eq('orders.wholesaler_payment_made', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!items || items.length === 0) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      // 2. Extract Retailer IDs
      const retailerIds = [...new Set(items.map(item => item.seller_id))];

      // 3. Fetch Retailer Profiles
      let retailersProfileMap = {};
      if (retailerIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', retailerIds);
          
        if (profilesError) throw profilesError;
        
        retailersProfileMap = profiles.reduce((acc, p) => {
          acc[p.id] = p.full_name;
          return acc;
        }, {});
      }

      // 4. UPDATED MAPPING: Use 'wholesaler_price' for calculation
      const formattedTransactions = items.map(item => {
        const retailerName = retailersProfileMap[item.seller_id] || 'Unknown Retailer';
        
        // LOGIC FIX:
        // If wholesaler_price exists (Proxy Order), use it.
        // Fallback to price_at_purchase only if it's a direct sale (though this query filters for proxy).
        const unitPrice = item.wholesaler_price || item.price_at_purchase;

        return {
          id: item.id,
          transactionId: item.orders.id,
          retailerName: retailerName,
          productName: item.products?.name || 'Unknown Product',
          productImage: item.products?.image_url,
          quantity: item.quantity,
          // Use the corrected unit price
          totalPrice: (unitPrice * item.quantity).toFixed(2), 
          date: item.created_at
        };
      });

      setTransactions(formattedTransactions);

    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(t => 
    t.retailerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-red-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="text-red-600" /> Transactions with Retailers
          </h1>
          <p className="text-gray-500 mt-1">
            Track payments received from your retailer network
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Search retailer or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-red-50 border border-red-100 rounded-xl focus:outline-none focus:border-red-300"
          />
        </div>
      </div>

      {filteredTransactions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <CreditCard size={48} className="mx-auto mb-4 text-gray-300" />
          <h3 className="text-xl font-bold text-gray-800">No Transactions Yet</h3>
          <p className="text-gray-500">Payments from retailers will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-md border border-red-100 overflow-hidden">
          <div className="max-h-[calc(100vh-250px)] overflow-y-auto custom-scrollbar p-4 space-y-3">
            {filteredTransactions.map((tx) => (
              <div key={tx.id} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 transition-all">
                
                <div className="flex items-center gap-3 md:w-1/4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                    <User size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{tx.retailerName}</p>
                    <p className="text-xs text-gray-500 font-mono">#{tx.transactionId.slice(0, 8)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-white rounded-lg overflow-hidden border border-gray-200">
                    <img 
                      src={tx.productImage || '/placeholder.svg'} 
                      alt={tx.productName} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tx.productName}</p>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md flex items-center gap-1 w-fit mt-1">
                      <Package size={10} /> Qty: {tx.quantity}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end md:w-1/5">
                  <p className="text-lg font-bold text-green-600">₹{tx.totalPrice}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar size={10} /> {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RetailerTransactions;