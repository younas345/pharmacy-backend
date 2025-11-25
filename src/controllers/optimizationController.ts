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

    // Get NDC search parameter (can be single or comma-separated)
    const ndcParam = req.query.ndc as string | undefined;
    const ndcs = ndcParam 
      ? ndcParam.split(',').map(n => n.trim()).filter(n => n.length > 0)
      : undefined;

    const recommendations = await getOptimizationRecommendations(pharmacyId, ndcs);

    res.status(200).json({
      status: 'success',
      data: recommendations,
    });
  }
);

