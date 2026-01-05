import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Activity {
  id: string;
  activityType: string;
  entityId: string;
  entityName: string;
  metadata?: Record<string, any>;
  createdAt: string;
  pharmacy?: {
    id: string;
    name: string;
    pharmacyName: string;
    email: string;
  };
}

export interface RecentActivityResponse {
  status: string;
  data: {
    activities: Activity[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
    stats?: {
      todayCount: number;
      thisWeekCount: number;
      totalCount: number;
    };
    filters?: {
      activityType?: string;
      pharmacyId?: string;
    };
    generatedAt: string;
  };
}

export interface RecentActivityState {
  activities: Activity[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  } | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: RecentActivityState = {
  activities: [],
  pagination: null,
  isLoading: false,
  error: null,
};

export interface FetchRecentActivityParams {
  limit?: number;
  offset?: number;
  activityType?: string;
  pharmacyId?: string;
}

// Async thunk for fetching recent activity
export const fetchRecentActivity = createAsyncThunk(
  'recentActivity/fetch',
  async (params: FetchRecentActivityParams = {}, { rejectWithValue }) => {
    try {
      const { apiClient } = await import('@/lib/api/apiClient');
      const { cookieUtils } = await import('@/lib/utils/cookies');
      
      // Check if token exists before making the call
      const token = cookieUtils.getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return rejectWithValue('Authentication required. Please login again.');
      }
      
      const queryParams: Record<string, string | number | undefined> = {};

      if (params.limit !== undefined) {
        queryParams.limit = params.limit;
      }
      if (params.offset !== undefined) {
        queryParams.offset = params.offset;
      }
      if (params.activityType) {
        queryParams.activityType = params.activityType;
      }
      if (params.pharmacyId) {
        queryParams.pharmacyId = params.pharmacyId;
      }

      const data: RecentActivityResponse = await apiClient.get<RecentActivityResponse>(
        '/admin/recent-activity',
        true,
        queryParams
      );

      return data.data;
    } catch (error: any) {
      console.error('Error fetching recent activity:', {
        message: error?.message,
        status: error?.status,
        data: error?.data,
        fullError: error
      });
      
      const errorMessage = error?.message || error?.data?.message || 'An error occurred while fetching recent activity';
      return rejectWithValue(errorMessage);
    }
  }
);

const recentActivitySlice = createSlice({
  name: 'recentActivity',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecentActivity.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRecentActivity.fulfilled, (state, action) => {
        state.isLoading = false;
        state.activities = action.payload.activities;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchRecentActivity.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = recentActivitySlice.actions;
export default recentActivitySlice.reducer;

