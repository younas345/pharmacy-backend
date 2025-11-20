import { Request, Response, NextFunction } from 'express';
import { getOptimizationRecommendations } from '../services/optimizationService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

// Get optimization recommendations
export const getOptimizationRecommendationsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const recommendations = await getOptimizationRecommendations(pharmacyId);

    res.status(200).json({
      status: 'success',
      data: recommendations,
    });
  }
);

