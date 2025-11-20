import { supabase } from '../lib/supabase';

const otpStore = new Map();

export const generateAndSendOTP = async (email, userId = null) => {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    
    otpStore.set(email, { otp, expiresAt, userId });
    
    // Create/update verification record if userId provided
    // Initialize as false for new OTP requests
    if (userId) {
      const { error } = await supabase
        .from('user_verification')
        .upsert({
          user_id: userId,
          otp_verified: false,
          otp_attempts: 0,
          last_otp_sent: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error creating verification record:', error);
      }
    }
    
    // 🆕 BACKEND API CALL FOR EMAIL
    try {
      console.log('📧 Sending OTP via backend API to:', email);
      
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          otp: otp
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Email service failed');
      }

      console.log('✅ OTP sent successfully via backend to:', email);
      
    } catch (emailError) {
      console.error('❌ Backend email failed, falling back to console:', emailError);
      // Fallback to console log
      console.log('🔐 ========== OTP FOR DEVELOPMENT ==========');
      console.log('📧 Email:', email);
      console.log('🔢 OTP Code:', otp);
      console.log('⏰ Expires in: 10 minutes');
      console.log('🔐 ======================================');
    }
    
    // Auto-cleanup
    setTimeout(() => {
      if (otpStore.get(email)?.otp === otp) {
        otpStore.delete(email);
      }
    }, 10 * 60 * 1000);
    
    return { success: true, otp };
  } catch (error) {
    console.error('OTP generation error:', error);
    return { success: false, error: error.message };
  }
};

export const verifyCustomOTP = async (email, code, userId = null) => {
  try {
    console.log('🔍 Looking for OTP for email:', email);
    
    const stored = otpStore.get(email);
    
    if (!stored) {
      console.log('❌ OTP not found in store for email:', email);
      return { valid: false, error: 'OTP not found. Please request a new one.' };
    }
    
    console.log('✅ OTP found:', stored);
    
    if (Date.now() > stored.expiresAt) {
      console.log('❌ OTP expired');
      otpStore.delete(email);
      return { valid: false, error: 'OTP expired. Please request a new one.' };
    }
    
    console.log('🔢 Comparing codes - Entered:', code, 'Stored:', stored.otp);
    
    if (stored.otp !== code) {
      console.log('❌ OTP mismatch');
      // Track failed attempts
      if (userId) {
        await supabase
          .from('user_verification')
          .update({ 
            otp_attempts: () => 'otp_attempts + 1'
          })
          .eq('user_id', userId);
      }
      return { valid: false, error: 'Invalid OTP code. Please try again.' };
    }
    
    console.log('✅ OTP valid!');
    
    // ✅ OTP valid - mark as verified in database
    if (userId) {
      const success = await markUserAsVerified(userId);

      if (!success) {
        return { valid: false, error: 'Verification database update failed.' };
      }
    }
    
    otpStore.delete(email);
    return { valid: true };
  } catch (error) {
    console.error('OTP verification error:', error);
    return { valid: false, error: 'Verification failed. Please try again.' };
  }
};

// ✅ NEW HELPER: Force mark a user as verified (Used for Google login & Migration)
export const markUserAsVerified = async (userId) => {
  try {
    const { error } = await supabase
      .from('user_verification')
      .upsert({ 
        user_id: userId,
        otp_verified: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking user verified:', error);
    return false;
  }
};

// Check if user is OTP verified
// Returns: true (verified), false (unverified), or null (no record/migration needed)
export const isUserOTPVerified = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('user_verification')
      .select('otp_verified')
      .eq('user_id', userId)
      .maybeSingle(); // Use maybeSingle to return null if no row exists
    
    if (error) {
      console.error('Error checking OTP verification:', error);
      return false;
    }
    
    // If no data exists, return null to indicate "Legacy User" status
    if (!data) return null;
    
    return data.otp_verified;
  } catch (error) {
    console.error('Error in isUserOTPVerified:', error);
    return false;
  }
};

export const debugOtpStore = () => {
  console.log('🔍 OTP Store Debug:');
  console.log('Size:', otpStore.size);
  console.log('Entries:', Array.from(otpStore.entries()));
  return Array.from(otpStore.entries());
};
