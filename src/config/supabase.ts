import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
// Vercel provides env vars directly, so only load .env.local in development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  dotenv.config({ path: '.env.local' });
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client with anon key (subject to RLS policies)
// Note: We handle token refresh manually through our API endpoints
// so we disable auto-refresh to have full control over token lifecycle
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // We handle refresh manually via /api/auth/refresh
    persistSession: false, // Server-side doesn't need session persistence
  },
});

// Client with service role key (bypasses RLS - use for admin operations)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

