import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

// ============================================================
// Interfaces
// ============================================================

export interface PharmacyListItem {
  id: string;
  businessName: string;
  owner: string;
  email: string;
  phone: string | null;
  city: string;
  state: string;
  status: string;
  address: string;
  zipCode: string;
  licenseNumber: string;
  totalReturns: number;
  createdAt: string;
}

export interface PharmacyDetails extends PharmacyListItem {
  stateLicenseNumber: string | null;
  licenseExpiryDate: string | null;
  npiNumber: string | null;
  deaNumber: string | null;
  totalReturnsValue: number;
  physicalAddress: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  billingAddress: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  updatedAt: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PharmaciesListResponse {
  pharmacies: PharmacyListItem[];
  pagination: PaginationInfo;
  filters: {
    search: string | null;
    status: string;
  };
  generatedAt: string;
}

export interface PharmacyDetailsResponse {
  pharmacy: PharmacyDetails;
  generatedAt: string;
}

export interface UpdatePharmacyData {
  businessName?: string;
  owner?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  licenseNumber?: string;
  stateLicenseNumber?: string;
  licenseExpiryDate?: string;
  npiNumber?: string;
  deaNumber?: string;
  physicalAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  subscriptionTier?: string;
  subscriptionStatus?: string;
}

// ============================================================
// Service Functions
// ============================================================

/**
 * Get list of pharmacies with search, filter, and pagination
 * Uses PostgreSQL RPC function - no custom JS logic
 */
export const getPharmaciesList = async (
  search?: string,
  status: string = 'all',
  page: number = 1,
  limit: number = 20
): Promise<PharmaciesListResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  console.log(`📋 Fetching pharmacies list (search: ${search || 'none'}, status: ${status}, page: ${page})`);

  const { data, error } = await supabaseAdmin.rpc('get_admin_pharmacies_list', {
    p_search: search || null,
    p_status: status,
    p_page: page,
    p_limit: limit,
  });

  if (error) {
    throw new AppError(`Failed to fetch pharmacies: ${error.message}`, 400);
  }

  if (!data) {
    throw new AppError('No data returned from pharmacies list', 500);
  }

  console.log(`✅ Found ${data.pagination?.total || 0} pharmacies`);

  return {
    pharmacies: data.pharmacies || [],
    pagination: data.pagination,
    filters: data.filters,
    generatedAt: data.generatedAt,
  };
};

/**
 * Get single pharmacy details by ID
 * Uses PostgreSQL RPC function - no custom JS logic
 */
export const getPharmacyById = async (
  pharmacyId: string
): Promise<PharmacyDetailsResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  console.log(`🔍 Fetching pharmacy details for ID: ${pharmacyId}`);

  const { data, error } = await supabaseAdmin.rpc('get_admin_pharmacy_by_id', {
    p_pharmacy_id: pharmacyId,
  });

  if (error) {
    throw new AppError(`Failed to fetch pharmacy: ${error.message}`, 400);
  }

  if (!data) {
    throw new AppError('No data returned from pharmacy details', 500);
  }

  // Check for RPC-level errors
  if (data.error) {
    throw new AppError(data.message || 'Pharmacy not found', data.code || 404);
  }

  console.log(`✅ Pharmacy found: ${data.pharmacy?.businessName}`);

  return {
    pharmacy: data.pharmacy,
    generatedAt: data.generatedAt,
  };
};

/**
 * Update pharmacy details
 * Uses PostgreSQL RPC function - no custom JS logic
 */
export const updatePharmacy = async (
  pharmacyId: string,
  updates: UpdatePharmacyData
): Promise<PharmacyDetailsResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  console.log(`✏️ Updating pharmacy: ${pharmacyId}`);

  const { data, error } = await supabaseAdmin.rpc('update_admin_pharmacy', {
    p_pharmacy_id: pharmacyId,
    p_updates: updates,
  });

  if (error) {
    throw new AppError(`Failed to update pharmacy: ${error.message}`, 400);
  }

  if (!data) {
    throw new AppError('No data returned from pharmacy update', 500);
  }

  // Check for RPC-level errors
  if (data.error) {
    throw new AppError(data.message || 'Failed to update pharmacy', data.code || 400);
  }

  console.log(`✅ Pharmacy updated: ${data.pharmacy?.businessName}`);

  return {
    pharmacy: data.pharmacy,
    generatedAt: data.generatedAt,
  };
};

/**
 * Update pharmacy status (blacklist/restore/suspend)
 * Uses PostgreSQL RPC function - no custom JS logic
 */
export const updatePharmacyStatus = async (
  pharmacyId: string,
  newStatus: string
): Promise<PharmacyDetailsResponse & { statusChange: { from: string; to: string } }> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  console.log(`🔄 Updating pharmacy status: ${pharmacyId} -> ${newStatus}`);

  const { data, error } = await supabaseAdmin.rpc('update_admin_pharmacy_status', {
    p_pharmacy_id: pharmacyId,
    p_new_status: newStatus,
  });

  if (error) {
    throw new AppError(`Failed to update pharmacy status: ${error.message}`, 400);
  }

  if (!data) {
    throw new AppError('No data returned from status update', 500);
  }

  // Check for RPC-level errors
  if (data.error) {
    throw new AppError(data.message || 'Failed to update pharmacy status', data.code || 400);
  }

  console.log(`✅ Pharmacy status updated: ${data.statusChange?.from} -> ${data.statusChange?.to}`);

  return {
    pharmacy: data.pharmacy,
    statusChange: data.statusChange,
    generatedAt: data.generatedAt,
  };
};

