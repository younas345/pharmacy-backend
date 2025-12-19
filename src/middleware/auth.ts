import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

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
      throw new AppError('Authorization token is required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      throw new AppError('Authorization token is required', 401);
    }

    // Verify token and get user
    if (!supabaseAdmin) {
      throw new AppError('Supabase admin client not configured', 500);
    }

    // Step 1: Verify the JWT token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      throw new AppError('Invalid or expired token', 401);
    }

    const userId = user.id;

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
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

