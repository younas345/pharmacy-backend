import { Request, Response, NextFunction } from 'express';
import { getDashboardSummary, getHistoricalEarnings } from '../services/dashboardService';
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

// Get historical earnings for a pharmacy
export const getHistoricalEarningsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    // Get period type (monthly or yearly, default monthly)
    const periodTypeParam = (req.query.periodType as string) || 'monthly';
    const periodType = periodTypeParam === 'yearly' ? 'yearly' : 'monthly';

    // Get periods parameter (default 12, max 60 for monthly, max 10 for yearly)
    let periods = parseInt(req.query.periods as string, 10) || 12;
    if (periods < 1) periods = 1;
    if (periodType === 'yearly') {
      if (periods > 10) periods = 10; // Max 10 years
    } else {
      if (periods > 60) periods = 60; // Max 60 months (5 years)
    }

    const earnings = await getHistoricalEarnings(pharmacyId, periodType, periods);

    res.status(200).json({
      status: 'success',
      data: earnings,
    });
  }
);

