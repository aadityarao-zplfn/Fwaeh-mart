import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // 1. Security: Ensure this is a POST request
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Extract data from Supabase Webhook payload
  // Supabase sends: { type: 'UPDATE', table: 'orders', record: { ... }, old_record: { ... } }
  const { record, old_record } = req.body;

  console.log('🔔 Webhook received for Order:', record?.id);

  // 3. Guard Clause: Only run if status CHANGED to 'delivered'
  // This prevents duplicate emails if you update other fields later
  if (record.status !== 'delivered' || old_record.status === 'delivered') {
    console.log('Skipping: Status is not new delivery');
    return res.status(200).json({ message: 'Status change ignored' });
  }

  try {
    // 4. Initialize Supabase Admin Client
    // We need SERVICE_ROLE_KEY to bypass RLS and fetch user details/items reliably
    const supabaseAdmin = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY // You must add this to Vercel Env Vars
    );

    // 5. Fetch Order Items (Data missing from the webhook payload)
    const { data: orderItems, error: itemsError } = await supabaseAdmin
      .from('order_items')
      .select('*, products(name, price)')
      .eq('order_id', record.id);

    if (itemsError) throw itemsError;

    // 6. Prepare Email (Reusing your nodemailer logic)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER, // Use Env Vars!
        pass: process.env.GMAIL_PASS
      }
    });

    const itemsHtml = orderItems.map(item => `
      <tr>
        <td style="padding: 8px;">${item.products?.name || 'Product'} x${item.quantity}</td>
        <td style="padding: 8px;">₹${item.price_at_purchase}</td>
      </tr>
    `).join('');

    await transporter.sendMail({
      from: '"Fwaeh Mart" <' + process.env.GMAIL_USER + '>',
      to: record.contact_email,
      subject: `Order Delivered! #${record.id.slice(0, 8)}`,
      html: `
        <h1>Order Delivered!</h1>
        <p>Hello ${record.contact_name || 'Customer'}, your order has been delivered.</p>
        <table border="1" style="border-collapse: collapse;">${itemsHtml}</table>
        <p>Total: ₹${record.total_amount}</p>
      `
    });

    console.log('✅ Email sent via Webhook');
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Webhook Error:', error);
    return res.status(500).json({ error: error.message });
  }
}