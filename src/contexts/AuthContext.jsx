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

    const initAuth = async () => {
      try {
        console.log('🔍 Checking session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          // Clear potentially corrupted session
          await supabase.auth.signOut();
          localStorage.clear();
          sessionStorage.clear();
          setLoading(false);
          return;
        }

        console.log('👤 Session found:', session?.user?.id);
        
        if (session) {
          // Validate the token is still good
          console.log('🔐 Validating user token...');
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError || !user) {
            console.error('❌ Token invalid:', userError);
            await supabase.auth.signOut();
            localStorage.clear();
            sessionStorage.clear();
            setLoading(false);
            return;
          }
          
          console.log('✅ Token valid, setting user');
          setUser(user);
          await fetchProfile(user.id);
        } else {
          console.log('👤 No session found');
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes - SIMPLIFIED
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔑 Auth event:', event);
        
        // Clear errors on new auth events
        setError(null);
        
        if (event === 'SIGNED_IN') {
          console.log('✅ SIGNED_IN event, setting user');
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 SIGNED_OUT event, clearing everything');
          setUser(null);
          setProfile(null);
          setLoading(false);
        } else if (event === 'USER_UPDATED') {
          console.log('🔄 USER_UPDATED event');
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId) => {
    try {
      console.log('📞 Fetching profile for:', userId);
      
      // 1. CHECK CACHE FIRST (INSTANT)
      const cacheKey = `profile_${userId}`;
      const cachedProfile = localStorage.getItem(cacheKey);
      
      if (cachedProfile) {
        console.log('✅ Using cached profile');
        const profileData = JSON.parse(cachedProfile);
        setProfile(profileData);
        setLoading(false);
        return; // Exit early - we got the profile!
      }
      
      console.log('🔄 No cache found, fetching from Supabase...');
      
      // 2. FETCH FROM SUPABASE WITH TIMEOUT
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout after 15s')), 15000)
      );
  
      const fetchPromise = supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', userId)
        .single(); // Changed to single() for faster response
  
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
  
      if (error) {
        console.error('❌ Profile fetch error:', error);
        throw error;
      }
      
      if (data) {
        console.log('✅ Profile found, caching result:', data);
        
        // 3. CACHE THE RESULT FOR FUTURE VISITS
        localStorage.setItem(cacheKey, JSON.stringify(data));
        setProfile(data);
      } else {
        console.log('⚠️ No profile found, creating...');
        await createProfile(userId);
      }
    } catch (error) {
      console.error('💥 Profile fetch failed:', error);
      
      // 4. FALLBACK: Try to use any existing cached data as last resort
      const cacheKey = `profile_${userId}`;
      const fallbackProfile = localStorage.getItem(cacheKey);
      
      if (fallbackProfile) {
        console.log('🔄 Using fallback cached profile');
        setProfile(JSON.parse(fallbackProfile));
      } else {
        setError('Profile loading... please wait');
        // Don't set emergency profile - let it keep trying
      }
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
      setError(null);
      
      console.log('🔐 Attempting sign in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        console.log('✅ Sign in successful, checking OTP...');
        const isVerified = await isUserOTPVerified(data.user.id);
        if (!isVerified) {
          throw new Error('Please complete OTP verification before signing in.');
        }
        // Profile will be fetched via auth state change
      }

      return { data, error: null };
    } catch (error) {
      console.error('❌ Sign in error:', error);
      setError(error.message);
      setLoading(false);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting sign out process...');
      
      // Clear ALL storage including profile cache
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('🗑️ Storage cleared, signing out from Supabase...');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear all state
      setUser(null);
      setProfile(null);
      setLoading(false);
      setError(null);
      
      console.log('✅ Sign out successful, forcing page reload...');
      window.location.href = '/';
      
    } catch (error) {
      console.error('❌ Error signing out:', error);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/';
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
