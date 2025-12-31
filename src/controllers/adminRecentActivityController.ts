import { Request, Response, NextFunction } from 'express';
import { getAdminRecentActivity } from '../services/adminRecentActivityService';
import { catchAsync } from '../utils/catchAsync';

/**
 * Get admin recent activity
 * Returns activity records for:
 * - Document uploads by pharmacies
 * - Product additions by pharmacies
 * 
 * Supports filtering by activity type and pharmacy
 * Supports pagination via limit and offset
 */
export const getAdminRecentActivityHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get optional activity type filter
    const activityType = req.query.activityType as string | undefined;
    
    // Validate activity type if provided
    if (activityType && !['document_uploaded', 'product_added', 'pharmacy_registered'].includes(activityType)) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid activity type. Must be "document_uploaded", "product_added", or "pharmacy_registered"',
      });
      return;
    }

    // Get pagination parameters
    let limit = parseInt(req.query.limit as string, 10) || 20;
    let offset = parseInt(req.query.offset as string, 10) || 0;
    
    // Validate and cap limit
    if (limit < 1) limit = 1;
    if (limit > 100) limit = 100;
    
    // Validate offset
    if (offset < 0) offset = 0;

    // Get optional pharmacy ID filter
    const pharmacyId = req.query.pharmacyId as string | undefined;

    const activityData = await getAdminRecentActivity(activityType, limit, offset, pharmacyId);

    res.status(200).json({
      status: 'success',
      data: activityData,
    });
  }
);

