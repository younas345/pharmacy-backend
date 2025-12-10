import { supabase, supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';
import crypto from 'crypto';

// Use admin client for backend operations (bypasses RLS)
// Fallback to regular client if admin is not configured
const db = supabaseAdmin || supabase;

// Constants for token configuration
const REFRESH_TOKEN_EXPIRY_DAYS = 30; // Custom refresh tokens last 30 days
const ACCESS_TOKEN_EXPIRY_SECONDS = 3600; // Access tokens expire in 1 hour

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
  expiresIn: number;
  expiresAt: number;
}

export interface RefreshTokenData {
  refreshToken: string;
}

/**
 * Generate a secure random refresh token
 */
const generateRefreshToken = (): string => {
  // Generate a cryptographically secure random token
  const randomBytes = crypto.randomBytes(64);
  const token = randomBytes.toString('base64url');
  return `prt_${token}`; // prefix to identify our custom tokens (pharmacy refresh token)
};

/**
 * Hash a refresh token for secure storage
 * We never store raw tokens in the database
 */
const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Store a refresh token in the database
 */
const storeRefreshToken = async (
  pharmacyId: string,
  token: string,
  userAgent?: string,
  ipAddress?: string
): Promise<void> => {
  const tokenHash = hashToken(token);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  const { error } = await db
    .from('refresh_tokens')
    .insert({
      pharmacy_id: pharmacyId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      user_agent: userAgent || null,
      ip_address: ipAddress || null,
    });

  if (error) {
    console.error('Failed to store refresh token:', error);
    throw new AppError('Failed to create session', 500);
  }
};

/**
 * Validate and retrieve refresh token data from database
 */
const validateRefreshToken = async (token: string): Promise<{ pharmacyId: string; tokenId: string } | null> => {
  const tokenHash = hashToken(token);

  const { data, error } = await db
    .from('refresh_tokens')
    .select('id, pharmacy_id, expires_at, revoked_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !data) {
    return null;
  }

  // Check if token is revoked
  if (data.revoked_at) {
    return null;
  }

  // Check if token is expired
  const expiresAt = new Date(data.expires_at);
  if (expiresAt < new Date()) {
    return null;
  }

  // Update last_used_at
  await db
    .from('refresh_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);

  return {
    pharmacyId: data.pharmacy_id,
    tokenId: data.id,
  };
};

/**
 * Revoke a specific refresh token
 */
const revokeRefreshToken = async (tokenId: string): Promise<void> => {
  await db
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', tokenId);
};

/**
 * Revoke all refresh tokens for a pharmacy (useful for logout all devices)
 * This actually deletes the tokens from the database
 */
export const revokeAllRefreshTokens = async (pharmacyId: string): Promise<void> => {
  const { error } = await db
    .from('refresh_tokens')
    .delete()
    .eq('pharmacy_id', pharmacyId);

  if (error) {
    console.error('Failed to revoke all refresh tokens:', error);
    // Don't throw error - allow login to continue even if cleanup fails
  }
};

/**
 * Clean up expired tokens (can be called periodically)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  const { data, error } = await db
    .from('refresh_tokens')
    .delete()
    .or(`expires_at.lt.${new Date().toISOString()},revoked_at.not.is.null`)
    .select('id');

  if (error) {
    console.error('Failed to cleanup expired tokens:', error);
    return 0;
  }

  return data?.length || 0;
};

/**
 * Generate access token using Supabase admin API
 * This creates a new session for the user
 */
const generateAccessToken = async (userId: string): Promise<{ accessToken: string; expiresIn: number; expiresAt: number }> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  // Get user details
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
  
  if (userError || !userData?.user) {
    throw new AppError('User not found', 404);
  }

  // Generate a magic link that we can use to create a session
  // This is a workaround since Supabase doesn't have a direct "generate token for user" admin API
  // Instead, we'll use the generateLink with OTP type
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.user.email!,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    // Fallback: Try to verify OTP directly
    // This is a workaround - we'll generate our own JWT
    throw new AppError('Failed to generate access token', 500);
  }

  // Extract the token from the magic link and verify it to get a session
  // The hashed_token can be used with verifyOtp
  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (sessionError || !sessionData?.session) {
    throw new AppError('Failed to create session', 500);
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + ACCESS_TOKEN_EXPIRY_SECONDS;

  return {
    accessToken: sessionData.session.access_token,
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    expiresAt,
  };
};

/**
 * Calculate expiration times for the response
 */
const calculateExpiry = (): { expiresIn: number; expiresAt: number } => {
  const now = Math.floor(Date.now() / 1000);
  return {
    expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
    expiresAt: now + ACCESS_TOKEN_EXPIRY_SECONDS,
  };
};

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

  // Step 3: Sign in the user to get Supabase session (for initial access token)
  const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (sessionError || !sessionData?.session) {
    throw new AppError('Failed to create session', 500);
  }

  // Step 4: Generate and store our custom long-lived refresh token
  const customRefreshToken = generateRefreshToken();
  await storeRefreshToken(authUserId, customRefreshToken);

  const { expiresIn, expiresAt } = calculateExpiry();

  return {
    user: pharmacyData,
    token: sessionData.session.access_token,
    refreshToken: customRefreshToken, // Return our custom refresh token
    expiresIn,
    expiresAt,
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

  // Step 3: Revoke all existing refresh tokens (logout from all devices)
  // This ensures that when a user logs in, all previous sessions are invalidated
  await revokeAllRefreshTokens(authUserId);

  // Step 4: Generate and store our custom long-lived refresh token
  const customRefreshToken = generateRefreshToken();
  await storeRefreshToken(authUserId, customRefreshToken);

  const { expiresIn, expiresAt } = calculateExpiry();

  return {
    user: pharmacyData,
    token: authData.session.access_token,
    refreshToken: customRefreshToken, // Return our custom refresh token
    expiresIn,
    expiresAt,
  };
};

/**
 * Refresh access token using our custom refresh token
 * 
 * This function:
 * 1. Validates the custom refresh token against our database
 * 2. Creates a new Supabase session for the user
 * 3. Optionally rotates the refresh token for added security
 */
export const refreshToken = async (data: RefreshTokenData): Promise<AuthResponse> => {
  const { refreshToken: refreshTokenValue } = data;

  if (!refreshTokenValue) {
    throw new AppError('Refresh token is required', 400);
  }

  // Validate our custom refresh token
  const tokenData = await validateRefreshToken(refreshTokenValue);

  if (!tokenData) {
    throw new AppError('Invalid or expired refresh token. Please sign in again.', 401);
  }

  const { pharmacyId, tokenId } = tokenData;

  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  // Fetch the pharmacy user to get their email
  const { data: pharmacyData, error: pharmacyError } = await db
    .from('pharmacy')
    .select('*')
    .eq('id', pharmacyId)
    .single();

  if (pharmacyError || !pharmacyData) {
    // Revoke the token since the user no longer exists
    await revokeRefreshToken(tokenId);
    throw new AppError('Pharmacy profile not found', 404);
  }

  // Get user details from Supabase Auth
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(pharmacyId);

  if (userError || !userData?.user) {
    await revokeRefreshToken(tokenId);
    throw new AppError('User account not found', 404);
  }

  // Generate a new access token using magic link verification
  // This is the recommended way to create a session for a user programmatically
  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email: userData.user.email!,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    throw new AppError('Failed to generate access token', 500);
  }

  // Verify the magic link to get a session
  const { data: sessionData, error: sessionError } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  });

  if (sessionError || !sessionData?.session) {
    throw new AppError('Failed to create new session', 500);
  }

  // Token rotation: Generate a new refresh token and revoke the old one
  // This provides better security as each refresh token can only be used once
  const newRefreshToken = generateRefreshToken();
  await storeRefreshToken(pharmacyId, newRefreshToken);
  await revokeRefreshToken(tokenId);

  const { expiresIn, expiresAt } = calculateExpiry();

  return {
    user: pharmacyData,
    token: sessionData.session.access_token,
    refreshToken: newRefreshToken, // Return the new rotated refresh token
    expiresIn,
    expiresAt,
  };
};

/**
 * Logout - revoke the current refresh token
 */
export const logout = async (refreshTokenValue: string): Promise<void> => {
  if (!refreshTokenValue) {
    return; // No token to revoke
  }

  const tokenData = await validateRefreshToken(refreshTokenValue);
  if (tokenData) {
    await revokeRefreshToken(tokenData.tokenId);
  }
};

/**
 * Logout from all devices - revoke all refresh tokens for a user
 */
export const logoutAll = async (pharmacyId: string): Promise<void> => {
  await revokeAllRefreshTokens(pharmacyId);
};
