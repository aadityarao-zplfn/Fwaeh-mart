export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initiatePayment = async (orderDetails, onSuccess, onFailure) => {
  const res = await loadRazorpay();

  if (!res) {
    alert('Razorpay SDK failed to load');
    return;
  }

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,
    amount: Math.round(orderDetails.total * 100), // Convert to paise
    currency: 'INR',
    name: 'Fwaeh Mart',
    description: 'Order Payment',
  //  image: '/logo.png', // Your logo
    handler: function (response) {
      onSuccess(response);
    },
    prefill: {
      name: orderDetails.userName,
      email: orderDetails.userEmail,
      contact: orderDetails.userPhone
    },
    theme: {
      color: '#ff5757'
    },
    modal: {
      ondismiss: function() {
        onFailure({ message: 'Payment cancelled by user' });
      }
    }
  };

  const razorpay = new window.Razorpay(options);
  razorpay.open();
};