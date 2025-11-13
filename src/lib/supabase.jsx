// src/lib/supabase.jsx

import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY, AUTH_CONFIG, validateConfig } from '../config/supabase.config';

// ✅ Validate configuration on import
validateConfig();

// ✅ Create Supabase client with proper configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: AUTH_CONFIG,
  global: {
    headers: {
      'x-application-name': 'fwaeh-mart',
    },
  },
});

// ✅ Export config for debugging
export { SUPABASE_URL, SUPABASE_ANON_KEY };