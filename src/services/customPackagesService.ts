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

// Interface for delivery information
export interface PackageDeliveryInfo {
  deliveryDate?: string; // ISO date string
  receivedBy?: string;
  deliveryCondition?: 'good' | 'damaged' | 'partial' | 'missing_items' | 'other';
  deliveryNotes?: string;
  trackingNumber?: string;
  carrier?: 'UPS' | 'FedEx' | 'USPS' | 'DHL' | 'Other'; // Shipping company that delivered the package
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
  status: boolean;
  deliveryInfo?: PackageDeliveryInfo;
  createdAt: string;
  updatedAt: string;
}

// Interface for custom package list response
export interface CustomPackagesListResponse {
  packages: CustomPackage[];
  total: number;
  stats: {
    totalProducts: number;
    totalValue: number;
    deliveredPackages: number;
    nonDeliveredPackages: number;
  };
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
      status: false,
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
    status?: boolean;
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
  const packagesWithItems: CustomPackage[] = (packages || []).map((pkg: any) => {
    // Build delivery info if package is delivered (status = true)
    let packageDeliveryInfo: PackageDeliveryInfo | undefined;
    if (pkg.status && pkg.delivery_date) {
      packageDeliveryInfo = {
        deliveryDate: pkg.delivery_date,
        receivedBy: pkg.received_by || undefined,
        deliveryCondition: pkg.delivery_condition as PackageDeliveryInfo['deliveryCondition'] | undefined,
        deliveryNotes: pkg.delivery_notes || undefined,
        trackingNumber: pkg.tracking_number || undefined,
        carrier: pkg.carrier as PackageDeliveryInfo['carrier'] | undefined,
      };
    }

    return {
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
      deliveryInfo: packageDeliveryInfo,
      createdAt: pkg.created_at,
      updatedAt: pkg.updated_at,
    };
  });

  // Calculate statistics
  // IMPORTANT: Stats are calculated from ALL packages (not paginated)
  // This ensures stats reflect the complete dataset, not just the current page
  
  // Get count of packages with status true (delivered) - no pagination applied
  const { count: deliveredPackagesCount, error: deliveredCountError } = await db
    .from('custom_packages')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .eq('status', true);

  if (deliveredCountError) {
    throw new AppError(`Failed to fetch delivered packages count: ${deliveredCountError.message}`, 400);
  }

  // Get count of packages with status false (non-delivered) - no pagination applied
  const { count: nonDeliveredPackagesCount, error: nonDeliveredCountError } = await db
    .from('custom_packages')
    .select('*', { count: 'exact', head: true })
    .eq('pharmacy_id', pharmacyId)
    .eq('status', false);

  if (nonDeliveredCountError) {
    throw new AppError(`Failed to fetch non-delivered packages count: ${nonDeliveredCountError.message}`, 400);
  }

  // Get ALL packages with status false for stats calculation
  // No limit/offset applied - this gets ALL records regardless of pagination
  const { data: statusFalsePackages, error: statusFalseError } = await db
    .from('custom_packages')
    .select('total_items, total_estimated_value')
    .eq('pharmacy_id', pharmacyId)
    .eq('status', false);

  if (statusFalseError) {
    throw new AppError(`Failed to fetch status false packages: ${statusFalseError.message}`, 400);
  }

  // Calculate stats for status false packages only
  const totalProducts = (statusFalsePackages || []).reduce((sum, pkg: any) => {
    const items = pkg.total_items || 0;
    return sum + (typeof items === 'number' ? items : parseInt(items.toString()) || 0);
  }, 0);
  
  const totalValue = (statusFalsePackages || []).reduce((sum, pkg: any) => {
    const value = pkg.total_estimated_value;
    if (value === null || value === undefined) return sum;
    const numValue = typeof value === 'number' ? value : parseFloat(value.toString());
    return sum + (isNaN(numValue) ? 0 : numValue);
  }, 0);

  return {
    packages: packagesWithItems,
    total: count || 0,
    stats: {
      totalProducts,
      totalValue: Math.round(totalValue * 100) / 100,
      deliveredPackages: deliveredPackagesCount || 0,
      nonDeliveredPackages: nonDeliveredPackagesCount || 0,
    },
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

  // Build delivery info if package is delivered (status = true)
  let packageDeliveryInfo: PackageDeliveryInfo | undefined;
  if (packageRecord.status && packageRecord.delivery_date) {
    packageDeliveryInfo = {
      deliveryDate: packageRecord.delivery_date,
      receivedBy: packageRecord.received_by || undefined,
      deliveryCondition: packageRecord.delivery_condition as PackageDeliveryInfo['deliveryCondition'] | undefined,
      deliveryNotes: packageRecord.delivery_notes || undefined,
      trackingNumber: packageRecord.tracking_number || undefined,
      carrier: packageRecord.carrier as PackageDeliveryInfo['carrier'] | undefined,
    };
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
    deliveryInfo: packageDeliveryInfo,
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

  // First, check if package exists (without pharmacy_id filter to see if it exists at all)
  const { data: packageExists, error: existsError } = await db
    .from('custom_packages')
    .select('id, status, pharmacy_id')
    .eq('id', packageId)
    .single();

  if (existsError || !packageExists) {
    throw new AppError('Package not found', 404);
  }

  // Check if package belongs to the pharmacy
  if (packageExists.pharmacy_id !== pharmacyId) {
    throw new AppError('You do not have permission to delete this package', 403);
  }

  // Check status - handle both boolean and string values (for migration compatibility)
  const isStatusFalse = packageExists.status === false || 
                        packageExists.status === 'false' || 
                        packageExists.status === 0 ||
                        packageExists.status === 'draft';

  if (!isStatusFalse) {
    throw new AppError(`Cannot delete package with status: ${packageExists.status}. Only packages with status false can be deleted.`, 400);
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

// Mark package as delivered with delivery information
export const updatePackageStatus = async (
  pharmacyId: string,
  packageId: string,
  deliveryInfo?: PackageDeliveryInfo
): Promise<CustomPackage> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Check if package exists and belongs to pharmacy
  const { data: packageRecord, error: checkError } = await db
    .from('custom_packages')
    .select('*')
    .eq('id', packageId)
    .eq('pharmacy_id', pharmacyId)
    .single();

  if (checkError || !packageRecord) {
    throw new AppError('Package not found or you do not have permission to update it', 404);
  }

  // Get current status
  const currentStatus = packageRecord.status === true || packageRecord.status === 'true';
  
  // If marking as delivered (status = true), require delivery information
  if (!currentStatus && !deliveryInfo) {
    throw new AppError('Delivery information is required when marking package as delivered', 400);
  }

  // If marking as delivered, validate required fields
  if (!currentStatus && deliveryInfo) {
    if (!deliveryInfo.deliveryDate) {
      throw new AppError('Delivery date is required', 400);
    }
    if (!deliveryInfo.receivedBy) {
      throw new AppError('Received by (person name) is required', 400);
    }
  }

  // Prepare update data
  const updateData: any = {
    status: !currentStatus, // Toggle status
    updated_at: new Date().toISOString(),
  };

  // If marking as delivered, add delivery information
  if (!currentStatus && deliveryInfo) {
    updateData.delivery_date = deliveryInfo.deliveryDate 
      ? new Date(deliveryInfo.deliveryDate).toISOString() 
      : new Date().toISOString();
    updateData.received_by = deliveryInfo.receivedBy;
    updateData.delivery_condition = deliveryInfo.deliveryCondition || 'good';
    updateData.delivery_notes = deliveryInfo.deliveryNotes || null;
    updateData.tracking_number = deliveryInfo.trackingNumber || null;
    updateData.carrier = deliveryInfo.carrier || null;
  } else if (currentStatus) {
    // If marking as not delivered, clear delivery information
    updateData.delivery_date = null;
    updateData.received_by = null;
    updateData.delivery_condition = null;
    updateData.delivery_notes = null;
    updateData.tracking_number = null;
    updateData.carrier = null;
  }

  // Update package
  const { data: updatedPackage, error: updateError } = await db
    .from('custom_packages')
    .update(updateData)
    .eq('id', packageId)
    .eq('pharmacy_id', pharmacyId)
    .select()
    .single();

  if (updateError) {
    throw new AppError(`Failed to update package status: ${updateError.message}`, 400);
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
  if (updatedPackage.distributor_id) {
    const { data: distributor, error: distError } = await db
      .from('reverse_distributors')
      .select('id, name, contact_email, contact_phone, address')
      .eq('id', updatedPackage.distributor_id)
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

  // Build delivery info if package is delivered
  let packageDeliveryInfo: PackageDeliveryInfo | undefined;
  if (updatedPackage.status && updatedPackage.delivery_date) {
    packageDeliveryInfo = {
      deliveryDate: updatedPackage.delivery_date,
      receivedBy: updatedPackage.received_by || undefined,
      deliveryCondition: updatedPackage.delivery_condition as PackageDeliveryInfo['deliveryCondition'] | undefined,
      deliveryNotes: updatedPackage.delivery_notes || undefined,
      trackingNumber: updatedPackage.tracking_number || undefined,
      carrier: updatedPackage.carrier as PackageDeliveryInfo['carrier'] | undefined,
    };
  }

  return {
    id: updatedPackage.id,
    packageNumber: updatedPackage.package_number,
    pharmacyId: updatedPackage.pharmacy_id,
    distributorName: updatedPackage.distributor_name,
    distributorId: updatedPackage.distributor_id || undefined,
    distributorContact,
    items: (items || []).map((item: any) => ({
      ndc: item.ndc,
      productName: item.product_name,
      quantity: item.quantity,
      pricePerUnit: item.price_per_unit,
      totalValue: item.total_value,
    })),
    totalItems: updatedPackage.total_items,
    totalEstimatedValue: updatedPackage.total_estimated_value,
    notes: updatedPackage.notes || undefined,
    status: updatedPackage.status,
    deliveryInfo: packageDeliveryInfo,
    createdAt: updatedPackage.created_at,
    updatedAt: updatedPackage.updated_at,
  };
};

