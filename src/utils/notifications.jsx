import { supabase } from '../lib/supabase';

// Fetch all notifications for a user
export const getUserNotifications = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50); // Limit to last 50 notifications

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { data: [], error: error.message };
  }
};

// Mark a single notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { error: error.message };
  }
};

// (Optional) Helper to create a notification (for testing or backend logic)
export const createNotification = async (userId, title, message, type = 'system') => {
  const { error } = await supabase
    .from('notifications')
    .insert([{ user_id: userId, title, message, type }]);
  return { error };
};