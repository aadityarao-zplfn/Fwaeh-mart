// QueriesPage.jsx
import { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Clock, Eye, X, Send, Package } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function QueriesPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [responding, setResponding] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

const fetchQueries = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    console.log('🔄 Fetching queries...');
    
    const { data, error } = await supabase
      .from('customer_queries')
      .select('*')
      .eq('retailer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Fetch product names for queries that have product_id but no product_name
    const queriesWithProductNames = await Promise.all(
      (data || []).map(async (query) => {
        // If product_name is missing but we have product_id, fetch the product name
        if (!query.product_name && query.product_id) {
          const { data: product } = await supabase
            .from('products')
            .select('name')
            .eq('id', query.product_id)
            .single();
          
          return {
            ...query,
            product_name: product?.name || 'Product Not Found'
          };
        }
        return query;
      })
    );

    console.log('✅ Queries with product names:', queriesWithProductNames);
    setQueries(queriesWithProductNames);
    
  } catch (error) {
    console.error('Error fetching queries:', error);
    toast.error('Failed to load queries');
  } finally {
    setLoading(false);
  }
};

  const submitResponse = async (e) => {
    e.preventDefault();
    if (!responseMessage.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setResponding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Not logged in');
        return;
      }

      console.log('🔄 User:', user.id);
      console.log('🔄 Query ID to update:', selectedQuery.id);
      console.log('🔄 Query retailer_id:', selectedQuery.retailer_id);

      // Step 1: Verify we can read this query
      const { data: verifyQuery, error: verifyError } = await supabase
        .from('customer_queries')
        .select('*')
        .eq('id', selectedQuery.id)
        .single();

      console.log('✅ Query verification:', verifyQuery);
      console.log('❌ Query verification error:', verifyError);

      if (verifyError) {
        throw new Error('Cannot access query: ' + verifyError.message);
      }

      // Step 2: Add response
      const { error: responseError } = await supabase
        .from('query_responses')
        .insert({
          query_id: selectedQuery.id,
          responder_id: user.id,
          message: responseMessage
        });

      if (responseError) {
        console.error('❌ Response insert error:', responseError);
        throw responseError;
      }

      console.log('✅ Response inserted successfully');

      // Step 3: Update query status
      console.log('🔄 Attempting status update...');
      const { error: updateError } = await supabase
        .from('customer_queries')
        .update({ 
          status: 'answered',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedQuery.id)
        .select();

      console.log('❌ Status update error:', updateError);

      if (updateError) {
        throw new Error('Status update failed: ' + updateError.message);
      }

      console.log('✅ Status updated to "answered" successfully');

      toast.success('Response sent successfully!');
      setResponseMessage('');
      setSelectedQuery(null);
      
      fetchQueries();

      
    } catch (error) {
      console.error('🚨 Error in submitResponse:', error);
      toast.error('Failed to send response: ' + error.message);
    } finally {
      setResponding(false);
    }
  };

  const closeQuery = async (queryId) => {
    try {
      const { error } = await supabase
        .from('customer_queries')
        .update({ 
          status: 'closed',
          updated_at: new Date().toISOString()
        })
        .eq('id', queryId);

      if (error) throw error;

      toast.success('Query closed');
      fetchQueries();
      if (selectedQuery?.id === queryId) {
        setSelectedQuery(null);
      }
    } catch (error) {
      console.error('Error closing query:', error);
      toast.error('Failed to close query');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock size={14} className="text-orange-600" />;
      case 'answered': return <CheckCircle size={14} className="text-green-600" />;
      case 'closed': return <X size={14} className="text-gray-600" />;
      default: return <MessageCircle size={14} className="text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'answered': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-5xl font-bold text-red-800">Customer Queries</h1>
        <div className="text-sm text-gray-500">
          {queries.filter(q => q.status === 'pending').length} pending queries
        </div>
      </div>

      {/* Queries List - Updated Compact Layout */}
      <div className="space-y-4">
        {queries.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
            <MessageCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-600 mb-2">No Queries Yet</h3>
            <p className="text-gray-500">Customer queries will appear here</p>
          </div>
        ) : (
          queries.map((query) => (
            <div
              key={query.id}
              className={`bg-white p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedQuery?.id === query.id ? 'border-rose-500' : 'border-gray-200'
              }`}
              onClick={() => setSelectedQuery(query)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  {/* Query ID and Status */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                      #{query.id.slice(0, 8)}
                    </span>
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getStatusColor(query.status)}`}>
                      {getStatusIcon(query.status)}
                      {query.status}
                    </span>
                  </div>

                 {/* Product and Order Info */}
<div className="flex items-center gap-4 text-sm">
  <div className="flex items-center gap-1 text-gray-700">
    <Package size={14} className="text-gray-500" />
    <span className="font-medium">
      {query.product_name ? (
        query.product_name
      ) : query.product_id ? (
        `Product ID: ${query.product_id.slice(0, 8)}`
      ) : (
        'No product specified'
      )}
    </span>
  </div>
  {query.order_id && (
    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
      Order: #{query.order_id.slice(0, 8)}
    </span>
  )}
</div>

                  {/* Subject and Message Preview */}
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm mb-1">{query.subject}</h3>
                    <p className="text-gray-600 text-xs line-clamp-2">{query.message}</p>
                  </div>

                  {/* Timestamp */}
                  <p className="text-xs text-gray-500">
                    {new Date(query.created_at).toLocaleString()}
                  </p>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  {query.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeQuery(query.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Close query"
                    >
                      <X size={16} />
                    </button>
                  )}
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Eye size={14} />
                    <span>View</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Response Modal */}
      {selectedQuery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    #{selectedQuery.id.slice(0, 8)}
                  </span>
                  <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${getStatusColor(selectedQuery.status)}`}>
                    {getStatusIcon(selectedQuery.status)}
                    {selectedQuery.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-800">{selectedQuery.subject}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                  <span>From: {selectedQuery.customer_email}</span>
<span>Product: {selectedQuery.product_name || selectedQuery.product_id ? `ID: ${selectedQuery.product_id?.slice(0, 8)}` : 'Not specified'}</span>                  {selectedQuery.order_id && (
                    <span>Order: #{selectedQuery.order_id.slice(0, 8)}</span>
                  )}
                </div>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date(selectedQuery.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X size={24} />
              </button>
            </div>

            {/* Original Query */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-gray-700 mb-2 text-sm">Customer Query:</h4>
              <p className="text-gray-600 whitespace-pre-wrap text-sm">{selectedQuery.message}</p>
            </div>

            {/* Response Form */}
            {selectedQuery.status === 'pending' && (
              <form onSubmit={submitResponse}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Type your response to the customer..."
                    rows="4"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none text-sm"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedQuery(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={responding}
                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Send size={16} />
                    {responding ? 'Sending...' : 'Send Response'}
                  </button>
                </div>
              </form>
            )}

            {/* Query Closed Message */}
            {selectedQuery.status === 'closed' && (
              <div className="text-center py-6">
                <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
                <p className="text-gray-600 font-medium">This query has been closed</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}