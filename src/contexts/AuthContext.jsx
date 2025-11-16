import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';

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
    console.log('🔄 Fetching profile for:', userId);
    
    try {
      // ADD TIMEOUT
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile fetch timeout')), 5000)
      );
      
      const fetchPromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
  
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]);
  
      console.log('📦 Profile data:', data, 'Error:', error);
  
      if (error) throw error;
      
      setProfile(data);
      console.log('✅ Profile set successfully');
    } catch (error) {
      console.error('❌ Error in fetchProfile:', error);
      setProfile(null);
    } finally {
      setLoading(false);
      fetchingProfile.current = false;
      console.log('🏁 Fetch complete');
    }
  };

  const signUp = async (email, password, fullName, role) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (authError) throw authError;

      if (authData.user && !authData.session) {
        return { 
          data: authData, 
          error: null,
          needsEmailConfirmation: true 
        };
      }

      if (authData.user) {
        await fetchProfile(authData.user.id);
      }

      return { data: authData, error: null, needsEmailConfirmation: false };
    } catch (error) {
      return { data: null, error, needsEmailConfirmation: false };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user && !data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        return { 
          data: null, 
          error: { message: 'Please verify your email before signing in.' }
        };
      }

      if (data.user) {
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
    signUp,
    signIn,
    signOut,
    resendConfirmationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};