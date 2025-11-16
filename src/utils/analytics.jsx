import { supabase } from '../lib/supabase';

// Track product view
export const trackProductView = async (productId) => {
  try {
    const { error } = await supabase.rpc('increment_product_views', { product_id: productId });
    if (error) console.warn('Error tracking view:', error);
    return { success: !error };
  } catch (error) {
    console.error('Error tracking product view:', error);
    return { success: false };
  }
};

// Track product click
export const trackProductClick = async (productId) => {
  try {
    const { error } = await supabase.rpc('increment_product_clicks', { product_id: productId });
    if (error) console.warn('Error tracking click:', error);
    return { success: !error };
  } catch (error) {
    console.error('Error tracking product click:', error);
    return { success: false };
  }
};

// Track cart add
export const trackCartAdd = async (productId) => {
  try {
    const { error } = await supabase.rpc('increment_cart_adds', { product_id: productId });
    if (error) console.warn('Error tracking cart add:', error);
    return { success: !error };
  } catch (error) {
    console.error('Error tracking cart add:', error);
    return { success: false };
  }
};

// Track purchase (call this when order is completed)
export const trackPurchase = async (productId, quantity = 1) => {
  try {
    const { error } = await supabase.rpc('increment_purchases', { 
      product_id: productId, 
      purchase_quantity: quantity 
    });
    if (error) console.warn('Error tracking purchase:', error);
    return { success: !error };
  } catch (error) {
    console.error('Error tracking purchase:', error);
    return { success: false };
  }
};

// Get analytics for seller's products
export const getSellerAnalytics = async (sellerId) => {
  try {
    const { data, error } = await supabase
      .from('product_analytics')
      .select(`*, products!inner (name, price, seller_id)`)
      .eq('products.seller_id', sellerId);
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Get analytics summary
export const getAnalyticsSummary = async (sellerId) => {
  try {
    const { data, error } = await supabase
      .from('product_analytics')
      .select(`views, clicks, cart_adds, purchases, products!inner (seller_id)`)
      .eq('products.seller_id', sellerId);

    if (error) throw error;

    const summary = data.reduce((acc, item) => ({
      totalViews: acc.totalViews + (item.views || 0),
      totalClicks: acc.totalClicks + (item.clicks || 0),
      totalCartAdds: acc.totalCartAdds + (item.cart_adds || 0),
      totalPurchases: acc.totalPurchases + (item.purchases || 0),
      productCount: acc.productCount + 1
    }), { totalViews: 0, totalClicks: 0, totalCartAdds: 0, totalPurchases: 0, productCount: 0 });

    summary.clickThroughRate = summary.totalViews > 0 ? (summary.totalClicks / summary.totalViews * 100).toFixed(1) : 0;
    summary.conversionRate = summary.totalClicks > 0 ? (summary.totalPurchases / summary.totalClicks * 100).toFixed(1) : 0;

    return { data: summary, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};