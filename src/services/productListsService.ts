import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface ProductListItem {
  id: string;
  ndc: string;
  product_name: string;
  full_units: number;
  partial_units: number;
  quantity: number; // Calculated as full_units + partial_units
  lot_number?: string;
  expiration_date?: string;
  notes?: string;
  added_at: string;
  added_by?: string;
}

// Add product list item directly (no list dependency)
export const addProductListItem = async (
  pharmacyId: string,
  item: {
    ndc: string;
    product_name: string;
    full_units: number;
    partial_units: number;
    lot_number?: string;
    expiration_date?: string;
    notes?: string;
  }
): Promise<ProductListItem> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  console.log('💾 Adding item directly to product_list_items:', {
    pharmacy_id: pharmacyId,
    ndc: item.ndc,
    product_name: item.product_name,
    full_units: item.full_units,
    partial_units: item.partial_units,
  });

  const { data, error } = await db
    .from('product_list_items')
    .insert({
      ndc: item.ndc,
      product_name: item.product_name,
      full_units: item.full_units,
      partial_units: item.partial_units,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      notes: item.notes,
      added_by: pharmacyId,
    })
    .select('id, ndc, product_name, full_units, partial_units, lot_number, expiration_date, notes, added_at, added_by')
    .single();

  if (error) {
    console.error('❌ Database error:', error);
    throw new AppError(`Failed to add product list item: ${error.message}`, 400);
  }

  console.log('✅ Item added to product_list_items:', data);
  
  // Add quantity field (sum of full_units and partial_units)
  return {
    ...data,
    quantity: (data.full_units || 0) + (data.partial_units || 0),
  };
};

// Remove item from product list
export const removeItemFromProductList = async (itemId: string): Promise<void> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { error } = await db
    .from('product_list_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    throw new AppError(`Failed to remove item from product list: ${error.message}`, 400);
  }
};

// Get all product list items directly for a pharmacy
// Subtracts quantities used in ALL packages (pending and created) and removes items with zero remaining quantity
export const getProductListItems = async (pharmacyId: string): Promise<ProductListItem[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Get all items for this pharmacy (filtered by added_by)
  const { data: items, error } = await db
    .from('product_list_items')
    .select('id, ndc, product_name, full_units, partial_units, lot_number, expiration_date, notes, added_at, added_by')
    .eq('added_by', pharmacyId)
    .order('added_at', { ascending: false });

  if (error) {
    throw new AppError(`Failed to fetch product list items: ${error.message}`, 400);
  }

  if (!items || items.length === 0) {
    return [];
  }

  // Get ALL packages for this pharmacy (both pending and created)
  // Items are "reserved" when added to any package
  const { data: allPackages, error: packagesError } = await db
    .from('custom_packages')
    .select('id, status')
    .eq('pharmacy_id', pharmacyId);

  if (packagesError) {
    throw new AppError(`Failed to fetch packages: ${packagesError.message}`, 400);
  }

  const allPackageIds = (allPackages || []).map((pkg: any) => pkg.id);

  // If there are no packages, return all items with their full quantities
  if (allPackageIds.length === 0) {
    return items.map((item: any) => ({
      ...item,
      quantity: (item.full_units || 0) + (item.partial_units || 0),
    }));
  }

  // Get all items from ALL packages to calculate quantities used
  const { data: packageItems, error: packageItemsError } = await db
    .from('custom_package_items')
    .select('ndc, quantity')
    .in('package_id', allPackageIds);

  if (packageItemsError) {
    throw new AppError(`Failed to fetch package items: ${packageItemsError.message}`, 400);
  }

  // Build a map of NDC to total quantity used in packages
  // Use normalized NDC (without dashes) for matching
  const usedQuantityMap: Record<string, number> = {};
  (packageItems || []).forEach((pkgItem: any) => {
    const normalizedNdc = String(pkgItem.ndc).replace(/-/g, '').trim();
    if (!usedQuantityMap[normalizedNdc]) {
      usedQuantityMap[normalizedNdc] = 0;
    }
    usedQuantityMap[normalizedNdc] += pkgItem.quantity || 0;
  });

  console.log('\n========== PRODUCT LIST ITEMS DEBUG ==========');
  console.log('📦 Package items used by NDC:', usedQuantityMap);
  console.log('📋 Product list items from DB:', items.map((i: any) => ({
    ndc: i.ndc,
    normalized: String(i.ndc).replace(/-/g, '').trim(),
    full: i.full_units,
    partial: i.partial_units,
    total: (i.full_units || 0) + (i.partial_units || 0)
  })));

  // Track remaining "used" quantity to consume per NDC
  // This handles multiple items with the same NDC correctly
  const remainingUsedMap: Record<string, number> = { ...usedQuantityMap };

  // Process each item: subtract used quantities and filter out items with remaining <= 0
  const result: ProductListItem[] = [];
  
  for (const item of items) {
    const normalizedItemNdc = String(item.ndc).replace(/-/g, '').trim();
    const originalFullUnits = item.full_units || 0;
    const originalPartialUnits = item.partial_units || 0;
    const itemQuantity = originalFullUnits + originalPartialUnits;
    
    // Get how much is still "to be consumed" for this NDC
    const toConsume = remainingUsedMap[normalizedItemNdc] || 0;
    
    // Calculate how much to subtract from THIS item (up to item's quantity)
    const subtractFromItem = Math.min(toConsume, itemQuantity);
    const remainingQuantity = itemQuantity - subtractFromItem;
    
    // Update the remaining "to consume" for this NDC
    remainingUsedMap[normalizedItemNdc] = Math.max(0, toConsume - subtractFromItem);

    console.log(`\n📊 Processing: NDC=${item.ndc} (normalized: ${normalizedItemNdc})`);
    console.log(`   DB values: full_units=${originalFullUnits}, partial_units=${originalPartialUnits}`);
    console.log(`   Calculation: itemQty=${itemQuantity}, toConsume=${toConsume}, subtract=${subtractFromItem}`);
    console.log(`   Result: remainingQuantity=${remainingQuantity}`);

    // Only remove if remaining quantity is 0 or negative (completely used)
    if (remainingQuantity <= 0) {
      console.log(`   ❌ REMOVING - remaining (${remainingQuantity}) <= 0`);
      continue;
    }

    // Calculate adjusted full_units and partial_units
    let adjustedFullUnits = originalFullUnits;
    let adjustedPartialUnits = originalPartialUnits;

    if (originalFullUnits > 0 && originalPartialUnits === 0) {
      // Full units only - subtract from full_units
      adjustedFullUnits = Math.max(0, originalFullUnits - subtractFromItem);
    } else if (originalPartialUnits > 0 && originalFullUnits === 0) {
      // Partial units only - subtract from partial_units
      adjustedPartialUnits = Math.max(0, originalPartialUnits - subtractFromItem);
    }

    console.log(`   ✅ KEEPING - full_units=${adjustedFullUnits}, partial_units=${adjustedPartialUnits}, quantity=${remainingQuantity}`);

    result.push({
      ...item,
      full_units: adjustedFullUnits,
      partial_units: adjustedPartialUnits,
      quantity: remainingQuantity,
    });
  }

  console.log(`\n========== RESULT ==========`);
  console.log(`✅ Returning ${result.length} items (removed ${items.length - result.length} fully used)`);
  console.log('========================================\n');

  return result;
};

// Update product list item
export const updateProductListItem = async (
  itemId: string,
  pharmacyId: string,
  updates: {
    ndc?: string;
    product_name?: string;
    full_units?: number;
    partial_units?: number;
    lot_number?: string;
    expiration_date?: string;
    notes?: string;
  }
): Promise<ProductListItem> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // First, verify the item exists and belongs to the pharmacy
  const { data: existingItem, error: fetchError } = await db
    .from('product_list_items')
    .select('id, added_by, full_units, partial_units')
    .eq('id', itemId)
    .single();

  if (fetchError || !existingItem) {
    throw new AppError('Product list item not found', 404);
  }

  if (existingItem.added_by !== pharmacyId) {
    throw new AppError('You do not have permission to update this item', 403);
  }

  // Build update object with only provided fields
  const updateData: any = {};
  if (updates.ndc !== undefined) updateData.ndc = updates.ndc;
  if (updates.product_name !== undefined) updateData.product_name = updates.product_name;
  if (updates.lot_number !== undefined) updateData.lot_number = updates.lot_number;
  if (updates.expiration_date !== undefined) updateData.expiration_date = updates.expiration_date;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

  // Handle full_units and partial_units updates
  // If either is being updated, we need to ensure one is 0 and the other is > 0
  if (updates.full_units !== undefined || updates.partial_units !== undefined) {
    const newFullUnits = updates.full_units !== undefined ? updates.full_units : existingItem.full_units;
    const newPartialUnits = updates.partial_units !== undefined ? updates.partial_units : existingItem.partial_units;

    // Validate: one must be 0 and the other must be > 0
    if (!((newFullUnits === 0 && newPartialUnits > 0) || (newFullUnits > 0 && newPartialUnits === 0))) {
      throw new AppError('One of full_units or partial_units must be 0, and the other must be greater than 0', 400);
    }

    if (updates.full_units !== undefined) updateData.full_units = newFullUnits;
    if (updates.partial_units !== undefined) updateData.partial_units = newPartialUnits;
  }

  if (Object.keys(updateData).length === 0) {
    throw new AppError('No fields provided to update', 400);
  }

  console.log('💾 Updating product list item:', {
    item_id: itemId,
    updates: updateData,
  });

  const { data, error } = await db
    .from('product_list_items')
    .update(updateData)
    .eq('id', itemId)
    .select('id, ndc, product_name, full_units, partial_units, lot_number, expiration_date, notes, added_at, added_by')
    .single();

  if (error) {
    console.error('❌ Database error:', error);
    throw new AppError(`Failed to update product list item: ${error.message}`, 400);
  }

  console.log('✅ Item updated in product_list_items:', data);
  
  // Add quantity field (sum of full_units and partial_units)
  return {
    ...data,
    quantity: (data.full_units || 0) + (data.partial_units || 0),
  };
};

// Clear all product list items for a pharmacy
export const clearAllProductListItems = async (pharmacyId: string): Promise<{ deletedCount: number }> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // First, get count of items to be deleted
  const { count, error: countError } = await db
    .from('product_list_items')
    .select('*', { count: 'exact', head: true })
    .eq('added_by', pharmacyId);

  if (countError) {
    throw new AppError(`Failed to count product list items: ${countError.message}`, 400);
  }

  const deletedCount = count || 0;

  // Delete all items for this pharmacy
  const { error } = await db
    .from('product_list_items')
    .delete()
    .eq('added_by', pharmacyId);

  if (error) {
    throw new AppError(`Failed to clear product list items: ${error.message}`, 400);
  }

  return { deletedCount };
};

