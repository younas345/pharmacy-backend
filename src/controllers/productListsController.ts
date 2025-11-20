import { Request, Response, NextFunction } from 'express';
import {
  getDefaultProductList,
  addItemToProductList,
  removeItemFromProductList,
  getProductLists,
  createProductList,
  getProductListItems,
  addProductListItem,
} from '../services/productListsService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

const getPharmacyId = (req: Request): string => {
  return (req.body.pharmacy_id || req.query.pharmacy_id) as string;
};

// Get default product list (My Products)
export const getDefaultProductListHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = getPharmacyId(req);
    console.log('📋 Get default list request for pharmacy:', pharmacyId);
    
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const list = await getDefaultProductList(pharmacyId);
    console.log('✅ Default list retrieved:', { id: list.id, itemCount: list.items?.length || 0 });

    res.status(200).json({
      status: 'success',
      data: list,
    });
  }
);

// Add item to product list
export const addItemHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = getPharmacyId(req);
    console.log('📝 Add item request:', { pharmacyId, body: req.body });
    
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const { list_id, ndc, product_name, quantity, lot_number, expiration_date, notes } = req.body;

    if (!list_id || !ndc || !product_name || !quantity) {
      console.error('❌ Missing required fields:', { list_id, ndc, product_name, quantity });
      throw new AppError('List ID, NDC, product name, and quantity are required', 400);
    }

    console.log('➕ Adding item to list:', { list_id, ndc, product_name, quantity });

    const item = await addItemToProductList(list_id, {
      ndc,
      product_name,
      quantity,
      lot_number,
      expiration_date,
      notes,
      added_by: pharmacyId,
    });

    console.log('✅ Item added successfully:', item);

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

// Get all product lists
export const getProductListsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = getPharmacyId(req);
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const lists = await getProductLists(pharmacyId);

    res.status(200).json({
      status: 'success',
      data: lists,
    });
  }
);

// Create a new product list
export const createProductListHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = getPharmacyId(req);
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    const { name, items } = req.body;

    if (!name) {
      throw new AppError('List name is required', 400);
    }

    const list = await createProductList({
      pharmacy_id: pharmacyId,
      name,
      items,
    });

    res.status(201).json({
      status: 'success',
      data: list,
    });
  }
);

// Get all product list items directly (simplified API)
export const getProductListItemsHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = getPharmacyId(req);
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

// Add product list item directly (simplified API)
export const addProductListItemHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = getPharmacyId(req);
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

