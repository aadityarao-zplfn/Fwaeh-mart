// QueriesPage.jsx
import { useState, useEffect } from 'react';
import { MessageCircle, CheckCircle, Clock, Eye, X, Send } from 'lucide-react';
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
   // checkAllQueries();
  }, []);

  const fetchQueries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Fetching queries for retailer:', user.id);

      const { data, error } = await supabase
        .from('customer_queries')
        .select('*')
        .eq('retailer_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Queries data:', data);
      console.log('Queries error:', error);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // If we have queries, fetch user emails separately
      const queriesWithUserData = await Promise.all(
        (data || []).map(async (query) => {
          let customer_email = 'Customer';
          
          try {
            const { data: userData } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', query.user_id)
              .single();
            
            customer_email = userData?.email || 'Customer';
          } catch (error) {
            console.log('Using fallback for customer email');
          }

          const { data: productData } = await supabase
            .from('products')
            .select('name')
            .eq('id', query.product_id)
            .single();

          return {
            ...query,
            customer_email: customer_email,
            product_name: productData?.name || 'Product'
          };
        })
      );

      setQueries(queriesWithUserData);
    } catch (error) {
      console.error('Error fetching queries:', error);
      toast.error('Failed to load queries: ' + error.message);
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

     

      {/* Queries List */}
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
              className={`bg-rose-100 p-6 rounded-2xl shadow-sm border-2 cursor-pointer transition-all hover:shadow-md ${
                selectedQuery?.id === query.id ? 'border-rose-500' : 'border-gray-200'
              }`}
              onClick={() => setSelectedQuery(query)}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg text-gray-800">{query.subject}</h3>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                        query.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : query.status === 'answered'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {query.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3 line-clamp-2">{query.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Order: #{query.order_id?.slice(0, 8)}</span>
                    <span>Product: {query.product_name}</span>
                    <span>{new Date(query.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {query.status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeQuery(query.id);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Close query"
                    >
                      <X size={18} />
                    </button>
                  )}
                  <Eye size={20} className="text-gray-400" />
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
                <h3 className="text-xl font-bold text-gray-800">{selectedQuery.subject}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  From: {selectedQuery.customer_email} • {new Date(selectedQuery.created_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuery(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            {/* Original Query */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h4 className="font-bold text-gray-700 mb-2">Customer Query:</h4>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedQuery.message}</p>
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
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedQuery(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={responding}
                    className="flex-1 px-4 py-2 bg-rose-500 text-white rounded-lg font-medium hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                  >
                    <Send size={18} />
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