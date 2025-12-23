import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';
import bcrypt from 'bcryptjs';

// ============================================================
// Interfaces
// ============================================================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  roleDisplay: string;
  isActive: boolean;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalAdmins: number;
  activeAdmins: number;
  inactiveAdmins: number;
  superAdmins: number;
  managers: number;
  reviewers: number;
  support: number;
  byRole: {
    super_admin: number;
    manager: number;
    reviewer: number;
    support: number;
  };
}

export interface AdminRole {
  value: string;
  label: string;
  description: string;
  color: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminListResponse {
  admins: AdminUser[];
  stats: AdminStats;
  pagination: PaginationInfo;
}

export interface CreateAdminData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface UpdateAdminData {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
}

// ============================================================
// Service Functions
// ============================================================

/**
 * Get list of admin users with stats, pagination, and filters
 * Uses PostgreSQL RPC function - no custom JS logic
 */
export const getAdminUsers = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  role?: string,
  status?: string,
  sortBy: string = 'created_at',
  sortOrder: string = 'desc'
): Promise<AdminListResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { data, error } = await supabaseAdmin.rpc('get_admin_users_list', {
    p_page: page,
    p_limit: limit,
    p_search: search || null,
    p_role: role || null,
    p_status: status || null,
    p_sort_by: sortBy,
    p_sort_order: sortOrder,
  });

  if (error) {
    throw new AppError(`Failed to fetch admin users: ${error.message}`, 400);
  }

  return {
    admins: data.admins || [],
    stats: data.stats,
    pagination: data.pagination,
  };
};

/**
 * Get admin user by ID
 * Uses PostgreSQL RPC function
 */
export const getAdminById = async (adminId: string): Promise<AdminUser> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { data, error } = await supabaseAdmin.rpc('get_admin_user_by_id', {
    p_admin_id: adminId,
  });

  if (error) {
    throw new AppError(`Failed to fetch admin user: ${error.message}`, 400);
  }

  if (data.error) {
    throw new AppError(data.message, 404);
  }

  return data.admin;
};

/**
 * Create new admin user
 * Password is hashed in application layer, then passed to RPC function
 */
export const createAdmin = async (adminData: CreateAdminData): Promise<AdminUser> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  // Validate required fields
  if (!adminData.email || !adminData.password || !adminData.name) {
    throw new AppError('Email, password, and name are required', 400);
  }

  // Validate password strength
  if (adminData.password.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(adminData.password, 10);

  const { data, error } = await supabaseAdmin.rpc('create_admin_user', {
    p_email: adminData.email.toLowerCase().trim(),
    p_password_hash: passwordHash,
    p_name: adminData.name.trim(),
    p_role: adminData.role || 'support',
  });

  if (error) {
    throw new AppError(`Failed to create admin user: ${error.message}`, 400);
  }

  if (data.error) {
    throw new AppError(data.message, 400);
  }

  return data.admin;
};

/**
 * Update admin user
 * Uses PostgreSQL RPC function
 */
export const updateAdmin = async (
  adminId: string,
  updateData: UpdateAdminData
): Promise<AdminUser> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { data, error } = await supabaseAdmin.rpc('update_admin_user', {
    p_admin_id: adminId,
    p_name: updateData.name || null,
    p_email: updateData.email?.toLowerCase().trim() || null,
    p_role: updateData.role || null,
    p_is_active: updateData.isActive !== undefined ? updateData.isActive : null,
  });

  if (error) {
    throw new AppError(`Failed to update admin user: ${error.message}`, 400);
  }

  if (data.error) {
    throw new AppError(data.message, 400);
  }

  return data.admin;
};

/**
 * Update admin password
 * Password is hashed in application layer, then passed to RPC function
 */
export const updateAdminPassword = async (
  adminId: string,
  newPassword: string
): Promise<void> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  // Validate password strength
  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const { data, error } = await supabaseAdmin.rpc('update_admin_password', {
    p_admin_id: adminId,
    p_new_password_hash: passwordHash,
  });

  if (error) {
    throw new AppError(`Failed to update password: ${error.message}`, 400);
  }

  if (data.error) {
    throw new AppError(data.message, 400);
  }
};

/**
 * Delete admin user
 * Uses PostgreSQL RPC function
 */
export const deleteAdmin = async (
  adminId: string,
  requestingAdminId: string
): Promise<void> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { data, error } = await supabaseAdmin.rpc('delete_admin_user', {
    p_admin_id: adminId,
    p_requesting_admin_id: requestingAdminId,
  });

  if (error) {
    throw new AppError(`Failed to delete admin user: ${error.message}`, 400);
  }

  if (data.error) {
    throw new AppError(data.message, 400);
  }
};

/**
 * Get all available admin roles
 * Uses PostgreSQL RPC function
 */
export const getAdminRoles = async (): Promise<AdminRole[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { data, error } = await supabaseAdmin.rpc('get_admin_roles');

  if (error) {
    throw new AppError(`Failed to fetch admin roles: ${error.message}`, 400);
  }

  return data.roles || [];
};

