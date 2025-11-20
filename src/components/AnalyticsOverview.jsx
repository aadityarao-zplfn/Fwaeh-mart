/*
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getSellerAnalytics, getAnalyticsSummary } from '../utils/analytics.jsx';
import { Eye, MousePointer, ShoppingCart, Package, TrendingUp, BarChart3 } from 'lucide-react';

const AnalyticsOverview = () => {
  const [analytics, setAnalytics] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      
      const summaryResult = await getAnalyticsSummary(user.id);
      if (summaryResult.data) {
        setSummary(summaryResult.data);
      }

      const analyticsResult = await getSellerAnalytics(user.id);
      if (analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, change, icon: Icon }) => (
    <div className="card bg-gradient-to-br from-red-500 to-rose-600 text-white hover:shadow-2xl transition-shadow cursor-pointer rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm opacity-90 font-medium">{title}</p>
          <p className="text-4xl font-bold mt-2">{value}</p>
        </div>
        <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
          <Icon size={24} className="text-white" />
        </div>
      </div>
      {change && (
        <div className="flex items-center text-sm">
          <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
            {change}
          </span>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: '#ff5757' }}></div>
      </div>
    );
  }
 
  return (
    <div className="space-y-8">
      {/* Analytics Stats */ /*}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Views"
          value={summary?.totalViews?.toLocaleString() || '0'}
          change="+12.5% vs last month"
          icon={Eye}
        />
        <StatCard
          title="Product Clicks"
          value={summary?.totalClicks?.toLocaleString() || '0'}
          change="+8.3% engagement"
          icon={MousePointer}
        />
        <StatCard
          title="Cart Adds"
          value={summary?.totalCartAdds?.toLocaleString() || '0'}
          change="+15.2% conversion"
          icon={ShoppingCart}
        />
        <StatCard
          title="Purchases"
          value={summary?.totalPurchases?.toLocaleString() || '0'}
          change="+5.7% sales"
          icon={Package}
        />
      </div>

      {/* Conversion Metrics */ /*}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl p-6 shadow-md" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
          <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: '#b91c1c' }}>
            <BarChart3 className="mr-2" size={20} />
            Conversion Rates
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span style={{ color: '#dc2626' }}>Click-Through Rate</span>
                <span className="font-bold" style={{ color: '#b91c1c' }}>
                  {summary?.clickThroughRate || 0}%
                </span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff5757, #ff8282)',
                    width: `${Math.min(summary?.clickThroughRate || 0, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span style={{ color: '#dc2626' }}>Purchase Conversion</span>
                <span className="font-bold" style={{ color: '#b91c1c' }}>
                  {summary?.conversionRate || 0}%
                </span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-500"
                  style={{ 
                    background: 'linear-gradient(135deg, #ff5757, #ff8282)',
                    width: `${Math.min(summary?.conversionRate || 0, 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl p-6 shadow-md" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
          <h3 className="text-lg font-bold mb-4 flex items-center" style={{ color: '#b91c1c' }}>
            <TrendingUp className="mr-2" size={20} />
            Performance Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span style={{ color: '#dc2626' }}>Total Products</span>
              <span className="font-bold" style={{ color: '#b91c1c' }}>
                {summary?.productCount || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#dc2626' }}>Avg. Views per Product</span>
              <span className="font-bold" style={{ color: '#b91c1c' }}>
                {summary?.productCount > 0 ? Math.round(summary.totalViews / summary.productCount) : 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span style={{ color: '#dc2626' }}>Cart Conversion Rate</span>
              <span className="font-bold" style={{ color: '#b91c1c' }}>
                {summary?.totalCartAdds > 0 ? ((summary.totalPurchases / summary.totalCartAdds) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Product Performance Table *//*}
      <div className="rounded-xl p-6 shadow-md" style={{ background: '#fff5f5', border: '2px solid #fca5a5' }}>
        <h3 className="text-lg font-bold mb-4" style={{ color: '#b91c1c' }}>Product Performance</h3>
        
        {analytics.length === 0 ? (
          <div className="text-center py-8 rounded-xl" style={{ background: '#fff5f5', border: '2px dashed #fca5a5' }}>
            <p className="mb-2" style={{ color: '#dc2626' }}>No analytics data available yet</p>
            <p className="text-sm" style={{ color: '#dc2626' }}>
              Analytics will appear when customers interact with your products
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '2px solid #fca5a5' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: '#b91c1c' }}>Product</th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: '#b91c1c' }}>Views</th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: '#b91c1c' }}>Clicks</th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: '#b91c1c' }}>Cart Adds</th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: '#b91c1c' }}>Purchases</th>
                  <th className="text-right py-3 px-4 font-semibold" style={{ color: '#b91c1c' }}>Conversion</th>
                </tr>
              </thead>
              <tbody>
                {analytics.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #fecaca' }} className="hover:bg-red-50">
                    <td className="py-3 px-4 font-medium" style={{ color: '#dc2626' }}>
                      {item.products?.name || 'Unknown Product'}
                    </td>
                    <td className="text-right py-3 px-4" style={{ color: '#dc2626' }}>
                      {item.views || 0}
                    </td>
                    <td className="text-right py-3 px-4" style={{ color: '#dc2626' }}>
                      {item.clicks || 0}
                    </td>
                    <td className="text-right py-3 px-4" style={{ color: '#dc2626' }}>
                      {item.cart_adds || 0}
                    </td>
                    <td className="text-right py-3 px-4" style={{ color: '#dc2626' }}>
                      {item.purchases || 0}
                    </td>
                    <td className="text-right py-3 px-4 font-semibold" style={{ color: '#b91c1c' }}>
                      {item.clicks > 0 ? ((item.purchases / item.clicks) * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsOverview;

*/