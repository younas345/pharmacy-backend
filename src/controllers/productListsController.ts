import { Request, Response, NextFunction } from 'express';
import {
  getProductListItems,
  addProductListItem,
  updateProductListItem,
  removeItemFromProductList,
  clearAllProductListItems,
} from '../services/productListsService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

// Get all product list items
export const getProductListItemsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const items = await getProductListItems(pharmacyId);

    res.status(200).json({
      status: 'success',
      data: items,
    });
  }
);

// Add product list item
export const addProductListItemHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const { ndc, product_name, quantity, lot_number, expiration_date, notes } = req.body;

    if (!ndc || !product_name || !quantity) {
      throw new AppError('NDC, product name, and quantity are required', 400);
    }

    const item = await addProductListItem(pharmacyId, {
      ndc,
      product_name,
      quantity,
      lot_number,
      expiration_date,
      notes,
    });

    res.status(201).json({
      status: 'success',
      data: item,
    });
  }
);

// Update product list item
export const updateProductListItemHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const { id } = req.params;
    const { ndc, product_name, quantity, lot_number, expiration_date, notes } = req.body;

    // At least one field must be provided for update
    if (!ndc && !product_name && quantity === undefined && !lot_number && !expiration_date && !notes) {
      throw new AppError('At least one field must be provided for update', 400);
    }

    const item = await updateProductListItem(id, pharmacyId, {
      ndc,
      product_name,
      quantity,
      lot_number,
      expiration_date,
      notes,
    });

    res.status(200).json({
      status: 'success',
      data: item,
    });
  }
);

// Remove item from product list
export const removeItemHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    await removeItemFromProductList(id);

    res.status(200).json({
      status: 'success',
      message: 'Item removed successfully',
    });
  }
);

// Clear all product list items for a pharmacy
export const clearAllProductListItemsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const result = await clearAllProductListItems(pharmacyId);

    res.status(200).json({
      status: 'success',
      message: 'All product list items cleared successfully',
      data: {
        deletedCount: result.deletedCount,
      },
    });
  }
);

