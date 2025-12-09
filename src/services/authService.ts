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
  refreshToken: string;
  session: any;
}

export interface RefreshTokenData {
  refreshToken: string;
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
    refreshToken: sessionData.session.refresh_token,
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
    refreshToken: authData.session.refresh_token,
    session: authData.session,
  };
};

interface SupabaseTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

interface SupabaseErrorResponse {
  error?: string;
  error_description?: string;
  [key: string]: any;
}

/**
 * Refresh access token using refresh token
 * 
 * IMPORTANT: Refresh tokens should have a longer expiration than access tokens.
 * - Access tokens typically expire in 1 hour
 * - Refresh tokens should expire in 7 days (default Supabase configuration)
 * 
 * If refresh tokens are expiring at the same time as access tokens, check your
 * Supabase project settings:
 * - Go to Supabase Dashboard > Authentication > Settings
 * - Verify "JWT expiry" and "Refresh token expiry" settings
 * - Refresh token expiry should be significantly longer than JWT expiry
 * 
 * This function exchanges a refresh token for a new access token and refresh token.
 * The new refresh token should be used for subsequent refreshes.
 */
export const refreshToken = async (data: RefreshTokenData): Promise<AuthResponse> => {
  const { refreshToken: refreshTokenValue } = data;

  if (!refreshTokenValue) {
    throw new AppError('Refresh token is required', 400);
  }

  // Use Supabase REST API to refresh the token
  // This is the proper way to refresh tokens server-side
  // The refresh token should remain valid even after the access token expires
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new AppError('Supabase configuration missing', 500);
  }

  try {
    // Call Supabase Auth REST API to exchange refresh token for new session
    // The refresh token should remain valid even after access token expires
    const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        refresh_token: refreshTokenValue,
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as SupabaseErrorResponse;
      const errorMessage = errorData.error_description || errorData.error || 'Invalid or expired refresh token';
      
      // Provide more specific error message
      if (errorData.error === 'invalid_grant' || errorMessage.includes('expired')) {
        throw new AppError('Refresh token has expired. Please sign in again.', 401);
      }
      throw new AppError(errorMessage, 401);
    }

    const sessionData = (await response.json()) as SupabaseTokenResponse;

    if (!sessionData.access_token || !sessionData.user || !sessionData.user.id) {
      throw new AppError('Invalid refresh token response', 401);
    }

    const authUserId = sessionData.user.id;

    // Fetch pharmacy profile to ensure user still exists
    const { data: pharmacyData, error: pharmacyError } = await db
      .from('pharmacy')
      .select('*')
      .eq('id', authUserId)
      .single();

    if (pharmacyError || !pharmacyData) {
      throw new AppError('Pharmacy profile not found', 404);
    }

    // Supabase should always return a new refresh token when refreshing
    // Use the new refresh token, not the old one
    // This ensures the refresh token remains valid for its full lifetime
    const newRefreshToken = sessionData.refresh_token;
    
    if (!newRefreshToken) {
      // If Supabase doesn't return a new refresh token, log a warning but continue
      // This should not happen in normal operation
      console.warn('Supabase did not return a new refresh token. Using the provided refresh token as fallback.');
    }

    // Construct session object in the format expected by the client
    const session = {
      access_token: sessionData.access_token,
      refresh_token: newRefreshToken || refreshTokenValue,
      expires_in: sessionData.expires_in,
      expires_at: sessionData.expires_at,
      token_type: sessionData.token_type || 'bearer',
      user: sessionData.user,
    };

    return {
      user: pharmacyData,
      token: sessionData.access_token,
      // Always use the new refresh token if provided, otherwise fallback to the old one
      // This ensures refresh tokens can be used multiple times until they expire
      refreshToken: newRefreshToken || refreshTokenValue,
      session,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // Provide more descriptive error message
    const errorMessage = error instanceof Error ? error.message : 'Failed to refresh token';
    throw new AppError(`Failed to refresh token: ${errorMessage}`, 401);
  }
};

