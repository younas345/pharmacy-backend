import { Request, Response, NextFunction } from 'express';
import {
  getProductListItems,
  addProductListItem,
  removeItemFromProductList,
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

