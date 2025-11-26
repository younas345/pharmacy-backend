import { Request, Response, NextFunction } from 'express';
import { getDashboardSummary } from '../services/dashboardService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const getDashboardSummaryHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const summary = await getDashboardSummary(pharmacyId);

    res.status(200).json({
      status: 'success',
      data: summary,
    });
  }
);

