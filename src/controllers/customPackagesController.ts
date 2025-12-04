import { Request, Response, NextFunction } from 'express';
import {
  createCustomPackage,
  getCustomPackages,
  getCustomPackageById,
  deleteCustomPackage,
  updatePackageStatus,
  CreateCustomPackageRequest,
} from '../services/customPackagesService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

// Create a custom package
export const createCustomPackageHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const { distributorName, distributorId, items, notes } = req.body;

    const packageData: CreateCustomPackageRequest = {
      distributorName,
      distributorId,
      items,
      notes,
    };

    // pharmacyId is the same as userId in this system
    const customPackage = await createCustomPackage(pharmacyId, pharmacyId, packageData);

    res.status(201).json({
      status: 'success',
      data: customPackage,
    });
  }
);

// Get all custom packages for a pharmacy
export const getCustomPackagesHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const statusParam = req.query.status;
    let status: boolean | undefined = undefined;
    if (statusParam !== undefined) {
      if (typeof statusParam === 'string') {
        status = statusParam === 'true';
      } else if (typeof statusParam === 'boolean') {
        status = statusParam;
      }
    }
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;

    const filters = {
      status,
      limit,
      offset,
    };

    const result = await getCustomPackages(pharmacyId, filters);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

// Get a single custom package by ID
export const getCustomPackageByIdHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    const packageId = req.params.id;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    if (!packageId) {
      throw new AppError('Package ID is required', 400);
    }

    const customPackage = await getCustomPackageById(pharmacyId, packageId);

    res.status(200).json({
      status: 'success',
      data: customPackage,
    });
  }
);

// Delete a custom package
export const deleteCustomPackageHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    const packageId = req.params.id;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    if (!packageId) {
      throw new AppError('Package ID is required', 400);
    }

    await deleteCustomPackage(pharmacyId, packageId);

    res.status(200).json({
      status: 'success',
      message: 'Package deleted successfully',
    });
  }
);

// Update package status to true
export const updatePackageStatusHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    const packageId = req.params.id;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    if (!packageId) {
      throw new AppError('Package ID is required', 400);
    }

    const updatedPackage = await updatePackageStatus(pharmacyId, packageId);

    res.status(200).json({
      status: 'success',
      data: updatedPackage,
      message: 'Package status toggled successfully',
    });
  }
);

