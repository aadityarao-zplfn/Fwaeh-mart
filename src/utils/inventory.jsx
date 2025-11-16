import { supabase } from '../lib/supabase'

export const updateProductStock = async (productId, quantity, operation) => {
  try {
    const { data, error } = await supabase.functions.invoke('update-stock', {
      body: { productId, quantity, operation }
    })

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating stock:', error)
    return { success: false, error: error.message }
  }
}

// Convenience functions
export const addStock = async (productId, quantity) => {
  return await updateProductStock(productId, quantity, 'add')
}

export const subtractStock = async (productId, quantity) => {
  return await updateProductStock(productId, quantity, 'subtract')
}

export const setStock = async (productId, quantity) => {
  return await updateProductStock(productId, quantity, 'set')
}