import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { CreditCard, Truck, CheckCircle, Lock, ArrowLeft, MapPin, Phone, Mail, User, Package, Banknote, Smartphone, Shield, Edit2, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

const Checkout = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    saveAddress: false
  });

  const [paymentMethod, setPaymentMethod] = useState('razorpay'); // 'razorpay' or 'cod'

  const { user, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchCartItems();
      // Pre-fill with profile data if available
      if (profile) {
        setShippingInfo(prev => ({
          ...prev,
          fullName: profile.full_name || '',
          email: profile.email || user.email || '',
          phone: profile.phone || '',
          address: profile.address || '',
        }));
      }
    }
  }, [user, profile]);

  const fetchCartItems = async () => {
    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select('*, products(*)')
        .eq('user_id', user.id);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        toast.error('Your cart is empty');
        navigate('/cart');
        return;
      }

      setCartItems(data);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.products.price) * item.quantity;
    }, 0);
  };

  const calculateOrderSummary = () => {
    const subtotal = calculateTotal();
    const tax = subtotal * 0.1; // 10% GST
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const total = subtotal + tax + shipping;
    
    return { subtotal, tax, shipping, total };
  };

  const validateStep1 = () => {
    if (!shippingInfo.fullName || !shippingInfo.email || !shippingInfo.phone || !shippingInfo.address || !shippingInfo.city || !shippingInfo.state || !shippingInfo.pincode) {
      toast.error('Please fill all shipping information');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(shippingInfo.email)) {
      toast.error('Please enter a valid email');
      return false;
    }

    // Phone validation (basic)
    if (shippingInfo.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleShippingChange = (e) => {
    const { name, value, type, checked } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

const handlePlaceOrder = async () => {
  if (!shippingInfo.address.trim()) {
    toast.error('Please enter a shipping address');
    return;
  }

  const orderDetails = {
    subtotal: calculateTotal(),
    shipping: calculateOrderSummary().shipping,
    tax: calculateTotal() * 0.1, // 10% tax
    total: calculateTotal() * 1.1
  };

  // Navigate to payment page instead of placing order directly
  navigate('/payment', { 
    state: { 
      orderDetails,
      cartItems,
      shippingAddress: `${shippingInfo.address}, ${shippingInfo.city}, ${shippingInfo.state} - ${shippingInfo.pincode}`,
      shippingInfo,
      paymentMethod
    } 
  });
};

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const steps = [
    { number: 1, title: 'Shipping', icon: MapPin },
    { number: 2, title: 'Payment', icon: CreditCard },
    { number: 3, title: 'Review', icon: CheckCircle }
  ];

  const { subtotal, tax, shipping, total } = calculateOrderSummary();

  return (
    <div style={{ background: 'linear-gradient(to bottom, #f3d7d7, #f9e5e5)' }} className="min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 flex justify-between items-center" style={{ background: 'rgba(255, 255, 255, 0.5)' }}>
        <h1 className="text-2xl font-bold" style={{ color: '#a94442' }}>Fwaeh Mart</h1>
        <div className="flex gap-4 items-center">
          <Lock size={20} style={{ color: '#4caf50' }} />
          <span className="font-medium text-sm" style={{ color: '#4caf50' }}>Secure Checkout</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate('/cart')}
          className="flex items-center mb-6 transition-all hover:opacity-80"
          style={{ color: '#a94442' }}
        >
          <ArrowLeft size={20} className="mr-2" />
          Back to Cart
        </button>

        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-center">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                        isCompleted ? 'shadow-lg' : isActive ? 'shadow-xl' : ''
                      }`}
                      style={{
                        background: isCompleted || isActive
                          ? 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)'
                          : 'rgba(255, 255, 255, 0.6)',
                        border: '3px solid #f8b4b4'
                      }}
                    >
                      {isCompleted ? (
                        <CheckCircle size={32} className="text-white" />
                      ) : (
                        <Icon size={28} className={isActive ? 'text-white' : ''} style={{ color: isActive ? '#fff' : '#cd5c5c' }} />
                      )}
                    </div>
                    <span
                      className={`mt-3 font-bold text-sm ${isActive ? 'text-lg' : ''}`}
                      style={{ color: isActive || isCompleted ? '#a94442' : '#cd5c5c' }}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className="w-24 h-1 mx-4"
                      style={{
                        background: currentStep > step.number
                          ? 'linear-gradient(90deg, #e57373 0%, #ef9a9a 100%)'
                          : 'rgba(205, 92, 92, 0.3)'
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div
              className="rounded-3xl p-8 shadow-xl"
              style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
            >
              {/* Step 1: Shipping Information */}
              {currentStep === 1 && (
                <div>
                  <h2 className="text-3xl font-bold mb-6" style={{ color: '#a94442' }}>
                    Shipping Information
                  </h2>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: '#a94442' }}>
                        <User size={16} className="inline mr-2" />
                        Full Name *
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        value={shippingInfo.fullName}
                        onChange={handleShippingChange}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 rounded-lg outline-none font-medium"
                        style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: '#a94442' }}>
                          <Mail size={16} className="inline mr-2" />
                          Email Address *
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={shippingInfo.email}
                          onChange={handleShippingChange}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 rounded-lg outline-none font-medium"
                          style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: '#a94442' }}>
                          <Phone size={16} className="inline mr-2" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={shippingInfo.phone}
                          onChange={handleShippingChange}
                          placeholder="+91 XXXXX XXXXX"
                          className="w-full px-4 py-3 rounded-lg outline-none font-medium"
                          style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold mb-2" style={{ color: '#a94442' }}>
                        <MapPin size={16} className="inline mr-2" />
                        Street Address *
                      </label>
                      <textarea
                        name="address"
                        value={shippingInfo.address}
                        onChange={handleShippingChange}
                        placeholder="Enter your complete street address"
                        rows="3"
                        className="w-full px-4 py-3 rounded-lg outline-none font-medium resize-none"
                        style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                      />
                    </div>

                    <div className="grid md:grid-cols-3 gap-5">
                      <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: '#a94442' }}>
                          City *
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={shippingInfo.city}
                          onChange={handleShippingChange}
                          placeholder="City"
                          className="w-full px-4 py-3 rounded-lg outline-none font-medium"
                          style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: '#a94442' }}>
                          State *
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={shippingInfo.state}
                          onChange={handleShippingChange}
                          placeholder="State"
                          className="w-full px-4 py-3 rounded-lg outline-none font-medium"
                          style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold mb-2" style={{ color: '#a94442' }}>
                          Pincode *
                        </label>
                        <input
                          type="text"
                          name="pincode"
                          value={shippingInfo.pincode}
                          onChange={handleShippingChange}
                          placeholder="000000"
                          className="w-full px-4 py-3 rounded-lg outline-none font-medium"
                          style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                        />
                      </div>
                    </div>

                    <div className="pt-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="saveAddress"
                          checked={shippingInfo.saveAddress}
                          onChange={handleShippingChange}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: '#e57373' }}
                        />
                        <span className="font-medium" style={{ color: '#a94442' }}>
                          Save this address for future orders
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Payment Method */}
              {currentStep === 2 && (
                <div>
                  <h2 className="text-3xl font-bold mb-6" style={{ color: '#a94442' }}>
                    Payment Method
                  </h2>

                  <div className="space-y-4">
                    {/* Razorpay Option */}
                    <div
                      className={`rounded-xl p-6 cursor-pointer transition-all ${
                        paymentMethod === 'razorpay' ? 'shadow-lg' : ''
                      }`}
                      style={{
                        background: paymentMethod === 'razorpay'
                          ? 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)'
                          : 'rgba(255, 255, 255, 0.6)',
                        border: paymentMethod === 'razorpay' ? '3px solid #e57373' : '2px solid #f8b4b4'
                      }}
                      onClick={() => setPaymentMethod('razorpay')}
                    >
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="razorpay"
                          checked={paymentMethod === 'razorpay'}
                          onChange={() => setPaymentMethod('razorpay')}
                          className="w-5 h-5 mt-1"
                          style={{ accentColor: '#e57373' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <CreditCard size={24} style={{ color: '#e57373' }} />
                            <span className="text-xl font-bold" style={{ color: '#a94442' }}>
                              Pay Online (Razorpay)
                            </span>
                          </div>
                          <p className="text-sm mb-4" style={{ color: '#cd5c5c' }}>
                            Pay securely using Credit/Debit Card, UPI, Net Banking, or Wallet
                          </p>
                          <div className="flex gap-3 items-center flex-wrap">
                            <div className="px-3 py-1 rounded text-xs font-bold" style={{ background: '#fff', border: '1px solid #f8b4b4', color: '#a94442' }}>
                              VISA
                            </div>
                            <div className="px-3 py-1 rounded text-xs font-bold" style={{ background: '#fff', border: '1px solid #f8b4b4', color: '#a94442' }}>
                              Mastercard
                            </div>
                            <div className="px-3 py-1 rounded text-xs font-bold" style={{ background: '#fff', border: '1px solid #f8b4b4', color: '#a94442' }}>
                              RuPay
                            </div>
                            <div className="px-3 py-1 rounded text-xs font-bold flex items-center gap-1" style={{ background: '#fff', border: '1px solid #f8b4b4', color: '#a94442' }}>
                              <Smartphone size={12} />
                              UPI
                            </div>
                            <div className="px-3 py-1 rounded text-xs font-bold" style={{ background: '#fff', border: '1px solid #f8b4b4', color: '#a94442' }}>
                              Wallets
                            </div>
                          </div>
                        </div>
                      </label>
                    </div>

                    {/* Cash on Delivery Option */}
                    <div
                      className={`rounded-xl p-6 cursor-pointer transition-all ${
                        paymentMethod === 'cod' ? 'shadow-lg' : ''
                      }`}
                      style={{
                        background: paymentMethod === 'cod'
                          ? 'linear-gradient(135deg, #fff5f5 0%, #fff 100%)'
                          : 'rgba(255, 255, 255, 0.6)',
                        border: paymentMethod === 'cod' ? '3px solid #e57373' : '2px solid #f8b4b4'
                      }}
                      onClick={() => setPaymentMethod('cod')}
                    >
                      <label className="flex items-start gap-4 cursor-pointer">
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="w-5 h-5 mt-1"
                          style={{ accentColor: '#e57373' }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <Banknote size={24} style={{ color: '#e57373' }} />
                            <span className="text-xl font-bold" style={{ color: '#a94442' }}>
                              Cash on Delivery
                            </span>
                          </div>
                          <p className="text-sm" style={{ color: '#cd5c5c' }}>
                            Pay with cash when your order is delivered to your doorstep
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-6 p-4 rounded-xl flex items-center gap-3" style={{ background: 'rgba(76, 175, 80, 0.1)', border: '2px solid rgba(76, 175, 80, 0.3)' }}>
                    <Shield size={24} style={{ color: '#4caf50' }} />
                    <div>
                      <p className="font-bold text-sm" style={{ color: '#2e7d32' }}>
                        256-bit SSL Secure Payment
                      </p>
                      <p className="text-xs" style={{ color: '#4caf50' }}>
                        Your payment information is encrypted and secure
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Order Review */}
              {currentStep === 3 && (
                <div>
                  <h2 className="text-3xl font-bold mb-6" style={{ color: '#a94442' }}>
                    Review Your Order
                  </h2>

                  <div className="space-y-6">
                    {/* Shipping Address */}
                    <div className="rounded-xl p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', border: '2px solid #f8b4b4' }}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#a94442' }}>
                          <MapPin size={20} />
                          Shipping Address
                        </h3>
                        <button
                          onClick={() => setCurrentStep(1)}
                          className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                          style={{ color: '#e57373' }}
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                      </div>
                      <div style={{ color: '#cd5c5c' }}>
                        <p className="font-bold mb-1">{shippingInfo.fullName}</p>
                        <p>{shippingInfo.address}</p>
                        <p>{shippingInfo.city}, {shippingInfo.state} - {shippingInfo.pincode}</p>
                        <p className="mt-2">
                          <Phone size={14} className="inline mr-1" />
                          {shippingInfo.phone}
                        </p>
                        <p>
                          <Mail size={14} className="inline mr-1" />
                          {shippingInfo.email}
                        </p>
                      </div>
                    </div>

                    {/* Payment Method */}
                    <div className="rounded-xl p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', border: '2px solid #f8b4b4' }}>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#a94442' }}>
                          <CreditCard size={20} />
                          Payment Method
                        </h3>
                        <button
                          onClick={() => setCurrentStep(2)}
                          className="flex items-center gap-2 text-sm font-medium transition-all hover:opacity-80"
                          style={{ color: '#e57373' }}
                        >
                          <Edit2 size={16} />
                          Edit
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        {paymentMethod === 'razorpay' ? (
                          <>
                            <CreditCard size={24} style={{ color: '#e57373' }} />
                            <span className="font-bold" style={{ color: '#a94442' }}>Pay Online (Razorpay)</span>
                          </>
                        ) : (
                          <>
                            <Banknote size={24} style={{ color: '#e57373' }} />
                            <span className="font-bold" style={{ color: '#a94442' }}>Cash on Delivery</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="rounded-xl p-6" style={{ background: 'rgba(255, 255, 255, 0.6)', border: '2px solid #f8b4b4' }}>
                      <h3 className="text-lg font-bold flex items-center gap-2 mb-4" style={{ color: '#a94442' }}>
                        <Package size={20} />
                        Order Items ({cartItems.length})
                      </h3>
                      <div className="space-y-3">
                        {cartItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f8b4b4' }}>
                            <div className="flex items-center gap-3">
                              <img
                                src={item.products.image_url || 'https://images.pexels.com/photos/4483610/pexels-photo-4483610.jpeg?auto=compress&cs=tinysrgb&w=100'}
                                alt={item.products.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                              <div>
                                <p className="font-bold" style={{ color: '#a94442' }}>{item.products.name}</p>
                                <p className="text-sm" style={{ color: '#cd5c5c' }}>Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <p className="font-bold" style={{ color: '#e57373' }}>₹{(parseFloat(item.products.price) * item.quantity).toFixed(2)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex gap-4 mt-8">
                {currentStep > 1 && (
                  <button
                    onClick={handleBack}
                    className="flex-1 py-4 rounded-xl font-bold transition-all hover:opacity-80 flex items-center justify-center gap-2"
                    style={{ background: 'rgba(255, 255, 255, 0.9)', color: '#a94442', border: '2px solid #f8b4b4' }}
                  >
                    <ArrowLeft size={20} />
                    Back
                  </button>
                )}
                {currentStep < 3 ? (
                  <button
                    onClick={handleNext}
                    className="flex-1 py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    style={{ background: 'linear-gradient(135deg, #e57373 0%, #ef9a9a 100%)' }}
                  >
                    Continue
                    <ArrowRight size={20} />
                  </button>
                ) : (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    className="flex-1 py-5 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)' }}
                  >
                    {placing ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                        Placing Order...
                      </span>
                    ) : (
                      <>
                        <Lock size={24} />
                        Place Order - ₹{total.toFixed(2)}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div
              className="rounded-3xl p-8 sticky top-6 shadow-xl"
              style={{ background: 'rgba(255, 255, 255, 0.8)', border: '2px solid #f8b4b4' }}
            >
              <h3 className="text-2xl font-bold mb-6" style={{ color: '#a94442' }}>
                Order Summary
              </h3>

              {/* Price Breakdown */}
              <div className="space-y-4 mb-6 pb-6" style={{ borderBottom: '2px solid #f8b4b4' }}>
                <div className="flex justify-between" style={{ color: '#cd5c5c' }}>
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-bold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: '#cd5c5c' }}>
                  <span>Shipping</span>
                  <span className="font-bold">{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between" style={{ color: '#cd5c5c' }}>
                  <span>Tax (GST 10%)</span>
                  <span className="font-bold">₹{tax.toFixed(2)}</span>
                </div>
              </div>

              {/* Total */}
              <div className="mb-6 py-6" style={{ borderBottom: '2px solid #f8b4b4' }}>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold" style={{ color: '#a94442' }}>Total Amount</span>
                  <span className="text-2xl font-bold" style={{ color: '#e57373' }}>
                    ₹{total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Security Badges */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>
                  <Lock size={20} style={{ color: '#4caf50' }} />
                  <span className="text-sm font-medium" style={{ color: '#2e7d32' }}>
                    Secure Checkout
                  </span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>
                  <Shield size={20} style={{ color: '#4caf50' }} />
                  <span className="text-sm font-medium" style={{ color: '#2e7d32' }}>
                    256-bit SSL Encryption
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="mt-6 pt-6" style={{ borderTop: '2px solid #f8b4b4' }}>
                <h4 className="text-sm font-bold mb-4" style={{ color: '#a94442' }}>
                  ITEMS IN YOUR ORDER
                </h4>
                <div className="space-y-2">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between text-sm" style={{ color: '#cd5c5c' }}>
                      <span>{item.products.name} × {item.quantity}</span>
                      <span className="font-bold">₹{(parseFloat(item.products.price) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;