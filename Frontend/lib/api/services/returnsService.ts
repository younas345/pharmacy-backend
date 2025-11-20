/**
 * Returns API Service
 */

import { apiClient } from '../client';
import { Return, ReturnItem } from '@/types';

export interface CreateReturnRequest {
  items: Array<{
    ndc: string;
    product_name?: string;
    lot_number: string;
    expiration_date: string;
    quantity: number;
    unit?: string;
    reason?: string;
  }>;
  notes?: string;
}

export interface UpdateReturnRequest {
  status?: string;
  notes?: string;
  items?: ReturnItem[];
}

export interface ReturnsFilters {
  status?: string;
  limit?: number;
  offset?: number;
}

export const returnsService = {
  /**
   * Get all returns
   */
  async getReturns(filters?: ReturnsFilters): Promise<{ returns: Return[]; total: number }> {
    const response = await apiClient.get<Return[]>('/returns', filters);
    if (response.status === 'success' && response.data) {
      return {
        returns: Array.isArray(response.data) ? response.data : [],
        total: response.total || 0,
      };
    }
    throw new Error(response.message || 'Failed to fetch returns');
  },

  /**
   * Get return by ID
   */
  async getReturnById(id: string): Promise<Return> {
    const response = await apiClient.get<Return>(`/returns/${id}`);
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch return');
  },

  /**
   * Create a new return
   */
  async createReturn(data: CreateReturnRequest): Promise<Return> {
    const response = await apiClient.post<Return>('/returns', data);
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to create return');
  },

  /**
   * Update a return
   */
  async updateReturn(id: string, data: UpdateReturnRequest): Promise<Return> {
    const response = await apiClient.patch<Return>(`/returns/${id}`, data);
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to update return');
  },

  /**
   * Delete a return
   */
  async deleteReturn(id: string): Promise<void> {
    const response = await apiClient.delete(`/returns/${id}`);
    if (response.status !== 'success') {
      throw new Error(response.message || 'Failed to delete return');
    }
  },
};

