import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

// Interface for custom package item (accepts both camelCase and snake_case)
export interface CustomPackageItem {
  ndc: string;
  productName?: string;
  product_name?: string; // Accept snake_case for backward compatibility
  quantity: number;
  pricePerUnit?: number;
  price_per_unit?: number; // Accept snake_case for backward compatibility
  totalValue?: number;
  total_value?: number; // Accept snake_case for backward compatibility
}

// Interface for creating custom package
export interface CreateCustomPackageRequest {
  distributorName: string;
  distributorId?: string;
  items: CustomPackageItem[];
  notes?: string;
}

// Interface for custom package response
export interface CustomPackage {
  id: string;
  packageNumber: string;
  pharmacyId: string;
  distributorName: string;
  distributorId?: string;
  distributorContact?: {
    email?: string;
    phone?: string;
    location?: string;
  };
  items: CustomPackageItem[];
  totalItems: number;
  totalEstimatedValue: number;
  notes?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for custom package list response
export interface CustomPackagesListResponse {
  packages: CustomPackage[];
  total: number;
}

// Generate unique package number
const generatePackageNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `PKG-${timestamp}-${random}`;
};

// Create a custom package
export const createCustomPackage = async (
  pharmacyId: string,
  userId: string,
  packageData: CreateCustomPackageRequest
): Promise<CustomPackage> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Validate input
  if (!packageData.distributorName) {
    throw new AppError('Distributor name is required', 400);
  }

  if (!packageData.items || packageData.items.length === 0) {
    throw new AppError('At least one item is required', 400);
  }

  // Validate and normalize items
  const normalizedItems = packageData.items.map((item: any) => {
    // Handle both camelCase and snake_case field names
    const normalizedItem = {
      ndc: item.ndc,
      productName: item.productName || item.product_name || '',
      quantity: item.quantity,
      pricePerUnit: item.pricePerUnit || item.price_per_unit || 0,
      totalValue: item.totalValue || item.total_value || 0,
    };

    // Validate required fields
    if (!normalizedItem.ndc) {
      throw new AppError('NDC is required for all items', 400);
    }
    if (!normalizedItem.productName) {
      throw new AppError('Product name is required for all items', 400);
    }
    if (!normalizedItem.quantity || normalizedItem.quantity <= 0) {
      throw new AppError('Quantity must be greater than 0 for all items', 400);
    }
    if (normalizedItem.pricePerUnit < 0) {
      throw new AppError('Price per unit must be greater than or equal to 0', 400);
    }
    if (normalizedItem.totalValue < 0) {
      throw new AppError('Total value must be greater than or equal to 0', 400);
    }

    return normalizedItem;
  });

  // Calculate totals using normalized items
  const totalItems = normalizedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalEstimatedValue = normalizedItems.reduce((sum, item) => sum + item.totalValue, 0);

  // Generate package number
  const packageNumber = generatePackageNumber();

  // Fetch distributor contact info if distributorId is provided
  let distributorContact: CustomPackage['distributorContact'] | undefined;
  if (packageData.distributorId) {
    const { data: distributor, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .eq('id', packageData.distributorId)
      .single();

    if (!distError && distributor) {
      // Format location from address
      let location: string | undefined;
      if (distributor.address) {
        const addr = distributor.address;
        const locationParts: string[] = [];

        if (addr.street) locationParts.push(addr.street);
        if (addr.city) locationParts.push(addr.city);
        if (addr.state) locationParts.push(addr.state);
        if (addr.zipCode) locationParts.push(addr.zipCode);
        if (addr.country) locationParts.push(addr.country);

        if (locationParts.length > 0) {
          location = locationParts.join(', ');
        }
      }

      distributorContact = {
        email: distributor.contact_email || undefined,
        phone: distributor.contact_phone || undefined,
        location,
      };
    }
  }

  // Create package in database
  const { data: packageRecord, error: packageError } = await db
    .from('custom_packages')
    .insert({
      package_number: packageNumber,
      pharmacy_id: pharmacyId,
      distributor_name: packageData.distributorName,
      distributor_id: packageData.distributorId || null,
      total_items: totalItems,
      total_estimated_value: totalEstimatedValue,
      notes: packageData.notes || null,
      status: 'draft',
      created_by: userId,
    })
    .select()
    .single();

  if (packageError) {
    throw new AppError(`Failed to create package: ${packageError.message}`, 400);
  }

  // Create package items using normalized items
  const packageItems = normalizedItems.map((item) => ({
    package_id: packageRecord.id,
    ndc: item.ndc,
    product_name: item.productName,
    quantity: item.quantity,
    price_per_unit: item.pricePerUnit,
    total_value: item.totalValue,
  }));

  const { error: itemsError } = await db.from('custom_package_items').insert(packageItems);

  if (itemsError) {
    // Rollback package creation
    await db.from('custom_packages').delete().eq('id', packageRecord.id);
    throw new AppError(`Failed to create package items: ${itemsError.message}`, 400);
  }

  // Return the created package with items
  return {
    id: packageRecord.id,
    packageNumber: packageRecord.package_number,
    pharmacyId: packageRecord.pharmacy_id,
    distributorName: packageRecord.distributor_name,
    distributorId: packageRecord.distributor_id || undefined,
    distributorContact,
    items: normalizedItems,
    totalItems,
    totalEstimatedValue: Math.round(totalEstimatedValue * 100) / 100,
    notes: packageRecord.notes || undefined,
    status: packageRecord.status,
    createdAt: packageRecord.created_at,
    updatedAt: packageRecord.updated_at,
  };
};

// Get all custom packages for a pharmacy
export const getCustomPackages = async (
  pharmacyId: string,
  filters?: {
    status?: string;
    limit?: number;
    offset?: number;
  }
): Promise<CustomPackagesListResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  let query = db
    .from('custom_packages')
    .select('*', { count: 'exact' })
    .eq('pharmacy_id', pharmacyId)
    .order('created_at', { ascending: false });

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset !== undefined) {
    query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1);
  }

  const { data: packages, error: packagesError, count } = await query;

  if (packagesError) {
    throw new AppError(`Failed to fetch packages: ${packagesError.message}`, 400);
  }

  // Get items for each package
  const packageIds = (packages || []).map((pkg: any) => pkg.id);

  let itemsData: any[] = [];
  if (packageIds.length > 0) {
    const { data: items, error: itemsError } = await db
      .from('custom_package_items')
      .select('*')
      .in('package_id', packageIds);

    if (itemsError) {
      throw new AppError(`Failed to fetch package items: ${itemsError.message}`, 400);
    }

    itemsData = items || [];
  }

  // Get distributor contact info for packages with distributor_id
  const distributorIds = (packages || [])
    .map((pkg: any) => pkg.distributor_id)
    .filter((id: string | null) => id !== null);

  let distributorsMap: Record<string, any> = {};
  if (distributorIds.length > 0) {
    const { data: distributors, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .in('id', distributorIds);

    if (!distError && distributors) {
      distributors.forEach((dist) => {
        let location: string | undefined;
        if (dist.address) {
          const addr = dist.address;
          const locationParts: string[] = [];

          if (addr.street) locationParts.push(addr.street);
          if (addr.city) locationParts.push(addr.city);
          if (addr.state) locationParts.push(addr.state);
          if (addr.zipCode) locationParts.push(addr.zipCode);
          if (addr.country) locationParts.push(addr.country);

          if (locationParts.length > 0) {
            location = locationParts.join(', ');
          }
        }

        distributorsMap[dist.id] = {
          email: dist.contact_email || undefined,
          phone: dist.contact_phone || undefined,
          location,
        };
      });
    }
  }

  // Group items by package_id
  const itemsByPackage: Record<string, CustomPackageItem[]> = {};
  itemsData.forEach((item: any) => {
    if (!itemsByPackage[item.package_id]) {
      itemsByPackage[item.package_id] = [];
    }
    itemsByPackage[item.package_id].push({
      ndc: item.ndc,
      productName: item.product_name,
      quantity: item.quantity,
      pricePerUnit: item.price_per_unit,
      totalValue: item.total_value,
    });
  });

  // Build response
  const packagesWithItems: CustomPackage[] = (packages || []).map((pkg: any) => ({
    id: pkg.id,
    packageNumber: pkg.package_number,
    pharmacyId: pkg.pharmacy_id,
    distributorName: pkg.distributor_name,
    distributorId: pkg.distributor_id || undefined,
    distributorContact: pkg.distributor_id ? distributorsMap[pkg.distributor_id] : undefined,
    items: itemsByPackage[pkg.id] || [],
    totalItems: pkg.total_items,
    totalEstimatedValue: pkg.total_estimated_value,
    notes: pkg.notes || undefined,
    status: pkg.status,
    createdAt: pkg.created_at,
    updatedAt: pkg.updated_at,
  }));

  return {
    packages: packagesWithItems,
    total: count || 0,
  };
};

// Get a single custom package by ID
export const getCustomPackageById = async (
  pharmacyId: string,
  packageId: string
): Promise<CustomPackage> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { data: packageRecord, error: packageError } = await db
    .from('custom_packages')
    .select('*')
    .eq('id', packageId)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (packageError) {
    throw new AppError(`Package not found: ${packageError.message}`, 404);
  }

  // Get package items
  const { data: items, error: itemsError } = await db
    .from('custom_package_items')
    .select('*')
    .eq('package_id', packageId);

  if (itemsError) {
    throw new AppError(`Failed to fetch package items: ${itemsError.message}`, 400);
  }

  // Get distributor contact info if distributor_id exists
  let distributorContact: CustomPackage['distributorContact'] | undefined;
  if (packageRecord.distributor_id) {
    const { data: distributor, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .eq('id', packageRecord.distributor_id)
      .single();

    if (!distError && distributor) {
      let location: string | undefined;
      if (distributor.address) {
        const addr = distributor.address;
        const locationParts: string[] = [];

        if (addr.street) locationParts.push(addr.street);
        if (addr.city) locationParts.push(addr.city);
        if (addr.state) locationParts.push(addr.state);
        if (addr.zipCode) locationParts.push(addr.zipCode);
        if (addr.country) locationParts.push(addr.country);

        if (locationParts.length > 0) {
          location = locationParts.join(', ');
        }
      }

      distributorContact = {
        email: distributor.contact_email || undefined,
        phone: distributor.contact_phone || undefined,
        location,
      };
    }
  }

  return {
    id: packageRecord.id,
    packageNumber: packageRecord.package_number,
    pharmacyId: packageRecord.pharmacy_id,
    distributorName: packageRecord.distributor_name,
    distributorId: packageRecord.distributor_id || undefined,
    distributorContact,
    items: (items || []).map((item: any) => ({
      ndc: item.ndc,
      productName: item.product_name,
      quantity: item.quantity,
      pricePerUnit: item.price_per_unit,
      totalValue: item.total_value,
    })),
    totalItems: packageRecord.total_items,
    totalEstimatedValue: packageRecord.total_estimated_value,
    notes: packageRecord.notes || undefined,
    status: packageRecord.status,
    createdAt: packageRecord.created_at,
    updatedAt: packageRecord.updated_at,
  };
};

// Delete a custom package
export const deleteCustomPackage = async (
  pharmacyId: string,
  packageId: string
): Promise<void> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Check if package exists and belongs to pharmacy
  const { data: packageRecord, error: checkError } = await db
    .from('custom_packages')
    .select('id, status')
    .eq('id', packageId)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (checkError || !packageRecord) {
    throw new AppError('Package not found or you do not have permission to delete it', 404);
  }

  // Only allow deletion of draft packages
  if (packageRecord.status !== 'draft') {
    throw new AppError(`Cannot delete package with status: ${packageRecord.status}. Only draft packages can be deleted.`, 400);
  }

  // Delete package (items will be deleted automatically due to CASCADE)
  const { error: deleteError } = await db
    .from('custom_packages')
    .delete()
    .eq('id', packageId)
    .eq('pharmacy_id', pharmacyId);

  if (deleteError) {
    throw new AppError(`Failed to delete package: ${deleteError.message}`, 400);
  }
};

