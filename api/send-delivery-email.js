// api/send-delivery-email.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, customerEmail, customerName, totalAmount, items } = req.body;

    if (!customerEmail || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Reuse your existing transporter config
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'fwaehmart@gmail.com',
        pass: 'oemlzmavkqlebqxl'
      }
    });

    // Generate Item Rows for HTML
    const itemsHtml = items.map(item => `
      <tr style="border-bottom: 1px solid #ffe5e5;">
        <td style="padding: 12px; color: #555;">${item.name} <span style="color: #999; font-size: 12px;">x${item.quantity}</span></td>
        <td style="padding: 12px; text-align: right; color: #b91c1c; font-weight: bold;">₹${item.price}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: '"Fwaeh Mart" <fwaehmart@gmail.com>',
      to: customerEmail,
      subject: `Order Delivered! #${orderId.slice(0, 8)} - Fwaeh Mart`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff0f3; border-radius: 20px; overflow: hidden;">
          
          <div style="background: linear-gradient(135deg, #ff5757 0%, #ff8282 100%); padding: 40px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; margin-bottom: 10px;">Order Delivered! 🎉</h1>
            <p style="margin: 0; opacity: 0.9;">Hi ${customerName || 'Customer'}, your package has arrived safely.</p>
          </div>

          <div style="padding: 30px;">
            <div style="background: white; border-radius: 15px; padding: 25px; box-shadow: 0 4px 15px rgba(255, 87, 87, 0.1);">
              <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #fca5a5; padding-bottom: 10px;">
                <span style="color: #b91c1c; font-weight: bold;">Order ID</span>
                <span style="color: #666;">#${orderId.slice(0, 8)}</span>
              </div>

              <table style="width: 100%; border-collapse: collapse;">
                ${itemsHtml}
              </table>

              <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #fca5a5; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 16px; color: #b91c1c; font-weight: bold;">Total Paid</span>
                <span style="font-size: 24px; color: #ff5757; font-weight: bold;">₹${totalAmount}</span>
              </div>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <a href="https://fwaeh-mart.vercel.app/orders" style="background-color: #ff5757; color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">View Order Details</a>
            </div>
            
            <p style="text-align: center; color: #999; font-size: 12px; margin-top: 30px;">
              If you have any issues with this order, please contact support via the dashboard.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Delivery email sent to:', customerEmail);
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error('❌ Email API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}