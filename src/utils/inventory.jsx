import { supabase } from '../lib/supabase';

export const updateProductStock = async (productId, quantity, operation) => {
  try {
    // 🚀 CHANGED: Now calls the Database RPC function directly
    // This is much faster and prevents the 5-second timeout issue
    const { data, error } = await supabase.rpc('update_stock', {
      product_id: productId,
      quantity: quantity,
      operation: operation
    });

    if (error) throw error;
    
    // Handle logical errors from the database (e.g. "Insufficient stock")
    if (data && data.success === false) {
      throw new Error(data.error);
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error updating stock:', error);
    return { success: false, error: error.message };
  }
};

// Convenience functions remain the same but use the new reliable engine
export const addStock = async (productId, quantity) => {
  return await updateProductStock(productId, quantity, 'add');
};

export const subtractStock = async (productId, quantity) => {
  return await updateProductStock(productId, quantity, 'subtract');
};

export const setStock = async (productId, quantity) => {
  return await updateProductStock(productId, quantity, 'set');
};