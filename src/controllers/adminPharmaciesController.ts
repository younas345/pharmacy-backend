import { Request, Response, NextFunction } from 'express';
import {
  getPharmaciesList,
  getPharmacyById,
  updatePharmacy,
  updatePharmacyStatus,
} from '../services/adminPharmaciesService';
import { AppError } from '../utils/appError';

/**
 * Get list of pharmacies
 * GET /api/admin/pharmacies
 */
export const getPharmaciesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { search, status = 'all', page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = Math.min(parseInt(limit as string, 10) || 20, 100); // Max 100

    const result = await getPharmaciesList(
      search as string | undefined,
      status as string,
      pageNum,
      limitNum
    );

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single pharmacy by ID
 * GET /api/admin/pharmacies/:id
 */
export const getPharmacyByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const result = await getPharmacyById(id);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update pharmacy details
 * PUT /api/admin/pharmacies/:id
 */
export const updatePharmacyHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    if (!id) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    // Validate that at least one field is being updated
    const allowedFields = [
      'businessName',
      'owner',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
      'licenseNumber',
    ];

    const hasValidUpdates = Object.keys(updates).some((key) =>
      allowedFields.includes(key)
    );

    if (!hasValidUpdates) {
      throw new AppError(
        'No valid fields to update. Allowed fields: ' + allowedFields.join(', '),
        400
      );
    }

    const result = await updatePharmacy(id, updates);

    res.status(200).json({
      status: 'success',
      message: 'Pharmacy updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update pharmacy status (blacklist/restore/suspend)
 * PUT /api/admin/pharmacies/:id/status
 */
export const updatePharmacyStatusHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    if (!status) {
      throw new AppError('Status is required', 400);
    }

    const validStatuses = ['pending', 'active', 'suspended', 'blacklisted'];
    if (!validStatuses.includes(status)) {
      throw new AppError(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      );
    }

    const result = await updatePharmacyStatus(id, status);

    res.status(200).json({
      status: 'success',
      message: `Pharmacy status updated to ${status}`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

