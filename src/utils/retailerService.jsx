import { supabase } from '../lib/supabase.jsx';
import toast from 'react-hot-toast';

export const fulfillProxyOrder = async (originalOrder, orderItem) => {
    const { quantity, products: proxyProduct } = orderItem;
    
    if (!proxyProduct.is_proxy || !proxyProduct.wholesaler_id) {
        throw new Error("Invalid proxy product configuration");
    }

    try {
      // CRITICAL: Use ACTUAL wholesaler price from product data
      const wholesalerPrice = parseFloat(proxyProduct.wholesaler_price);
      const totalCost = wholesalerPrice * quantity; // Exact customer quantity × wholesaler price

      console.log(`💰 Processing payment of ₹${totalCost.toFixed(2)} to Wholesaler for ${quantity} items...`);

      // NO STOCK CHANGES - Payment only flow

      // Create fulfillment order for wholesaler
      const { data: fulfillmentOrder, error: fulfillmentError } = await supabase
        .from('orders')
        .insert([{
           user_id: originalOrder.user_id,
           total_amount: totalCost,
           status: 'pending',
           shipping_address: originalOrder.shipping_address,
           contact_phone: originalOrder.contact_phone,
           contact_email: originalOrder.contact_email,
           order_type: 'dropship_inbound',
           payment_method: 'retailer_credit'
        }])
        .select()
        .single();

      if (fulfillmentError) throw fulfillmentError;

      // Add item to fulfillment order with ACTUAL wholesaler product
      const { error: itemError } = await supabase
        .from('order_items')
        .insert([{
           order_id: fulfillmentOrder.id,
           product_id: proxyProduct.wholesaler_product_id,
           seller_id: proxyProduct.wholesaler_id,
           quantity: quantity, // Same quantity customer bought
           price_at_purchase: wholesalerPrice // Actual wholesaler price
        }]);

      if (itemError) throw itemError;

      // Update original order to mark payment complete and link fulfillment
      const { error: linkError } = await supabase
        .from('orders')
        .update({ 
           wholesaler_fulfillment_order_id: fulfillmentOrder.id,
           wholesaler_payment_made: true
        })
        .eq('id', originalOrder.id);

      if (linkError) throw linkError;

      return { success: true, fulfillmentOrderId: fulfillmentOrder.id };

    } catch (error) {
      console.error("Proxy fulfillment failed:", error);
      return { success: false, error: error.message };
    }
};