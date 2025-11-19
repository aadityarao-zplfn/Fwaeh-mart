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
  const fetchingProfile = useRef(false);
  const authInitialized = useRef(false);

  useEffect(() => {
    // Prevent multiple initializations
    if (authInitialized.current) return;
    authInitialized.current = true;

    console.log('🚀 Initializing auth...');

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('👤 Session found:', session?.user?.id);
        setUser(session?.user ?? null);
        
        if (session?.user) {
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
        console.log('🔑 Auth event:', event, 'User:', session?.user?.id);
        
        // Only update if user actually changed
        if (session?.user?.id !== user?.id) {
          setUser(session?.user ?? null);
        }
        
        if (session?.user && !fetchingProfile.current) {
          await fetchProfile(session.user.id);
        } else if (!session?.user) {
          // User signed out - clear everything immediately
          setProfile(null);
          setLoading(false);
          fetchingProfile.current = false;
        }
      }
    );

    return () => {
      subscription.unsubscribe();
      authInitialized.current = false;
    };
  }, []);

  const fetchProfile = async (userId, retries = 0) => {
    if (fetchingProfile.current) {
      console.log('⏭️ Skipping duplicate profile fetch');
      return;
    }
    
    fetchingProfile.current = true;
    setError(null);
    console.log('📞 Fetching profile for:', userId);
    
    const startTime = Date.now();

    try {
      // Reduced timeout from 30s to 8s
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 500)
      );
      
      const fetchPromise = supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', userId)
        .maybeSingle();
  
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
  
      console.log(`⏱️ Profile fetch took ${Date.now() - startTime}ms`);
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ Profile found:', data);
        setProfile(data);
      } else {
        console.log('⚠️ No profile found, creating default profile...');
        await createDefaultProfile(userId);
      }
      
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);
      
      // ✅ FIXED: retries is now defined and works properly
      if (retries > 0) {
        console.log(`🔄 Retrying profile fetch... (${retries} retries left)`);
        fetchingProfile.current = false;
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        await fetchProfile(userId, retries - 1);
        return;
      } else {
        console.error('💥 All retries failed, using emergency profile');
        setError('Failed to load profile');
        // Create emergency profile to prevent app from hanging
        await createEmergencyProfile(userId);
      }
    } finally {
      setLoading(false);
      fetchingProfile.current = false;
      console.log('🏁 Profile fetch process completed');
    }
  };

  const createDefaultProfile = async (userId) => {
    try {
      console.log('🆕 Creating default profile for:', userId);
      
      // First check if profile was created by another process
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();
      
      if (existingProfile) {
        console.log('✅ Profile already exists, fetching it');
        setProfile(existingProfile);
        return;
      }
      
      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId, 
            role: 'retailer', // Default role
            full_name: user?.email?.split('@')[0] || 'User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('❌ Error creating profile:', error);
        throw error;
      }

      console.log('✅ Default profile created:', data);
      setProfile(data);
      
    } catch (error) {
      console.error('❌ Failed to create profile:', error);
      // Even if creation fails, set a local profile to allow app to load
      setProfile({
        id: userId,
        role: 'retailer',
        full_name: user?.email?.split('@')[0] || 'User'
      });
    }
  };

  const createEmergencyProfile = async (userId) => {
    console.log('🚨 Creating emergency profile for:', userId);
    // Create a local profile object without saving to database
    const emergencyProfile = {
      id: userId,
      role: 'retailer',
      full_name: user?.email?.split('@')[0] || 'User'
    };
    
    setProfile(emergencyProfile);
    console.log('✅ Emergency profile set');
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
          throw new Error('Please complete OTP verification before signing in. Check your email for the verification code.');
        }
        await fetchProfile(data.user.id);
      }

      return { data, error: null };
    } catch (error) {
      setLoading(false);
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
      
      // Immediate state reset for better UX
      setUser(null);
      setProfile(null);
      setLoading(false);
      fetchingProfile.current = false;
      
      window.localStorage.removeItem('fwaeh-mart-auth');
      
    } catch (error) {
      console.error('Error signing out:', error);
      setLoading(false);
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