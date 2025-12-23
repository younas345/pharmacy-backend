import { Request, Response, NextFunction } from 'express';
import { getAnalytics } from '../services/adminAnalyticsService';
import { catchAsync } from '../utils/catchAsync';

/**
 * Get all analytics data for admin dashboard
 * GET /api/admin/analytics
 */
export const getAnalyticsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await getAnalytics();

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

