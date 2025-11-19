import { supabase, supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';

// Use admin client for backend operations (bypasses RLS)
// Fallback to regular client if admin is not configured
const db = supabaseAdmin || supabase;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

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
}

export const signup = async (data: SignupData): Promise<AuthResponse> => {
  const { email, password, name, pharmacyName, phone } = data;

  // Check if user already exists
  const { data: existingUser, error: checkError } = await db
    .from('pharmacy')
    .select('id, email')
    .eq('email', email)
    .single();

  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user in pharmacy table
  const { data: newUser, error: insertError } = await db
    .from('pharmacy')
    .insert([
      {
        email,
        password: hashedPassword,
        name,
        pharmacy_name: pharmacyName,
        phone: phone || null,
      },
    ])
    .select()
    .single();

  if (insertError) {
    throw new AppError(insertError.message || 'Failed to create user', 400);
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: newUser.id, email: newUser.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = newUser;

  return {
    user: userWithoutPassword,
    token,
  };
};

export const signin = async (data: SigninData): Promise<AuthResponse> => {
  const { email, password } = data;

  // Find user by email
  const { data: user, error: findError } = await db
    .from('pharmacy')
    .select('*')
    .eq('email', email)
    .single();

  if (findError || !user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check password
  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw new AppError('Invalid email or password', 401);
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as SignOptions
  );

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
};

