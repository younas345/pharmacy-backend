import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const db = supabaseAdmin || null;

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '1h'; // 1 hour
const JWT_EXPIRES_IN_SECONDS = 3600; // 1 hour in seconds

export interface AdminLoginData {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  accessToken?: string; // Alias for token (for frontend compatibility)
  access_token?: string; // Alias for token (for frontend compatibility)
  expiresIn: number;
  expiresAt: number;
}

/**
 * Login admin user
 * 
 * This function:
 * 1. Validates email and password
 * 2. Checks if admin exists and is active
 * 3. Verifies password using bcrypt
 * 4. Generates JWT token
 * 5. Updates last_login_at
 * 6. Returns token and user data
 */
export const adminLogin = async (data: AdminLoginData): Promise<AdminAuthResponse> => {
  const { email, password } = data;

  if (!db) {
    throw new AppError('Database connection not configured', 500);
  }

  // Step 1: Fetch admin from database
  const { data: adminData, error: adminError } = await db
    .from('admin')
    .select('id, email, password_hash, name, role, is_active')
    .eq('email', email)
    .single();

  if (adminError || !adminData) {
    throw new AppError('Invalid email or password', 401);
  }

  // Step 2: Check if admin is active
  if (!adminData.is_active) {
    throw new AppError('Admin account is inactive', 403);
  }

  // Step 3: Verify password
  const isPasswordValid = await bcrypt.compare(password, adminData.password_hash);

  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Step 4: Generate JWT token
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + JWT_EXPIRES_IN_SECONDS;

  const tokenPayload = {
    id: adminData.id,
    email: adminData.email,
    name: adminData.name,
    role: adminData.role,
    type: 'admin', // Distinguish from pharmacy users
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  // Step 5: Update last_login_at
  await db
    .from('admin')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', adminData.id);

  // Step 6: Return response
  const user = {
    id: adminData.id,
    email: adminData.email,
    name: adminData.name,
    role: adminData.role,
  };

  return {
    user,
    token,
    accessToken: token, // Alias for frontend compatibility
    access_token: token, // Alias for frontend compatibility
    expiresIn: JWT_EXPIRES_IN_SECONDS,
    expiresAt,
  };
};

/**
 * Verify admin JWT token
 * Used for authentication middleware
 */
export const verifyAdminToken = async (token: string): Promise<{
  id: string;
  email: string;
  name: string;
  role: string;
  type: string;
}> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Check if token is for admin
    if (decoded.type !== 'admin') {
      throw new AppError('Invalid token type', 401);
    }

    // Verify admin still exists and is active
    if (!db) {
      throw new AppError('Database connection not configured', 500);
    }

    const { data: adminData, error: adminError } = await db
      .from('admin')
      .select('id, email, name, role, is_active')
      .eq('id', decoded.id)
      .single();

    if (adminError || !adminData) {
      throw new AppError('Admin not found', 404);
    }

    if (!adminData.is_active) {
      throw new AppError('Admin account is inactive', 403);
    }

    return {
      id: adminData.id,
      email: adminData.email,
      name: adminData.name,
      role: adminData.role,
      type: 'admin',
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Invalid or expired token', 401);
  }
};
