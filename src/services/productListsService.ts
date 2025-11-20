import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

export interface ProductListItem {
  id: string;
  product_list_id: string;
  ndc: string;
  product_name: string;
  quantity: number;
  lot_number?: string;
  expiration_date?: string;
  notes?: string;
  added_at: string;
  added_by?: string;
}

export interface ProductList {
  id: string;
  pharmacy_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items?: ProductListItem[];
}

export interface CreateProductListInput {
  pharmacy_id: string;
  name: string;
  items?: Array<{
    ndc: string;
    product_name: string;
    quantity: number;
    lot_number?: string;
    expiration_date?: string;
    notes?: string;
  }>;
}

// Get default product list for a pharmacy (or create if doesn't exist)
export const getDefaultProductList = async (pharmacyId: string): Promise<ProductList> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  console.log('🔍 Looking for default list for pharmacy:', pharmacyId);

  // Try to find existing default list
  const { data: existingList, error: searchError } = await db
    .from('product_lists')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .eq('name', 'My Products')
    .single();

  if (existingList) {
    console.log('✅ Found existing default list:', existingList.id);
    
    // Load items
    const { data: items } = await db
      .from('product_list_items')
      .select('*')
      .eq('product_list_id', existingList.id)
      .order('added_at', { ascending: false });

    console.log(`📦 Loaded ${items?.length || 0} items from list`);

    return {
      ...existingList,
      items: items || [],
    };
  }

  console.log('⚠️ No default list found, creating new one...');

  // Create default list
  const { data: newList, error } = await db
    .from('product_lists')
    .insert({
      pharmacy_id: pharmacyId,
      name: 'My Products',
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Failed to create default list:', error);
    throw new AppError(`Failed to create default product list: ${error.message}`, 400);
  }

  console.log('✅ Created new default list:', newList.id);

  return {
    ...newList,
    items: [],
  };
};

// Add item to product list
export const addItemToProductList = async (
  listId: string,
  item: {
    ndc: string;
    product_name: string;
    quantity: number;
    lot_number?: string;
    expiration_date?: string;
    notes?: string;
    added_by?: string;
  }
): Promise<ProductListItem> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  console.log('💾 Inserting item into product_list_items:', {
    product_list_id: listId,
    ndc: item.ndc,
    product_name: item.product_name,
    quantity: item.quantity,
  });

  const { data, error } = await db
    .from('product_list_items')
    .insert({
      product_list_id: listId,
      ndc: item.ndc,
      product_name: item.product_name,
      quantity: item.quantity,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      notes: item.notes,
      added_by: item.added_by,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Database error:', error);
    throw new AppError(`Failed to add item to product list: ${error.message}`, 400);
  }

  console.log('✅ Item inserted into database:', data);
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

// Get all product list items directly for a pharmacy (simplified API)
export const getProductListItems = async (pharmacyId: string): Promise<ProductListItem[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  // Get or create default list
  const defaultList = await getDefaultProductList(pharmacyId);

  // Get all items from the default list
  const { data: items, error } = await db
    .from('product_list_items')
    .select('*')
    .eq('product_list_id', defaultList.id)
    .order('added_at', { ascending: false });

  if (error) {
    throw new AppError(`Failed to fetch product list items: ${error.message}`, 400);
  }

  return items || [];
};

// Add product list item directly (simplified API - auto-creates list if needed)
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

  // Get or create default list
  const defaultList = await getDefaultProductList(pharmacyId);

  console.log('💾 Adding item directly to product_list_items:', {
    product_list_id: defaultList.id,
    ndc: item.ndc,
    product_name: item.product_name,
    quantity: item.quantity,
  });

  const { data, error } = await db
    .from('product_list_items')
    .insert({
      product_list_id: defaultList.id,
      ndc: item.ndc,
      product_name: item.product_name,
      quantity: item.quantity,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      notes: item.notes,
      added_by: pharmacyId,
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Database error:', error);
    throw new AppError(`Failed to add product list item: ${error.message}`, 400);
  }

  console.log('✅ Item added to product_list_items:', data);
  return data;
};

// Get all product lists for a pharmacy
export const getProductLists = async (pharmacyId: string): Promise<ProductList[]> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { data: lists, error } = await db
    .from('products-lists')
    .select('*')
    .eq('pharmacy_id', pharmacyId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new AppError(`Failed to fetch product lists: ${error.message}`, 400);
  }

  // Load items for each list
  const listsWithItems = await Promise.all(
    (lists || []).map(async (list) => {
      const { data: items } = await db
        .from('product_list_items')
        .select('*')
        .eq('product_list_id', list.id)
        .order('added_at', { ascending: false });

      return {
        ...list,
        items: items || [],
      };
    })
  );

  return listsWithItems;
};

// Create a new product list
export const createProductList = async (input: CreateProductListInput): Promise<ProductList> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  const { data: newList, error } = await db
    .from('product_lists')
    .insert({
      pharmacy_id: input.pharmacy_id,
      name: input.name,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`Failed to create product list: ${error.message}`, 400);
  }

  // Add items if provided
  if (input.items && input.items.length > 0) {
    const items = input.items.map((item) => ({
      product_list_id: newList.id,
      ndc: item.ndc,
      product_name: item.product_name,
      quantity: item.quantity,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      notes: item.notes,
    }));

    await db.from('product_list_items').insert(items);
  }

  return await getProductLists(input.pharmacy_id).then((lists) =>
    lists.find((l) => l.id === newList.id)!
  );
};

