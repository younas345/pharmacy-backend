import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import * as adminMarketplaceService from '../services/adminMarketplaceService';

// ============================================================
// Extended Request interface for admin authentication
// ============================================================
interface AdminRequest extends Request {
  adminId?: string;
  adminEmail?: string;
  adminName?: string;
  adminRole?: string;
}

// ============================================================
// GET /api/admin/marketplace - Get list of marketplace deals
// ============================================================
export const getMarketplaceDealsHandler = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const {
      page = '1',
      limit = '12',
      search,
      category,
      status,
      sortBy = 'posted_date',
      sortOrder = 'desc',
    } = req.query;

    const result = await adminMarketplaceService.getMarketplaceDeals(
      parseInt(page as string, 10),
      parseInt(limit as string, 10),
      search as string,
      category as string,
      status as string,
      sortBy as string,
      sortOrder as string
    );

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

// ============================================================
// GET /api/admin/marketplace/stats - Get marketplace statistics
// ============================================================
export const getMarketplaceStatsHandler = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const stats = await adminMarketplaceService.getMarketplaceStats();

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  }
);

// ============================================================
// GET /api/admin/marketplace/categories - Get all categories
// ============================================================
export const getMarketplaceCategoriesHandler = catchAsync(
  async (_req: Request, res: Response, _next: NextFunction) => {
    const categories = await adminMarketplaceService.getMarketplaceCategories();

    res.status(200).json({
      status: 'success',
      data: {
        categories,
      },
    });
  }
);

// ============================================================
// GET /api/admin/marketplace/:id - Get deal by ID
// ============================================================
export const getMarketplaceDealByIdHandler = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Deal ID is required', 400);
    }

    const deal = await adminMarketplaceService.getMarketplaceDealById(id);

    res.status(200).json({
      status: 'success',
      data: {
        deal,
      },
    });
  }
);

// ============================================================
// POST /api/admin/marketplace - Create new deal
// ============================================================
export const createMarketplaceDealHandler = catchAsync(
  async (req: AdminRequest, res: Response, _next: NextFunction) => {
    const {
      productName,
      category,
      quantity,
      unit,
      originalPrice,
      dealPrice,
      distributorName,
      expiryDate,
      ndc,
      distributorId,
      notes,
    } = req.body;

    if (!productName || !category || !quantity || !unit || !originalPrice || !dealPrice || !distributorName || !expiryDate) {
      throw new AppError(
        'Product name, category, quantity, unit, original price, deal price, distributor name, and expiry date are required',
        400
      );
    }

    const deal = await adminMarketplaceService.createMarketplaceDeal({
      productName,
      category,
      quantity,
      unit,
      originalPrice,
      dealPrice,
      distributorName,
      expiryDate,
      ndc,
      distributorId,
      notes,
      createdBy: req.adminId,
    });

    res.status(201).json({
      status: 'success',
      message: 'Deal created successfully',
      data: {
        deal,
      },
    });
  }
);

// ============================================================
// PATCH /api/admin/marketplace/:id - Update deal
// ============================================================
export const updateMarketplaceDealHandler = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;
    const {
      productName,
      category,
      quantity,
      unit,
      originalPrice,
      dealPrice,
      distributorName,
      expiryDate,
      ndc,
      status,
      notes,
    } = req.body;

    if (!id) {
      throw new AppError('Deal ID is required', 400);
    }

    const deal = await adminMarketplaceService.updateMarketplaceDeal(id, {
      productName,
      category,
      quantity,
      unit,
      originalPrice,
      dealPrice,
      distributorName,
      expiryDate,
      ndc,
      status,
      notes,
    });

    res.status(200).json({
      status: 'success',
      message: 'Deal updated successfully',
      data: {
        deal,
      },
    });
  }
);

// ============================================================
// PATCH /api/admin/marketplace/:id/sold - Mark deal as sold
// ============================================================
export const markDealAsSoldHandler = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Deal ID is required', 400);
    }

    await adminMarketplaceService.markDealAsSold(id);

    res.status(200).json({
      status: 'success',
      message: 'Deal marked as sold successfully',
    });
  }
);

// ============================================================
// DELETE /api/admin/marketplace/:id - Delete deal
// ============================================================
export const deleteMarketplaceDealHandler = catchAsync(
  async (req: Request, res: Response, _next: NextFunction) => {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Deal ID is required', 400);
    }

    await adminMarketplaceService.deleteMarketplaceDeal(id);

    res.status(200).json({
      status: 'success',
      message: 'Deal deleted successfully',
    });
  }
);

