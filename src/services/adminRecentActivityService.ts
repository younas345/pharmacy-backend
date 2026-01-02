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
  activityType: 'document_uploaded' | 'product_added' | 'pharmacy_registered';
  entityId: string;
  entityName: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
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
  unreadCount: number;
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
      unreadCount: data.stats.unreadCount,
    },
    filters: {
      activityType: data.filters.activityType,
      pharmacyId: data.filters.pharmacyId,
    },
    generatedAt: data.generatedAt,
  };
};

/**
 * Mark all admin activities as read
 */
export const markAllActivitiesAsRead = async (): Promise<{
  success: boolean;
  message: string;
  updatedCount: number;
  markedAt: string;
}> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  console.log('📋 Marking all admin activities as read...');

  const { data, error } = await db.rpc('mark_all_admin_activities_read');

  if (error) {
    throw new AppError(`Failed to mark activities as read: ${error.message}`, 400);
  }

  console.log(`✅ Marked ${data.updatedCount} activities as read`);

  return {
    success: data.success,
    message: data.message,
    updatedCount: data.updatedCount,
    markedAt: data.markedAt,
  };
};

/**
 * Mark a single admin activity as read
 */
export const markActivityAsRead = async (activityId: string): Promise<{
  success: boolean;
  message: string;
  activityId?: string;
  markedAt?: string;
}> => {
  if (!supabaseAdmin) {
    throw new AppError('Supabase admin client not configured', 500);
  }

  const db = supabaseAdmin;

  console.log(`📋 Marking activity ${activityId} as read...`);

  const { data, error } = await db.rpc('mark_admin_activity_read', {
    p_activity_id: activityId,
  });

  if (error) {
    throw new AppError(`Failed to mark activity as read: ${error.message}`, 400);
  }

  if (!data.success) {
    throw new AppError(data.message, 404);
  }

  console.log(`✅ Marked activity ${activityId} as read`);

  return {
    success: data.success,
    message: data.message,
    activityId: data.activityId,
    markedAt: data.markedAt,
  };
};

