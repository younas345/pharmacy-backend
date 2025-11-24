import { supabase, supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface PharmacySettings {
  id: string;
  email: string;
  name: string;
  pharmacy_name: string;
  npi_number: string | null;
  dea_number: string | null;
  contact_phone: string | null;
  phone: string | null;
  physical_address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  billing_address: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;
  title?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateSettingsData {
  name?: string;
  email?: string;
  phone?: string;
  contact_phone?: string;
  pharmacy_name?: string;
  npi_number?: string;
  dea_number?: string;
  title?: string;
  physical_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  billing_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Get pharmacy settings/profile
 */
export const getPharmacySettings = async (pharmacyId: string): Promise<PharmacySettings> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { data, error } = await supabaseAdmin
    .from('pharmacy')
    .select('*')
    .eq('id', pharmacyId)
    .single();

  if (error || !data) {
    throw new AppError('Pharmacy not found', 404);
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    pharmacy_name: data.pharmacy_name,
    npi_number: data.npi_number,
    dea_number: data.dea_number,
    contact_phone: data.contact_phone,
    phone: data.phone,
    physical_address: data.physical_address as any,
    billing_address: data.billing_address as any,
    title: (data as any).title || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Update pharmacy settings/profile
 */
export const updatePharmacySettings = async (
  pharmacyId: string,
  updateData: UpdateSettingsData
): Promise<PharmacySettings> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  // Prepare update object
  const updateFields: any = {
    updated_at: new Date().toISOString(),
  };

  if (updateData.name !== undefined) updateFields.name = updateData.name;
  if (updateData.phone !== undefined) updateFields.phone = updateData.phone;
  if (updateData.contact_phone !== undefined) updateFields.contact_phone = updateData.contact_phone;
  if (updateData.pharmacy_name !== undefined) updateFields.pharmacy_name = updateData.pharmacy_name;
  if (updateData.npi_number !== undefined) updateFields.npi_number = updateData.npi_number;
  if (updateData.dea_number !== undefined) updateFields.dea_number = updateData.dea_number;
  if (updateData.title !== undefined) updateFields.title = updateData.title;
  if (updateData.physical_address !== undefined) {
    updateFields.physical_address = updateData.physical_address;
  }
  if (updateData.billing_address !== undefined) {
    updateFields.billing_address = updateData.billing_address;
  }

  // If email is being updated, also update it in auth
  if (updateData.email !== undefined && updateData.email !== null) {
    // Update email in auth.users
    const { error: emailError } = await supabaseAdmin.auth.admin.updateUserById(pharmacyId, {
      email: updateData.email,
    });

    if (emailError) {
      throw new AppError(`Failed to update email: ${emailError.message}`, 400);
    }

    updateFields.email = updateData.email;
  }

  // Update pharmacy record
  const { data, error } = await supabaseAdmin
    .from('pharmacy')
    .update(updateFields)
    .eq('id', pharmacyId)
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to update settings: ${error.message}`, 500);
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    pharmacy_name: data.pharmacy_name,
    npi_number: data.npi_number,
    dea_number: data.dea_number,
    contact_phone: data.contact_phone,
    phone: data.phone,
    physical_address: data.physical_address as any,
    billing_address: data.billing_address as any,
    title: (data as any).title || null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
};

/**
 * Change password
 */
export const changePassword = async (
  pharmacyId: string,
  passwordData: ChangePasswordData
): Promise<void> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { currentPassword, newPassword, confirmPassword } = passwordData;

  // Validate passwords match
  if (newPassword !== confirmPassword) {
    throw new AppError('New password and confirm password do not match', 400);
  }

  // Validate password strength
  if (newPassword.length < 8) {
    throw new AppError('Password must be at least 8 characters long', 400);
  }

  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
    throw new AppError(
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      400
    );
  }

  // Verify current password by attempting to sign in
  const { data: pharmacy } = await supabaseAdmin
    .from('pharmacy')
    .select('email')
    .eq('id', pharmacyId)
    .single();

  if (!pharmacy) {
    throw new AppError('Pharmacy not found', 404);
  }

  // Try to sign in with current password to verify it (use regular client for auth)
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: pharmacy.email,
    password: currentPassword,
  });

  if (verifyError) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Update password using admin client
  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(pharmacyId, {
    password: newPassword,
  });

  if (updateError) {
    throw new AppError(`Failed to update password: ${updateError.message}`, 500);
  }
};

