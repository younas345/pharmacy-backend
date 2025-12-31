import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import * as pharmacyMarketplaceService from '../services/pharmacyMarketplaceService';

// ============================================================
// Marketplace Deals Handlers
// ============================================================

/**
 * Get marketplace deals list
 * GET /api/marketplace
 */
export const getMarketplaceDealsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    const {
      page = '1',
      limit = '12',
      search,
      category,
      status,
      sortBy = 'posted_date',
      sortOrder = 'desc',
    } = req.query;

    const result = await pharmacyMarketplaceService.getMarketplaceDeals(
      pharmacyId,
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
  } catch (error) {
    next(error);
  }
};

/**
 * Get marketplace deal by ID
 * GET /api/marketplace/:id
 */
export const getMarketplaceDealByIdHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;
    const { id } = req.params;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    if (!id) {
      throw new AppError('Deal ID is required', 400);
    }

    const deal = await pharmacyMarketplaceService.getMarketplaceDealById(
      pharmacyId,
      id
    );

    res.status(200).json({
      status: 'success',
      data: { deal },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get marketplace categories
 * GET /api/marketplace/categories
 */
export const getMarketplaceCategoriesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    const categories = await pharmacyMarketplaceService.getMarketplaceCategories(
      pharmacyId
    );

    res.status(200).json({
      status: 'success',
      data: { categories },
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// Cart Handlers
// ============================================================

/**
 * Add item to cart
 * POST /api/marketplace/cart
 */
export const addToCartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    const { dealId, quantity = 1 } = req.body;

    if (!dealId) {
      throw new AppError('Deal ID is required', 400);
    }

    const result = await pharmacyMarketplaceService.addToCart(
      pharmacyId,
      dealId,
      quantity
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: { item: result.item },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cart
 * GET /api/marketplace/cart
 */
export const getCartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    const cart = await pharmacyMarketplaceService.getCart(pharmacyId);

    res.status(200).json({
      status: 'success',
      data: cart,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update cart item quantity
 * PATCH /api/marketplace/cart/:itemId
 */
export const updateCartItemHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;
    const { itemId } = req.params;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    if (!itemId) {
      throw new AppError('Item ID is required', 400);
    }

    const { quantity } = req.body;

    if (quantity === undefined || quantity === null) {
      throw new AppError('Quantity is required', 400);
    }

    const result = await pharmacyMarketplaceService.updateCartItem(
      pharmacyId,
      itemId,
      quantity
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: { newQuantity: result.newQuantity },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove item from cart
 * DELETE /api/marketplace/cart/:itemId
 */
export const removeFromCartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;
    const { itemId } = req.params;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    if (!itemId) {
      throw new AppError('Item ID is required', 400);
    }

    const result = await pharmacyMarketplaceService.removeFromCart(
      pharmacyId,
      itemId
    );

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Clear entire cart
 * DELETE /api/marketplace/cart
 */
export const clearCartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    const result = await pharmacyMarketplaceService.clearCart(pharmacyId);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: { itemsRemoved: result.itemsRemoved },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get cart item count
 * GET /api/marketplace/cart/count
 */
export const getCartCountHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    const result = await pharmacyMarketplaceService.getCartCount(pharmacyId);

    res.status(200).json({
      status: 'success',
      data: { count: result.count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate cart before checkout
 * GET /api/marketplace/cart/validate
 */
export const validateCartHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 401);
    }

    const validation = await pharmacyMarketplaceService.validateCart(pharmacyId);

    res.status(200).json({
      status: 'success',
      data: validation,
    });
  } catch (error) {
    next(error);
  }
};

