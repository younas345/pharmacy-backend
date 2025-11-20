import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

// Extend Express Request type to include pharmacyId
declare global {
  namespace Express {
    interface Request {
      pharmacyId?: string;
    }
  }
}

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

    // Step 2: Verify that the user exists in the pharmacy table (authorization check)
    // This ensures only pharmacy users can access these endpoints
    const { data: pharmacy, error: pharmacyError } = await supabaseAdmin
      .from('pharmacy')
      .select('id')
      .eq('id', userId)
      .single();

    if (pharmacyError || !pharmacy) {
      throw new AppError('Pharmacy profile not found. Access denied.', 403);
    }

    // Step 3: Set pharmacy_id for use in controllers
    // The pharmacy_id is the same as the user.id (pharmacy table id = auth user id)
    req.pharmacyId = userId;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

