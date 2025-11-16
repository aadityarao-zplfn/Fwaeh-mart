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
    
    // Get environment variables with fallbacks
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Parse request body
    const { productId, quantity, operation } = await req.json()
    console.log('Received:', { productId, quantity, operation });

    // Basic validation
    if (!productId || quantity === undefined || !operation) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get current product
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single()

    if (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error('Product not found')
    }

    console.log('Current stock:', product.stock_quantity);

    let newStock = product.stock_quantity

    // Perform operation
    if (operation === 'add') {
      newStock += quantity
    } else if (operation === 'subtract') {
      newStock -= quantity
      if (newStock < 0) newStock = 0 // Don't allow negative, just set to 0
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
        error: error.message,
        note: 'Check function logs for details'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})