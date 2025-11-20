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

  return items || [];
};

