import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead } from '../utils/notifications';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const unsubscribe = subscribeToNotifications();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const { data } = await getUserNotifications(user.id);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleMarkAsRead = async (notificationId) => {
    await markNotificationAsRead(notificationId);
    setNotifications(prev => 
       prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'order': return '📦';
      case 'stock': return '📊';
      case 'message': return '💬';
      case 'promotion': return '🎉';
      default: return '🔔';
    }
  };

  // Extract order ID from notification message if it contains one
  const extractOrderInfo = (notification) => {
    // Look for order ID pattern in message (like #abc12345)
    const orderIdMatch = notification.message?.match(/#([a-f0-9]{8})/i);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;
    
    return {
      orderId,
      // You could also extract product names here if they're included in the message
      // For now, we'll use a simplified version
      displayMessage: notification.message?.replace(/#[a-f0-9]{8}/i, '').trim()
    };
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full hover:bg-red-50 transition-all focus:outline-none"
      >
        <Bell size={20} style={{ color: '#dc2626' }} />
        {unreadCount > 0 && (
          <span 
            className="absolute -top-1 -right-1 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #ff5757 0%, #ff8282 100%)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div 
          className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 max-h-[80vh] overflow-hidden flex flex-col origin-top-right animate-scale-in"
          style={{ background: '#ffffff', border: '2px solid #fca5a5' }}
        >
          <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: '#fca5a5', background: '#fff5f5' }}>
            <h3 className="font-bold text-lg" style={{ color: '#b91c1c' }}>
              Notifications
            </h3>
            <button
              onClick={() => setShowDropdown(false)}
              className="p-1 rounded-full hover:bg-red-100 transition-colors"
            >
              <X size={18} style={{ color: '#ff5757' }} />
            </button>
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={48} className="mx-auto mb-3 opacity-20" style={{ color: '#dc2626' }} />
                <p className="text-sm font-medium" style={{ color: '#dc2626' }}>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: '#fee2e2' }}>
                {notifications.map((notification) => {
                  const { orderId, displayMessage } = extractOrderInfo(notification);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-3 transition-all hover:bg-red-50 ${!notification.read ? 'bg-red-50/60' : ''}`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-lg mt-0.5 flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0 space-y-1">
                          {/* Order ID and Title in one line */}
                          <div className="flex items-center gap-2">
                            {orderId && (
                              <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                #{orderId}
                              </span>
                            )}
                            <h4 className="font-bold text-sm truncate flex-1" style={{ color: '#b91c1c' }}>
                              {notification.title}
                            </h4>
                          </div>
                          
                         {/* Message with better formatting */}
<p className="text-xs line-clamp-3 leading-relaxed" style={{ color: '#ef4444' }}>
  {displayMessage}
</p>
                          
                          {/* Timestamp */}
                          <p className="text-[10px] font-medium opacity-70" style={{ color: '#dc2626' }}>
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                        </div>
                        {!notification.read && (
                          <button
                            onClick={() => handleMarkAsRead(notification.id)}
                            className="p-1 rounded-full hover:bg-red-100 transition-all flex-shrink-0 mt-1"
                            title="Mark as read"
                          >
                            <Check size={12} style={{ color: '#ff5757' }} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;