import { useLocation, useNavigate } from 'react-router-dom';
import { Calendar, CheckCircle, Package, ArrowRight, Clock, MapPin, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const PickupSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { order, pickupTime } = state || {};

  // Handle case where user navigates directly without state
  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#fff0f3' }}>
        <p className="text-red-500 mb-4">Order details not found.</p>
        <button onClick={() => navigate('/orders')} className="text-blue-600 underline">
          Go to My Orders
        </button>
      </div>
    );
  }

  // Function to generate Google Calendar Link
  const addToGoogleCalendar = () => {
    const time = pickupTime || order.scheduled_at;
    if (!time) return;

    const startDate = new Date(time);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 30 min duration

    const formatGoogleDate = (date) => date.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const details = {
      action: 'TEMPLATE',
      text: `Pickup Order #${order.id.slice(0,8)} - Fwaeh Mart`,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: `Pickup items for Order #${order.id}. Total Amount: ₹${order.total_amount}`,
      location: 'Fwaeh Mart Store, Secunderabad',
    };

    const queryString = new URLSearchParams(details).toString();
    window.open(`https://calendar.google.com/calendar/render?${queryString}`, '_blank');
  };

  // Generate .ics file for other calendar apps
  const downloadICalendar = () => {
    const time = pickupTime || order.scheduled_at;
    if (!time) return;
    
    const startDate = new Date(time);
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:Pickup Order #${order.id.slice(0,8)} - Fwaeh Mart`,
      `DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DESCRIPTION:Pickup your order from Fwaeh Mart. Order ID: ${order.id}. Total Amount: ₹${order.total_amount}`,
      `LOCATION:Fwaeh Mart Store, Secunderabad, Telangana 500003`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pickup-${order.id.slice(0,8)}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Consumer Confirmation Logic
  const handleConfirmPickup = async () => {
    if(!confirm("Please confirm only if you have physically collected your items.")) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
            status: 'delivered', // ✅ Changed to 'delivered' to match tracking logic
            pickup_status: 'completed' 
        })
        .eq('id', order.id);

      if (error) throw error;
      
      toast.success("Pickup confirmed! Order marked as Delivered.");
      
      // ✅ Redirect to Browse Products
      navigate('/products'); 
      
    } catch (error) {
      console.error('Error:', error);
      toast.error("Update failed: " + error.message);
    }
  };

  const displayTime = pickupTime || order.scheduled_at;
  const isCompleted = order.status === 'delivered' || order.pickup_status === 'completed';

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#fff0f3' }}>
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-pink-100 text-center">
        
        {/* Dynamic Header based on status */}
        {isCompleted ? (
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <CheckCircle className="text-green-600" size={40} />
           </div>
        ) : (
           <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
             <Clock className="text-orange-600" size={40} />
           </div>
        )}

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isCompleted ? 'Pickup Completed' : 'Pickup Scheduled!'}
        </h1>
        <p className="text-gray-500 mb-6">Order ID: <span className="font-mono text-gray-700">{order.id.slice(0, 8)}</span></p>

        {displayTime && (
          <div className="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-100">
            <p className="text-sm text-blue-600 font-bold uppercase mb-1">Your Slot</p>
            <p className="text-xl font-bold text-blue-900">
              {new Date(displayTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        )}

        {/* Store Location */}
        <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200">
          <div className="flex items-start gap-3">
            <MapPin className="text-red-500 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-semibold text-gray-800 text-sm">Fwaeh Mart Main Store</p>
              <p className="text-xs text-gray-600">Secunderabad, Telangana 500003</p>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-yellow-50 p-3 rounded-lg mb-6 border border-yellow-200">
          <p className="text-sm text-yellow-800 text-center font-medium">
            Total to Pay at Store: <span className="text-lg font-bold">₹{order.total_amount}</span>
          </p>
        </div>

        <div className="space-y-3">
          {!isCompleted && (
            <>
              {/* GOOGLE CALENDAR INTEGRATION */}
              <button
                onClick={addToGoogleCalendar}
                className="w-full py-3 bg-white border-2 border-blue-200 text-blue-700 rounded-xl font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={20} />
                Add to Google Calendar
              </button>

              {/* iCAL DOWNLOAD */}
              <button
                onClick={downloadICalendar}
                className="w-full py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-xl font-bold hover:bg-purple-50 transition-all flex items-center justify-center gap-2 text-sm"
              >
                <Package size={18} />
                Download Calendar File
              </button>

              {/* CUSTOMER CONFIRMATION BUTTON */}
              <button
                onClick={handleConfirmPickup}
                className="w-full py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle size={20} />
                I Have Picked Up My Order
              </button>
            </>
          )}

          <button
            onClick={() => navigate('/products')}
            className="w-full py-3 text-gray-500 font-medium hover:text-gray-700 flex items-center justify-center gap-2"
          >
            <ShoppingBag size={18} />
            Browse More Products
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Bring your order ID and payment method to the store. 
            Please arrive within your scheduled 30-minute window.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PickupSuccess;