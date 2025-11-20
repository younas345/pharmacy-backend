/**
 * Product Lists API Service
 */

import { apiClient } from '../client';

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

export interface ProductList {
  id: string;
  pharmacy_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  items?: ProductListItem[];
}

export const productListsService = {
  /**
   * Get default product list (My Products)
   */
  async getDefaultList(): Promise<ProductList> {
    const response = await apiClient.get<ProductList>('/product-lists/default');
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch default product list');
  },

  /**
   * Get all product lists
   */
  async getAllLists(): Promise<ProductList[]> {
    const response = await apiClient.get<ProductList[]>('/product-lists');
    if (response.status === 'success' && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.message || 'Failed to fetch product lists');
  },

  /**
   * Get all product list items directly
   * Uses GET /api/product-lists which returns items array
   */
  async getItems(): Promise<ProductListItem[]> {
    const response = await apiClient.get<ProductListItem[]>('/product-lists');
    if (response.status === 'success' && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.message || 'Failed to fetch product list items');
  },

  /**
   * Add item to product list directly
   * Uses POST /api/product-lists with the specified payload format
   */
  async addItem(
    listId: string,
    item: {
      ndc: string;
      product_name: string;
      quantity: number;
      lot_number?: string;
      expiration_date?: string;
      notes?: string;
    }
  ): Promise<ProductListItem> {
    // Use POST /api/product-lists with the exact payload format specified
    // Backend will detect ndc/product_name and treat it as adding an item
    const response = await apiClient.post<ProductListItem>('/product-lists', {
      ndc: item.ndc,
      product_name: item.product_name,
      quantity: item.quantity,
      lot_number: item.lot_number,
      expiration_date: item.expiration_date,
      notes: item.notes,
      // pharmacy_id is automatically added by apiClient
    });
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to add item to list');
  },

  /**
   * Remove item from product list
   */
  async removeItem(itemId: string): Promise<void> {
    const response = await apiClient.delete(`/product-lists/items/${itemId}`);
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to remove item from list');
    }
  },

  /**
   * Create a new product list
   */
  async createList(
    name: string,
    items?: Array<{
      ndc: string;
      product_name: string;
      quantity: number;
      lot_number?: string;
      expiration_date?: string;
      notes?: string;
    }>
  ): Promise<ProductList> {
    const response = await apiClient.post<ProductList>('/product-lists', {
      name,
      items,
    });
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create product list');
  },
};

