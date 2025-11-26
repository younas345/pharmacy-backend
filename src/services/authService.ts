import { supabase, supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

// Use admin client for backend operations (bypasses RLS)
// Fallback to regular client if admin is not configured
const db = supabaseAdmin || supabase;

export interface SignupData {
  email: string;
  password: string;
  name: string;
  pharmacyName: string;
  phone?: string;
}

export interface SigninData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: any;
  token: string;
  session: any;
}

export const signup = async (data: SignupData): Promise<AuthResponse> => {
  const { email, password, name, pharmacyName, phone } = data;

  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured. SUPABASE_SERVICE_ROLE_KEY is required.', 500);
  }

  // Step 1: Create user in Supabase Auth using admin client
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // Auto-confirm email (set to false if you want email verification)
  });

  if (authError || !authData?.user) {
    // Check if user already exists
    if (authError?.message?.includes('already registered') || 
        authError?.message?.includes('already exists') ||
        authError?.message?.includes('User already registered')) {
      throw new AppError('User with this email already exists', 400);
    }
    throw new AppError(authError?.message || 'Failed to create user', 400);
  }

  const authUserId = authData.user.id;

  // Step 2: Create pharmacy profile linked to auth user
  const { data: pharmacyData, error: pharmacyError } = await db
    .from('pharmacy')
    .insert([
      {
        id: authUserId, // Link pharmacy record to auth user ID
        email,
        name,
        pharmacy_name: pharmacyName,
        phone: phone || null,
      },
    ])
    .select()
    .single();

  if (pharmacyError) {
    // If pharmacy insert fails, try to delete the auth user (cleanup)
    await supabaseAdmin.auth.admin.deleteUser(authUserId);
    throw new AppError(pharmacyError.message || 'Failed to create pharmacy profile', 400);
  }

  // Step 3: Sign in the user to get session (use regular client for session)
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (sessionError || !sessionData?.session) {
    throw new AppError('Failed to create session', 500);
  }

  return {
    user: pharmacyData,
    token: sessionData.session.access_token,
    session: sessionData.session,
  };
};

export const signin = async (data: SigninData): Promise<AuthResponse> => {
  const { email, password } = data;

  // Step 1: Sign in with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData?.session || !authData?.user) {
    throw new AppError('Invalid email or password', 401);
  }

  const authUserId = authData.user.id;

  // Step 2: Fetch pharmacy profile
  const { data: pharmacyData, error: pharmacyError } = await db
    .from('pharmacy')
    .select('*')
    .eq('id', authUserId)
    .single();

  if (pharmacyError || !pharmacyData) {
    throw new AppError('Pharmacy profile not found', 404);
  }

  return {
    user: pharmacyData,
    token: authData.session.access_token,
    session: authData.session,
  };
};

