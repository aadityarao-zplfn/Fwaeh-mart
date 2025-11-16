// src/lib/supabase.jsx

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_CONFIG, validateConfig } from '../config/supabase.config';

// ✅ Validate configuration on import
validateConfig();

// ✅ Custom fetch with timeout
const fetchWithTimeout = (url, options = {}) => {
  const timeout = 8000; // 8 second timeout
  
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout after 8 seconds')), timeout)
    )
  ]);
};

// ✅ Create Supabase client with proper configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    ...AUTH_CONFIG,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    fetch: fetchWithTimeout,
    headers: {
      'x-application-name': 'fwaeh-mart',
    },
  },
});

// ✅ Session recovery utility
export const recoverSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    
    if (session) {
      // Refresh the session
      const { data: { user }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) throw refreshError;
      return user;
    }
    return null;
  } catch (error) {
    console.error('Session recovery failed:', error);
    await supabase.auth.signOut();
    return null;
  }
};

// ✅ Export config for debugging
export { SUPABASE_URL, SUPABASE_ANON_KEY };