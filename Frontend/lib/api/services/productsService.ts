/**
 * Products/NDC API Service
 */

import { apiClient } from '../client';
import { Product } from '@/types';

export interface ValidateNDCResponse {
  valid: boolean;
  product?: Product;
  error?: string;
  suggestion?: string;
  ndc: string;
}

export interface CreateProductRequest {
  ndc: string;
  product_name: string;
  manufacturer?: string;
  strength?: string;
  dosage_form?: string;
  package_size?: number;
  wac?: number;
  awp?: number;
}

export const productsService = {
  /**
   * Validate NDC format and lookup product
   */
  async validateNDC(ndc: string): Promise<ValidateNDCResponse> {
    // Try POST first (body param)
    try {
      const response = await apiClient.post<any>('/products/validate', { ndc }, false);
      
      // API returns data directly: { valid: true, product: {...}, isNew: true }
      // Check if response has the expected structure
      if (response.valid !== undefined) {
        // Response is already in the correct format
        return response as ValidateNDCResponse;
      }
      
      // If wrapped in status/data format
      if (response.status === 'success' && response.data) {
        return response.data as ValidateNDCResponse;
      }
      
      // If data is directly in response
      if (response.data && response.data.valid !== undefined) {
        return response.data as ValidateNDCResponse;
      }
      
      throw new Error('Invalid response format from API');
    } catch (error: any) {
      // If POST fails, try GET
      if (error.status === 404 || error.status === 400 || error.message) {
        try {
          const response = await apiClient.get<any>('/products/validate', { ndc }, false);
          
          // API returns data directly
          if (response.valid !== undefined) {
            return response as ValidateNDCResponse;
          }
          
          if (response.status === 'success' && response.data) {
            return response.data as ValidateNDCResponse;
          }
          
          if (response.data && response.data.valid !== undefined) {
            return response.data as ValidateNDCResponse;
          }
        } catch (getError: any) {
          throw {
            status: getError.status || 400,
            message: getError.message || 'NDC validation failed',
          };
        }
      }
      throw {
        status: error.status || 400,
        message: error.message || 'NDC validation failed',
      };
    }
  },

  /**
   * Search products
   */
  async searchProducts(searchTerm: string, limit: number = 20): Promise<Product[]> {
    const response = await apiClient.get<Product[]>('/products/search', { search: searchTerm, limit }, false);
    if (response.status === 'success' && response.data) {
      return Array.isArray(response.data) ? response.data : [];
    }
    throw new Error(response.message || 'Failed to search products');
  },

  /**
   * Create or update a product
   */
  async createOrUpdateProduct(data: CreateProductRequest): Promise<Product> {
    const response = await apiClient.post<Product>('/products', data, false);
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create/update product');
  },
};

