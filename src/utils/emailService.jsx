// src/utils/emailService.jsx
/*import toast from 'react-hot-toast';

export const sendDeliveryEmail = async (order, orderItems = []) => {
  try {
    console.log('📧 Starting email service...');
    console.log('📨 To:', order.contact_email);
    console.log('🆔 Order ID:', order.id);

    // Prepare simple item list for email
    const itemsPayload = orderItems.map(item => ({
      name: item.products?.name || 'Product',
      quantity: item.quantity,
      price: item.price_at_purchase || item.products?.price
    }));

    const payload = {
      orderId: order.id,
      customerEmail: order.contact_email,
      customerName: order.contact_name || 'Valued Customer',
      totalAmount: order.total_amount,
      items: itemsPayload
    };

    console.log('📦 Email payload:', payload);

    const response = await fetch('/api/send-delivery-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 API Response status:', response.status);
    
    const result = await response.json();
    console.log('📡 API Response data:', result);

    if (!response.ok) {
      throw new Error(result.error || `HTTP ${response.status}`);
    }
    
    console.log('✅ Email sent successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Email service error:', error);
    return { success: false, error: error.message };
  }
};*/
