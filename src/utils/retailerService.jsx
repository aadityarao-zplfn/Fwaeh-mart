import { supabase } from '../lib/supabase.jsx';

export const fulfillProxyOrder = async (originalOrder, orderItem) => {
    const { quantity, products: proxyProduct } = orderItem;
    
    // Safety check
    if (!proxyProduct.is_proxy || !proxyProduct.wholesaler_id) {
        throw new Error("Invalid proxy product configuration");
    }

    try {
      console.log(`💰 Marking Order #${originalOrder.id} as paid to Wholesaler...`);

      // CRITICAL CHANGE: 
      // We do NOT create a new order ('orders.insert').
      // We ONLY update the existing order to indicate the wholesaler has been paid.
      
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
           wholesaler_payment_made: true,
           // We keep the status as 'pending' or change to 'processing'
           // so the customer sees progress, but no new order ID is generated.
           status: 'pending' 
        })
        .eq('id', originalOrder.id);

      if (updateError) throw updateError;

      return { success: true };

    } catch (error) {
      console.error("Proxy fulfillment failed:", error);
      return { success: false, error: error.message };
    }
};