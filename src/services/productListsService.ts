import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface ProductListItem {
  id: string;
  ndc: string;
  product_name: string;
  quantity: number;
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
    quantity: number;
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
    quantity: item.quantity,
  });

  const { data, error } = await db
    .from('product_list_items')
    .insert({
      ndc: item.ndc,
      product_name: item.product_name,
      quantity: item.quantity,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      notes: item.notes,
      added_by: pharmacyId,
    })
    .select('id, ndc, product_name, quantity, lot_number, expiration_date, notes, added_at, added_by')
    .single();

  if (error) {
    console.error('❌ Database error:', error);
    throw new AppError(`Failed to add product list item: ${error.message}`, 400);
  }

  console.log('✅ Item added to product_list_items:', data);
  return data;
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
export const getProductListItems = async (pharmacyId: string): Promise<ProductListItem[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Get all items for this pharmacy (filtered by added_by)
  const { data: items, error } = await db
    .from('product_list_items')
    .select('id, ndc, product_name, quantity, lot_number, expiration_date, notes, added_at, added_by')
    .eq('added_by', pharmacyId)
    .order('added_at', { ascending: false });

  if (error) {
    throw new AppError(`Failed to fetch product list items: ${error.message}`, 400);
  }

  if (!items || items.length === 0) {
    return [];
  }

  // Get all package items for this pharmacy to calculate quantities used in packages
  // First, get all package IDs for this pharmacy
  const { data: packages, error: packagesError } = await db
    .from('custom_packages')
    .select('id')
    .eq('pharmacy_id', pharmacyId);

  if (packagesError) {
    throw new AppError(`Failed to fetch packages: ${packagesError.message}`, 400);
  }

  const packageIds = (packages || []).map((pkg: any) => pkg.id);

  // Get all package items for these packages, grouped by NDC
  let packageItemsByNdc: Record<string, number> = {};
  
  if (packageIds.length > 0) {
    const { data: packageItems, error: packageItemsError } = await db
      .from('custom_package_items')
      .select('ndc, quantity')
      .in('package_id', packageIds);

    if (packageItemsError) {
      throw new AppError(`Failed to fetch package items: ${packageItemsError.message}`, 400);
    }

    // Sum quantities by NDC
    (packageItems || []).forEach((item: any) => {
      const ndc = item.ndc;
      const quantity = item.quantity || 0;
      if (packageItemsByNdc[ndc]) {
        packageItemsByNdc[ndc] += quantity;
      } else {
        packageItemsByNdc[ndc] = quantity;
      }
    });
  }

  // Decrease quantities based on packages
  const adjustedItems = items.map((item) => {
    const usedQuantity = packageItemsByNdc[item.ndc] || 0;
    const adjustedQuantity = Math.max(0, item.quantity - usedQuantity);
    
    return {
      ...item,
      quantity: adjustedQuantity,
    };
  });

  return adjustedItems;
};

// Update product list item
export const updateProductListItem = async (
  itemId: string,
  pharmacyId: string,
  updates: {
    ndc?: string;
    product_name?: string;
    quantity?: number;
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
    .select('id, added_by')
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
  if (updates.quantity !== undefined) updateData.quantity = updates.quantity;
  if (updates.lot_number !== undefined) updateData.lot_number = updates.lot_number;
  if (updates.expiration_date !== undefined) updateData.expiration_date = updates.expiration_date;
  if (updates.notes !== undefined) updateData.notes = updates.notes;

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
    .select('id, ndc, product_name, quantity, lot_number, expiration_date, notes, added_at, added_by')
    .single();

  if (error) {
    console.error('❌ Database error:', error);
    throw new AppError(`Failed to update product list item: ${error.message}`, 400);
  }

  console.log('✅ Item updated in product_list_items:', data);
  return data;
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

