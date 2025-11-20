import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface ReverseDistributor {
  id: string;
  name: string;
  code: string;
  contact_email?: string;
  contact_phone?: string;
  address?: any;
  portal_url?: string;
  supported_formats?: string[];
  is_active: boolean;
  created_at: string;
}

/**
 * Find or create a reverse distributor by name
 * Returns the distributor ID
 */
export const findOrCreateReverseDistributor = async (name: string): Promise<string> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  if (!name || name.trim() === '') {
    throw new AppError('Distributor name is required', 400);
  }

  const db = supabaseAdmin;
  const trimmedName = name.trim();

  // Try to find existing distributor by name (case-insensitive)
  const { data: existing } = await db
    .from('reverse_distributors')
    .select('id')
    .ilike('name', trimmedName)
    .limit(1)
    .single();

  if (existing) {
    console.log('✅ Found existing reverse distributor:', existing.id, trimmedName);
    return existing.id;
  }

  // Create new distributor
  // Generate code from name (first 3 uppercase letters, or first letters of words)
  const code = generateDistributorCode(trimmedName);

  console.log('➕ Creating new reverse distributor:', trimmedName, 'Code:', code);

  const { data: newDistributor, error } = await db
    .from('reverse_distributors')
    .insert({
      name: trimmedName,
      code: code,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    // If code conflict, try with timestamp
    if (error.code === '23505') { // Unique violation
      const codeWithTimestamp = `${code}_${Date.now().toString().slice(-6)}`;
      const { data: retryDistributor, error: retryError } = await db
        .from('reverse_distributors')
        .insert({
          name: trimmedName,
          code: codeWithTimestamp,
          is_active: true,
        })
        .select('id')
        .single();

      if (retryError) {
        throw new AppError(`Failed to create reverse distributor: ${retryError.message}`, 400);
      }

      console.log('✅ Created reverse distributor with unique code:', retryDistributor.id);
      return retryDistributor.id;
    }

    throw new AppError(`Failed to create reverse distributor: ${error.message}`, 400);
  }

  console.log('✅ Created new reverse distributor:', newDistributor.id);
  return newDistributor.id;
};

/**
 * Generate a code from distributor name
 */
const generateDistributorCode = (name: string): string => {
  // Remove common words
  const words = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter(word => 
      !['INC', 'LLC', 'CORP', 'LTD', 'COMPANY', 'CO', 'PHARMA', 'PHARMACEUTICAL', 'DISTRIBUTORS', 'DISTRIBUTOR', 'SERVICES', 'SOLUTIONS'].includes(word)
    );

  if (words.length === 0) {
    // Fallback: use first 3 letters of name
    return name.replace(/[^A-Z0-9]/g, '').substring(0, 3).toUpperCase() || 'DIST';
  }

  if (words.length === 1) {
    return words[0].substring(0, 3).toUpperCase();
  }

  // Use first letter of first 3 words, or first 3 letters of first word
  if (words.length >= 3) {
    return words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
  }

  return words.map(w => w[0]).join('').toUpperCase() + words[0].substring(1, 3).toUpperCase();
};

/**
 * Get all reverse distributors
 */
export const getReverseDistributors = async (): Promise<ReverseDistributor[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { data, error } = await db
    .from('reverse_distributors')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    throw new AppError(`Failed to fetch reverse distributors: ${error.message}`, 400);
  }

  return data || [];
};

/**
 * Get reverse distributor by ID
 */
export const getReverseDistributorById = async (id: string): Promise<ReverseDistributor | null> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { data, error } = await db
    .from('reverse_distributors')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Not found
      return null;
    }
    throw new AppError(`Failed to fetch reverse distributor: ${error.message}`, 400);
  }

  return data;
};

