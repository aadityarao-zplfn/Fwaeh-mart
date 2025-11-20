import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { isUserOTPVerified } from '../utils/otpService';

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
  const [error, setError] = useState(null);
  const initialized = useRef(false);

  // SIMPLIFIED: One-time auth initialization
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    console.log('🚀 Initializing auth...');

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('👤 Initial session:', session?.user?.id);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes - SIMPLIFIED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔑 Auth event:', event);
        
        // Only process meaningful events
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null);
          
          if (session?.user) {
            await fetchProfile(session.user.id);
          } else {
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // SIMPLIFIED: Fetch profile without retries or emergency fallbacks
  const fetchProfile = async (userId) => {
    try {
      console.log('📞 Fetching profile for:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Profile fetch error:', error);
        return;
      }
      
      if (data) {
        console.log('✅ Profile found:', data);
        setProfile(data);
      } else {
        console.log('⚠️ No profile found');
        // Create profile immediately without fallbacks
        await createProfile(userId);
      }
    } catch (error) {
      console.error('❌ Unexpected error:', error);
    } finally {
      setLoading(false);
    }
  };

  // SIMPLIFIED: Create profile
  const createProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId, 
            role: 'retailer',
            full_name: user?.email?.split('@')[0] || 'User',
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Profile created:', data);
      setProfile(data);
    } catch (error) {
      console.error('❌ Failed to create profile:', error);
      // Set a basic profile to allow app to function
      setProfile({
        id: userId,
        role: 'retailer',
        full_name: user?.email?.split('@')[0] || 'User'
      });
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const isVerified = await isUserOTPVerified(data.user.id);
        if (!isVerified) {
          throw new Error('Please complete OTP verification before signing in.');
        }
        // Profile will be fetched via auth state change
      }

      return { data, error: null };
    } catch (error) {
      setLoading(false);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setLoading(false);
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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
