import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

// ============================================================
// Interfaces
// ============================================================

export interface MetricWithChange {
  value: number;
  change: number;
  changeLabel: string;
}

export interface KeyMetrics {
  totalReturnsValue: MetricWithChange;
  totalReturns: MetricWithChange;
  avgReturnValue: MetricWithChange;
  activePharmacies: MetricWithChange;
}

export interface MonthlyTrendItem {
  month: string;
  monthKey: string;
  totalValue: number;
  itemsCount: number;
}

export interface TopProductItem {
  productName: string;
  totalValue: number;
  totalQuantity: number;
  returnCount: number;
}

export interface DistributorBreakdownItem {
  distributorId: string;
  distributorName: string;
  pharmaciesCount: number;
  totalReturns: number;
  avgReturnValue: number;
  totalValue: number;
}

export interface StateBreakdownItem {
  state: string;
  pharmacies: number;
  totalReturns: number;
  avgReturnValue: number;
  totalValue: number;
}

export interface Charts {
  returnsValueTrend: MonthlyTrendItem[];
  topProducts: TopProductItem[];
}

export interface AnalyticsResponse {
  keyMetrics: KeyMetrics;
  charts: Charts;
  distributorBreakdown: DistributorBreakdownItem[];
  stateBreakdown: StateBreakdownItem[];
  generatedAt: string;
}

// ============================================================
// Service Functions
// ============================================================

/**
 * Get all analytics data for admin dashboard
 * Uses PostgreSQL RPC function - no custom JS logic
 * Returns key metrics, trends, top products, and distributor breakdown
 */
export const getAnalytics = async (): Promise<AnalyticsResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const { data, error } = await supabaseAdmin.rpc('get_admin_analytics');

  if (error) {
    throw new AppError(`Failed to fetch analytics: ${error.message}`, 400);
  }

  if (!data) {
    throw new AppError('No analytics data returned', 500);
  }

  return {
    keyMetrics: data.keyMetrics,
    charts: data.charts,
    distributorBreakdown: data.distributorBreakdown || [],
    stateBreakdown: data.stateBreakdown || [],
    generatedAt: data.generatedAt,
  };
};

