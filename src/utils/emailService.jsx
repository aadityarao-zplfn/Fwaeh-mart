// src/utils/emailService.jsx
import toast from 'react-hot-toast';

export const sendDeliveryEmail = async (order, orderItems = []) => {
  try {
    // Prepare simple item list for email
    const itemsPayload = orderItems.map(item => ({
      name: item.products?.name || 'Product',
      quantity: item.quantity,
      price: item.price_at_purchase || item.products?.price
    }));

    const payload = {
      orderId: order.id,
      customerEmail: order.contact_email, // Fetched from orders table
      customerName: order.contact_name || 'Valued Customer',
      totalAmount: order.total_amount,
      items: itemsPayload
    };

    console.log('📧 Triggering delivery email:', payload);

    const response = await fetch('/api/send-delivery-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Failed to send email');
    
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    // Don't block UI flow if email fails, just log it
    return { success: false, error: error.message };
  }
};