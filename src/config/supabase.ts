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
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client with service role key (bypasses RLS - use for admin operations)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

