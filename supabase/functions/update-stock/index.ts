import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('🔄 Edge Function started');
    
    // ✅ FIX: Use non-reserved variable name (SERVICE_ROLE_KEY)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') // This is usually auto-set correctly
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY') // <--- NEW VARIABLE NAME
    
    if (!supabaseUrl || !serviceRoleKey) {
      console.error('💥 Error: Missing SUPABASE_URL or SERVICE_ROLE_KEY');
      throw new Error('Missing environment variables. Did you set SERVICE_ROLE_KEY in Secrets?');
    }

    // Create client with Service Role Key
    const supabase = createClient(supabaseUrl, serviceRoleKey) // Use the new variable
    
    // Parse request body
    const { productId, quantity, operation } = await req.json()
    console.log('Received:', { productId, quantity, operation });

    // Basic validation
    if (!productId || quantity === undefined || !operation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: productId, quantity, or operation' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .maybeSingle()

    if (fetchError) {
      console.error('Fetch error during initial query:', fetchError);
      throw fetchError;
    }

    if (!product) {
      console.error('💥 Error: Product not found with ID:', productId);
      return new Response(
        JSON.stringify({ error: 'Product not found. Stock update aborted.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    console.log('Current stock:', product.stock_quantity);

    let newStock = product.stock_quantity

    // Perform operation
    if (operation === 'add') {
      newStock += quantity
    } else if (operation === 'subtract') {
      newStock -= quantity
      if (newStock < 0) newStock = 0 
    } else if (operation === 'set') {
      newStock = quantity
    } else {
      throw new Error('Invalid operation')
    }

    console.log('New stock:', newStock);

    // Update product
    const { data, error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError
    }

    console.log('✅ Update successful');

    return new Response(
      JSON.stringify({ 
        success: true, 
        data,
        previous_stock: product.stock_quantity,
        operation 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('💥 Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown server error occurred',
        note: 'Check function logs for details'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})