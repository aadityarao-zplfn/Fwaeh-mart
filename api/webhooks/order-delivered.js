import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  console.log('=== 🚨 WEBHOOK STARTED ===');
  
  // 1. Security: Ensure this is a POST request
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Debug environment variables
  console.log('🔍 Environment Variables Check:', {
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL ? '✅ Present' : '❌ Missing',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Present' : '❌ Missing',
    GMAIL_USER: process.env.GMAIL_USER ? '✅ Present' : '❌ Missing',
    GMAIL_PASS: process.env.GMAIL_PASS ? '✅ Present' : '❌ Missing'
  });

  // 3. Debug the request body structure
  console.log('📦 Request Body:', JSON.stringify(req.body, null, 2));
  
  if (!req.body) {
    console.log('❌ No body in request');
    return res.status(400).json({ error: 'No body received' });
  }

  const { record, old_record, type, table } = req.body;
  
  console.log('🔍 Webhook Payload Structure:', {
    type,
    table,
    hasRecord: !!record,
    hasOldRecord: !!old_record,
    recordId: record?.id,
    recordStatus: record?.status,
    oldRecordStatus: old_record?.status
  });

  // 4. Guard Clause: Only run if status CHANGED to 'delivered'
  if (!record || !old_record) {
    console.log('❌ Missing record or old_record in payload');
    return res.status(400).json({ error: 'Invalid webhook payload' });
  }

  console.log('🔄 Status Check:', {
    currentStatus: record.status,
    oldStatus: old_record.status,
    isNewDelivery: record.status === 'delivered' && old_record.status !== 'delivered'
  });

  if (record.status !== 'delivered' || old_record.status === 'delivered') {
    console.log('⏭️ Skipping: Status is not new delivery');
    return res.status(200).json({ message: 'Status change ignored' });
  }

  try {
    console.log('🟡 Starting email process for order:', record.id);
    
    // 5. Initialize Supabase Admin Client
    console.log('🔑 Initializing Supabase client...');
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    console.log('✅ Supabase client initialized');

    // 6. Fetch Order Items - FIXED RELATIONSHIP ISSUE
    console.log('📋 Fetching order items for order_id:', record.id);
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select(`
        *,
        product:products!order_items_product_id_fkey(name, price)
      `)
      .eq('order_id', record.id);

    if (itemsError) {
      console.log('❌ Error fetching order items:', itemsError);
      throw itemsError;
    }
    console.log('✅ Order items fetched:', orderItems?.length);

    // 7. Initialize Nodemailer
    console.log('📧 Initializing email transporter...');
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
      }
    });

    // Verify transporter
    await transporter.verify();
    console.log('✅ Email transporter verified');

    // 8. Prepare and send email
    console.log('✉️ Preparing email for:', record.contact_email);
    
    // Build email items - FIXED: using the correct product relationship
    const itemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.product?.name || 'Product'} x${item.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">₹${item.price_at_purchase}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: '"Fwaeh Mart" <' + process.env.GMAIL_USER + '>',
      to: record.contact_email,
      subject: `Order Delivered! #${record.id.slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #22c55e;">🎉 Order Delivered!</h1>
          <p>Hello <strong>${record.contact_name || 'Customer'}</strong>,</p>
          <p>Great news! Your order <strong>#${record.id.slice(0, 8)}</strong> has been successfully delivered.</p>
          
          <h3>Order Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Item</th>
                <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <strong>Total Amount: ₹${record.total_amount}</strong>
          </div>
          
          <p>Thank you for shopping with Fwaeh Mart!</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      `
    };

    console.log('📤 Sending email...');
    const emailResult = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', emailResult.messageId);

    return res.status(200).json({ 
      success: true,
      message: 'Delivery email sent successfully',
      orderId: record.id
    });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    console.error('❌ Error stack:', error.stack);
    return res.status(500).json({ 
      error: error.message,
      details: 'Failed to process delivery notification'
    });
  }
}