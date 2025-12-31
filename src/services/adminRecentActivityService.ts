import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/appError';

// Interface for pharmacy in activity
export interface ActivityPharmacy {
  id: string;
  name: string;
  pharmacyName: string;
  email: string;
}

// Interface for activity record
export interface ActivityRecord {
  id: string;
  activityType: 'document_uploaded' | 'product_added';
  entityId: string;
  entityName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  pharmacy: ActivityPharmacy;
}

// Interface for pagination
export interface Pagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Interface for activity stats
export interface ActivityStats {
  todayCount: number;
  thisWeekCount: number;
  totalCount: number;
}

// Interface for filters
export interface ActivityFilters {
  activityType: string | null;
  pharmacyId: string | null;
}

// Interface for recent activity response
export interface RecentActivityResponse {
  activities: ActivityRecord[];
  pagination: Pagination;
  stats: ActivityStats;
  filters: ActivityFilters;
  generatedAt: string;
}

/**
 * Get admin recent activity
 * Uses PostgreSQL RPC function - no custom JS logic
 * @param activityType - Optional filter by activity type
 * @param limit - Number of records to return (default: 20)
 * @param offset - Offset for pagination (default: 0)
 * @param pharmacyId - Optional filter by pharmacy ID
 */
export const getAdminRecentActivity = async (
  activityType?: string,
  limit: number = 20,
  offset: number = 0,
  pharmacyId?: string
): Promise<RecentActivityResponse> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  console.log(`📋 Fetching admin recent activity via RPC (type: ${activityType || 'all'}, limit: ${limit}, offset: ${offset}, pharmacyId: ${pharmacyId || 'all'})`);

  // Call PostgreSQL function - all logic done in database
  const { data, error } = await db.rpc('get_admin_recent_activity', {
    p_activity_type: activityType || null,
    p_limit: limit,
    p_offset: offset,
    p_pharmacy_id: pharmacyId || null,
  });

  if (error) {
    throw new AppError(`Failed to fetch admin recent activity: ${error.message}`, 400);
  }

  if (!data) {
    throw new AppError('No data returned from admin recent activity', 500);
  }

  console.log('✅ Admin recent activity fetched successfully');

  // Return database result directly - response structure matches interface
  return {
    activities: data.activities || [],
    pagination: {
      total: data.pagination.total,
      limit: data.pagination.limit,
      offset: data.pagination.offset,
      hasMore: data.pagination.hasMore,
    },
    stats: {
      todayCount: data.stats.todayCount,
      thisWeekCount: data.stats.thisWeekCount,
      totalCount: data.stats.totalCount,
    },
    filters: {
      activityType: data.filters.activityType,
      pharmacyId: data.filters.pharmacyId,
    },
    generatedAt: data.generatedAt,
  };
};

