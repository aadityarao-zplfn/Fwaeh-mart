// src/config/supabase.config.js

/**
 * Supabase Configuration
 * This file handles environment variables with proper validation
 */

// ✅ Get environment variables with fallback
const getEnvVar = (key, fallback = null) => {
  const value = import.meta.env[key];
  
  if (!value && !fallback) {
    console.error(`❌ Missing environment variable: ${key}`);
    console.error('Please add it to your hosting platform:');
    console.error(`- Vercel: Settings → Environment Variables`);
    console.error(`- Netlify: Site settings → Environment variables`);
  }
  
  return value || fallback;
};

// ✅ Your Supabase credentials (these are safe to expose - they're public keys)
export const SUPABASE_URL = getEnvVar(
  'VITE_SUPABASE_URL',
  'https://mvuwnsfsfucyamiwzlnk.supabase.co'
);

export const SUPABASE_ANON_KEY = getEnvVar(
  'VITE_SUPABASE_ANON_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dXduc2ZzZnVjeWFtaXd6bG5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3OTc3MjQsImV4cCI6MjA3NzM3MzcyNH0.URtGEhNUAfEnKnxi8JolJg7sEZ1IMXjQA-eWPsHplwU'
);

// ✅ Validate the configuration
export const validateConfig = () => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      '🚨 Supabase configuration is incomplete. Please check your environment variables.'
    );
  }

  // Validate URL format
  try {
    new URL(SUPABASE_URL);
  } catch (e) {
    throw new Error(`🚨 Invalid SUPABASE_URL: ${SUPABASE_URL}`);
  }

  console.log('✅ Supabase configuration loaded successfully');
  console.log('📍 URL:', SUPABASE_URL);
};

// ✅ Auth configuration
export const AUTH_CONFIG = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  storageKey: 'fwaeh-mart-auth',
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
};

export default {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  authConfig: AUTH_CONFIG,
};