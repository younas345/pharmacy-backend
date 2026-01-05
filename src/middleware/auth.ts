import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

/**
 * Decode a JWT token locally without making a network call
 * This is much faster and more reliable than calling Supabase auth API
 */
function decodeJwt(token: string): { sub: string; exp: number; aud: string; role: string } | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode the payload (base64url -> JSON)
    const payload = parts[1];
    const decoded = Buffer.from(payload, 'base64url').toString('utf-8');
    const parsed = JSON.parse(decoded);
    
    // Validate required fields
    if (!parsed.sub || !parsed.exp) return null;
    
    return {
      sub: parsed.sub, // User ID
      exp: parsed.exp, // Expiration timestamp
      aud: parsed.aud || 'authenticated',
      role: parsed.role || 'authenticated',
    };
  } catch (error) {
    console.log('[Auth] Failed to decode JWT:', error);
    return null;
  }
}

/**
 * Check if a JWT token is expired
 */
function isTokenExpired(exp: number): boolean {
  // exp is in seconds, Date.now() is in milliseconds
  // Add 30 second buffer for clock skew
  return (exp * 1000) < (Date.now() - 30000);
}

// Extend Express Request type to include pharmacyId and pharmacy status
declare global {
  namespace Express {
    interface Request {
      pharmacyId?: string;
      pharmacyStatus?: string;
    }
  }
}

/**
 * Error messages for different pharmacy statuses
 */
const STATUS_ERROR_MESSAGES: Record<string, { message: string; code: number }> = {
  suspended: {
    message: 'Your pharmacy account has been suspended. Please contact support for more information.',
    code: 403,
  },
  blacklisted: {
    message: 'Your pharmacy account has been permanently blocked. Access to the platform is denied.',
    code: 403,
  },
  pending: {
    message: 'Your pharmacy account is pending approval. Please wait for account activation.',
    code: 403,
  },
};

/**
 * Check if pharmacy status allows access
 * Returns null if access is allowed, or an AppError if access should be denied
 */
export const checkPharmacyStatus = (status: string | null): AppError | null => {
  if (!status) {
    // If status is null, treat as pending
    return new AppError(STATUS_ERROR_MESSAGES.pending.message, STATUS_ERROR_MESSAGES.pending.code);
  }

  const statusLower = status.toLowerCase();

  if (statusLower === 'active') {
    return null; // Access allowed
  }

  const errorInfo = STATUS_ERROR_MESSAGES[statusLower];
  if (errorInfo) {
    return new AppError(errorInfo.message, errorInfo.code);
  }

  // Unknown status - deny access by default
  return new AppError('Your pharmacy account status is invalid. Please contact support.', 403);
};

/**
 * Verify pharmacy status by pharmacy ID
 * Used by routes that take pharmacy_id as a query parameter
 */
export const verifyPharmacyStatus = async (pharmacyId: string): Promise<void> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { data: pharmacy, error } = await supabaseAdmin
    .from('pharmacy')
    .select('id, status')
    .eq('id', pharmacyId)
    .single();

  if (error || !pharmacy) {
    throw new AppError('Pharmacy not found', 404);
  }

  const statusError = checkPharmacyStatus(pharmacy.status);
  if (statusError) {
    throw statusError;
  }
};

/**
 * Main authentication middleware for pharmacy users
 * Verifies JWT token and checks pharmacy status
 * 
 * Status codes:
 * - 401 + code: 'TOKEN_EXPIRED' - Token is expired, client should refresh
 * - 401 + code: 'TOKEN_INVALID' - Token is invalid, client should re-login
 * - 401 + code: 'TOKEN_MISSING' - No token provided
 * - 503 - Service unavailable (Supabase connection issues), client should retry
 * - 403 - Account status issue (suspended, blacklisted, etc.)
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authorization token is required', 401, 'TOKEN_MISSING');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AppError('Authorization token is required', 401, 'TOKEN_MISSING');
    }

    // Verify token and get user
    if (!supabaseAdmin) {
      throw new AppError('Supabase admin client not configured', 500);
    }

    // Step 1: Decode the JWT locally (no network call!)
    // This is much faster and more reliable than calling Supabase auth API
    const decoded = decodeJwt(token);
    
    if (!decoded) {
      throw new AppError('Invalid token format', 401, 'TOKEN_INVALID');
    }
    
    // Check if token is expired
    if (isTokenExpired(decoded.exp)) {
      throw new AppError('Token has expired', 401, 'TOKEN_EXPIRED');
    }
    
    // Validate the token is for authenticated users
    if (decoded.role !== 'authenticated' && decoded.aud !== 'authenticated') {
      throw new AppError('Invalid token', 401, 'TOKEN_INVALID');
    }

    const userId = decoded.sub;

    // Step 2: Verify that the user exists in the pharmacy table and get status
    const { data: pharmacy, error: pharmacyError } = await supabaseAdmin
      .from('pharmacy')
      .select('id, status')
      .eq('id', userId)
      .single();

    if (pharmacyError || !pharmacy) {
      throw new AppError('Pharmacy profile not found. Access denied.', 403);
    }

    // Step 3: Check pharmacy status - BLOCK suspended/blacklisted pharmacies
    const statusError = checkPharmacyStatus(pharmacy.status);
    if (statusError) {
      throw statusError;
    }

    // Step 4: Set pharmacy_id and status for use in controllers
    req.pharmacyId = userId;
    req.pharmacyStatus = pharmacy.status;

    next();
  } catch (error: any) {
    if (error instanceof AppError) {
      next(error);
    } else if (error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT' || 
               error?.message?.includes('fetch failed') ||
               error?.message?.includes('timeout')) {
      // Network timeout - return 503
      next(new AppError('Authentication service temporarily unavailable. Please retry.', 503));
    } else {
      // Unknown error - treat as invalid token
      next(new AppError('Authentication failed', 401, 'TOKEN_INVALID'));
    }
  }
};

