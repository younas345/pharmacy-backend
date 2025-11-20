/**
 * Dashboard API Service
 */

import { apiClient } from '../client';

export interface DashboardSummary {
  totalDocuments: number;
  totalDistributors: number;
  totalNDCs: number;
  totalDataPoints: number;
  activeInventory: number;
  totalReturns: number;
  pendingReturns: number;
  completedReturns: number;
  totalEstimatedCredits: number;
  expiringItems: number;
}

export const dashboardService = {
  /**
   * Get dashboard summary statistics
   */
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get<DashboardSummary>('/dashboard/summary');
    if (response.status === 'success' && response.data) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to fetch dashboard summary');
  },
};

