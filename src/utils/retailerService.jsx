import { supabase } from '../lib/supabase.jsx';
import { subtractStock } from './inventory.jsx'; 
import toast from 'react-hot-toast';

/**
 * Handles the automated fulfillment process for a proxy item order (Case 3).
 * * 1. Decrements stock of the original wholesaler product.
 * 2. Creates a hidden fulfillment order (Retailer buys from Wholesaler).
 * 3. Links the customer's order to the fulfillment order for tracking.
 */
export const fulfillProxyOrder = async (item, customerOrder) => {
    const { quantity, products: proxyProduct } = item;
    const { id: customerOrderId, shipping_address, contact_phone, contact_email } = customerOrder;

    if (!proxyProduct.is_proxy || !proxyProduct.wholesaler_id || !proxyProduct.wholesaler_product_id) {
        throw new Error("Product is not configured as a valid proxy item.");
    }
    
    // --- 1. Calculate Wholesaler's Price (Cost of Goods Sold - COGS) ---
    // We assume the retailer added a 15% markup on import (as coded in WholesalerCatalog.jsx).
    // Wholesaler Price = Retailer Price / 1.15
    const retailerSellingPrice = parseFloat(proxyProduct.price);
    const wholesalerCostPrice = retailerSellingPrice / 1.15; 
    
    // --- 2. DECREMENT STOCK from the original wholesaler product ---
    console.log(`Fulfilling proxy: Decrementing W stock for ID: ${proxyProduct.wholesaler_product_id}`);

    const stockResult = await subtractStock(proxyProduct.wholesaler_product_id, quantity);
    
    if (!stockResult.success) {
      toast.error(`Stock fulfillment failed for ${proxyProduct.name}. Wholesaler inventory too low.`);
      throw new Error(`Wholesaler stock error: ${stockResult.error}`);
    }
    
    // --- 3. CREATE HIDDEN FULFILLMENT ORDER (Retailer buys from Wholesaler) ---
    // This order tells the Wholesaler what to ship and where.
    const { data: wholesalerOrder, error: woError } = await supabase
      .from('orders')
      .insert([{
        // The Wholesaler is the 'user' (seller) of this internal order, 
        // but the item purchase is for the customer's delivery.
        user_id: proxyProduct.wholesaler_id, 
        total_amount: wholesalerCostPrice * quantity, // The amount the Retailer pays the Wholesaler
        status: 'shipped', // Automatically ship, as stock is confirmed/deducted
        shipping_address: shipping_address, // CRITICAL: Ship directly to customer
        contact_phone: contact_phone,
        contact_email: contact_email,
        order_type: 'dropship_inbound', // Internal flag to identify this as dropship fulfillment
        wholesaler_fulfillment_order_id: customerOrderId, // Link back to the customer's order
      }])
      .select('id')
      .single();

    if (woError) {
      console.error('CRITICAL: Failed to create wholesaler order.', woError);
      throw woError;
    }
    
    // --- 4. LINK THE CUSTOMER'S ORDER FOR TRACKING ---
    const { error: updateError } = await supabase
      .from('orders')
      .update({ 
          wholesaler_fulfillment_order_id: wholesalerOrder.id,
          status: 'shipped' // Retailer order status moves directly to shipped as fulfillment is initiated
      })
      .eq('id', customerOrderId);
      
    if (updateError) {
        console.error('CRITICAL: Failed to link fulfillment ID.', updateError);
        throw updateError;
    }

    return { success: true, wholesalerOrderId: wholesalerOrder.id };
};