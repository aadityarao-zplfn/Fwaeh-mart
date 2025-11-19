import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { isUserOTPVerified } from '../utils/otpService'; // 🆕 ADD THIS IMPORT

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Add this at the top of AuthProvider
  const fetchingProfile = useRef(false); // Prevent duplicate fetches

  useEffect(() => {
    // Initialize auth
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        setUser(session?.user ?? null);
        if (session?.user && !fetchingProfile.current) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event);
        
        setUser(session?.user ?? null);
        
        if (session?.user && !fetchingProfile.current) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array - only run once!

  const fetchProfile = async (userId) => {
    if (fetchingProfile.current) {
      console.log('⏭️ Skipping duplicate fetch');
      return;
    }
    
    fetchingProfile.current = true;
    setError(null);
    console.log('🔄 Fetching profile for:', userId);
    
    const startTime = Date.now();
    console.log('🔄 Fetching profile for:', userId);

    try {
      // ADD TIMEOUT
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 30000)
      );
      
      const fetchPromise = supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', userId)
        .maybeSingle();
  
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
  
      console.log(`⏱️ Fetch time: ${Date.now() - startTime}ms`);
      console.log('📦 Profile data:', data, 'Error:', error);
  
      if (error) throw error;
      
      setProfile(data);
      console.log('✅ Profile set successfully');
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);

      if (retries > 0) {
      console.log(`🔄 Retrying fetchProfile... (${retries} retries left)`);
      await fetchProfile(userId, retries - 1); // Retry the fetch
    } else {
      setProfile(null);
      setError(error.message || 'Failed to fetch profile');
    }
    } finally {
      setLoading(false);
      fetchingProfile.current = false;
      console.log('🏁 Fetch complete');
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // 🆕 ADD OTP VERIFICATION CHECK (SAME AS Login.jsx)
      if (data.user) {
        const isVerified = await isUserOTPVerified(data.user.id);
        if (!isVerified) {
          throw new Error('Please complete OTP verification before signing in. Check your email for the verification code.');
        }
        await fetchProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  const resendConfirmationEmail = async (email) => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        }
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      fetchingProfile.current = false;
      
      window.localStorage.removeItem('fwaeh-mart-auth');
      
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    error,
    signIn,
    signOut,
    resendConfirmationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};