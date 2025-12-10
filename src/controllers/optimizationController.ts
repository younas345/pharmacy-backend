import { Request, Response, NextFunction } from 'express';
import { getOptimizationRecommendations, getPackageRecommendations, getPackageRecommendationsByNdcs, getDistributorSuggestionsByNdc, getDistributorSuggestionsByMultipleNdcs } from '../services/optimizationService';
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

    // Get FullCount and PartialCount query parameters (comma-separated, matching NDC order)
    const fullCountParam = req.query.FullCount as string | undefined;
    const partialCountParam = req.query.PartialCount as string | undefined;

    // Parse comma-separated values
    const fullCounts = fullCountParam 
      ? fullCountParam.split(',').map(v => v.trim()).filter(v => v.length > 0).map(v => Number(v))
      : undefined;
    const partialCounts = partialCountParam 
      ? partialCountParam.split(',').map(v => v.trim()).filter(v => v.length > 0).map(v => Number(v))
      : undefined;

    // FullCount and PartialCount are now OPTIONAL in search mode
    // When provided, they filter the return_reports by unit type
    // When NOT provided, all records are fetched and both full/partial prices are returned
    // Validate array lengths only if provided
    if (ndcs && ndcs.length > 0) {
      if (fullCounts && fullCounts.length !== ndcs.length) {
        throw new AppError(`FullCount array length (${fullCounts.length}) must match NDC array length (${ndcs.length})`, 400);
      }

      if (partialCounts && partialCounts.length !== ndcs.length) {
        throw new AppError(`PartialCount array length (${partialCounts.length}) must match NDC array length (${ndcs.length})`, 400);
      }
    }

    const recommendations = await getOptimizationRecommendations(pharmacyId, ndcs, fullCounts, partialCounts);

    res.status(200).json({
      status: 'success',
      data: recommendations,
    });
  }
);

// Get package recommendations
export const getPackageRecommendationsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const packageRecommendations = await getPackageRecommendations(pharmacyId);

    res.status(200).json({
      status: 'success',
      data: packageRecommendations,
    });
  }
);

// Get package recommendations by NDC codes
export const getPackageRecommendationsByNdcsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    // Get NDC parameter (can be single or comma-separated)
    const ndcParam = req.query.ndc as string | undefined;
    
    if (!ndcParam) {
      throw new AppError('NDC parameter is required. Provide single NDC or comma-separated NDCs', 400);
    }

    const ndcs = ndcParam
      .split(',')
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (ndcs.length === 0) {
      throw new AppError('At least one valid NDC is required', 400);
    }

    const packageRecommendations = await getPackageRecommendationsByNdcs(ndcs);

    res.status(200).json({
      status: 'success',
      data: packageRecommendations,
    });
  }
);

// Get distributor suggestions for NDC and quantity
export const getDistributorSuggestionsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const { ndc, product, quantity, items } = req.body;

    // Check if it's multiple NDCs (items array) or single NDC
    if (items && Array.isArray(items)) {
      // Multiple NDCs mode
      if (items.length === 0) {
        throw new AppError('Items array cannot be empty', 400);
      }

      // Validate each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.ndc) {
          throw new AppError(`Item ${i + 1}: NDC is required`, 400);
        }
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new AppError(`Item ${i + 1}: Quantity is required and must be a positive number`, 400);
        }
      }

      const suggestions = await getDistributorSuggestionsByMultipleNdcs(pharmacyId, items);

      res.status(200).json({
        status: 'success',
        data: suggestions,
      });
    } else {
      // Single NDC mode (backward compatibility)
      if (!ndc) {
        throw new AppError('NDC is required in request body (or use items array for multiple NDCs)', 400);
      }

      if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
        throw new AppError('Quantity is required and must be a positive number', 400);
      }

      const suggestions = await getDistributorSuggestionsByNdc(
        pharmacyId,
        ndc,
        quantity,
        product
      );

      res.status(200).json({
        status: 'success',
        data: suggestions,
      });
    }
  }
);

