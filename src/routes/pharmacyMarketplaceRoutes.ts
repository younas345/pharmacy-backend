import { Router } from 'express';
import {
  getMarketplaceDealsHandler,
  getMarketplaceDealByIdHandler,
  getMarketplaceCategoriesHandler,
  addToCartHandler,
  getCartHandler,
  updateCartItemHandler,
  removeFromCartHandler,
  clearCartHandler,
  getCartCountHandler,
  validateCartHandler,
} from '../controllers/pharmacyMarketplaceController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply pharmacy authentication to all routes
router.use(authenticate);

// ============================================================
// Swagger Schemas
// ============================================================

/**
 * @swagger
 * components:
 *   schemas:
 *     PharmacyMarketplaceDeal:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Deal ID
 *         dealNumber:
 *           type: string
 *           description: Auto-generated deal number
 *           example: "DEAL-001"
 *         productName:
 *           type: string
 *           description: Product name
 *           example: "Ibuprofen 200mg"
 *         category:
 *           type: string
 *           description: Product category
 *           example: "Pain Relief"
 *         ndc:
 *           type: string
 *           nullable: true
 *           description: NDC code
 *           example: "00069-0600-66"
 *         quantity:
 *           type: integer
 *           description: Available quantity
 *           example: 500
 *         unit:
 *           type: string
 *           enum: [bottles, boxes, units, packs]
 *           description: Unit type
 *           example: "bottles"
 *         originalPrice:
 *           type: number
 *           format: float
 *           description: Original price per unit
 *           example: 15.00
 *         dealPrice:
 *           type: number
 *           format: float
 *           description: Deal price per unit
 *           example: 12.00
 *         savings:
 *           type: integer
 *           description: Savings percentage
 *           example: 20
 *         totalSavingsAmount:
 *           type: number
 *           format: float
 *           description: Total savings amount per unit
 *           example: 3.00
 *         distributor:
 *           type: string
 *           description: Distributor name
 *           example: "MediSupply Corp"
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Product expiry date
 *           example: "2025-06-30"
 *         postedDate:
 *           type: string
 *           format: date
 *           description: Deal posted date
 *           example: "2024-12-10"
 *         status:
 *           type: string
 *           enum: [active, sold, expired]
 *           description: Deal status
 *           example: "active"
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           description: Product image URL
 *         notes:
 *           type: string
 *           nullable: true
 *           description: Additional notes
 *         inCart:
 *           type: boolean
 *           description: Whether this deal is in pharmacy's cart
 *         cartQuantity:
 *           type: integer
 *           description: Quantity of this deal in cart
 *     
 *     PharmacyMarketplaceStats:
 *       type: object
 *       properties:
 *         totalDeals:
 *           type: integer
 *           description: Total number of deals
 *           example: 25
 *         activeDeals:
 *           type: integer
 *           description: Number of active deals
 *           example: 18
 *         soldDeals:
 *           type: integer
 *           description: Number of sold deals
 *           example: 5
 *         expiredDeals:
 *           type: integer
 *           description: Number of expired deals
 *           example: 2
 *         totalItems:
 *           type: integer
 *           description: Total quantity of items available
 *           example: 5000
 *         avgSavings:
 *           type: number
 *           format: float
 *           description: Average savings percentage
 *           example: 22.5
 *         categories:
 *           type: array
 *           items:
 *             type: string
 *           description: List of available categories
 *     
 *     CartItem:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Cart item ID
 *         dealId:
 *           type: string
 *           format: uuid
 *           description: Deal ID
 *         productName:
 *           type: string
 *           description: Product name
 *           example: "Ibuprofen 200mg"
 *         ndc:
 *           type: string
 *           nullable: true
 *           description: NDC code
 *         category:
 *           type: string
 *           description: Product category
 *         distributor:
 *           type: string
 *           description: Distributor name
 *         quantity:
 *           type: integer
 *           description: Quantity in cart
 *           example: 10
 *         unitPrice:
 *           type: number
 *           format: float
 *           description: Deal price per unit
 *           example: 12.00
 *         originalPrice:
 *           type: number
 *           format: float
 *           description: Original price per unit
 *           example: 15.00
 *         totalPrice:
 *           type: number
 *           format: float
 *           description: Total price (quantity * unitPrice)
 *           example: 120.00
 *         savings:
 *           type: number
 *           format: float
 *           description: Total savings amount
 *           example: 30.00
 *         savingsPercent:
 *           type: integer
 *           description: Savings percentage
 *           example: 20
 *         imageUrl:
 *           type: string
 *           nullable: true
 *           description: Product image URL
 *         availableQuantity:
 *           type: integer
 *           description: Available quantity in stock
 *           example: 500
 *         dealStatus:
 *           type: string
 *           description: Current deal status
 *           example: "active"
 *         expiryDate:
 *           type: string
 *           format: date
 *           description: Product expiry date
 *         addedAt:
 *           type: string
 *           format: date-time
 *           description: When item was added to cart
 *     
 *     CartSummary:
 *       type: object
 *       properties:
 *         itemCount:
 *           type: integer
 *           description: Number of items in cart
 *           example: 3
 *         subtotal:
 *           type: number
 *           format: float
 *           description: Cart subtotal before tax
 *           example: 350.00
 *         totalSavings:
 *           type: number
 *           format: float
 *           description: Total savings from deals
 *           example: 87.50
 *         estimatedTax:
 *           type: number
 *           format: float
 *           description: Estimated tax (8%)
 *           example: 28.00
 *         total:
 *           type: number
 *           format: float
 *           description: Total including tax
 *           example: 378.00
 *     
 *     CartResponse:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         summary:
 *           $ref: '#/components/schemas/CartSummary'
 *     
 *     AddToCartRequest:
 *       type: object
 *       required:
 *         - dealId
 *       properties:
 *         dealId:
 *           type: string
 *           format: uuid
 *           description: Deal ID to add to cart
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: Quantity to add
 *     
 *     UpdateCartItemRequest:
 *       type: object
 *       required:
 *         - quantity
 *       properties:
 *         quantity:
 *           type: integer
 *           minimum: 1
 *           description: New quantity
 *     
 *     CartValidationIssue:
 *       type: object
 *       properties:
 *         itemId:
 *           type: string
 *           format: uuid
 *         dealId:
 *           type: string
 *           format: uuid
 *         productName:
 *           type: string
 *         issue:
 *           type: string
 *           description: Description of the issue
 *     
 *     CartValidationResponse:
 *       type: object
 *       properties:
 *         valid:
 *           type: boolean
 *           description: Whether cart is valid for checkout
 *         message:
 *           type: string
 *           description: Validation message
 *         issues:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartValidationIssue'
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         summary:
 *           $ref: '#/components/schemas/CartSummary'
 */

// ============================================================
// Marketplace Routes
// ============================================================

/**
 * @swagger
 * /api/marketplace:
 *   get:
 *     summary: Get marketplace deals
 *     description: |
 *       Returns a paginated list of marketplace deals for pharmacies.
 *       Shows all deals (active, sold, expired) with optional status filter.
 *       
 *       **Status Filter:**
 *       - all: Show all deals (default)
 *       - active: Show only active deals
 *       - sold: Show only sold deals
 *       - expired: Show only expired deals
 *       
 *       **Sorting Options:**
 *       - posted_date: Sort by when deal was posted
 *       - expiry_date: Sort by product expiry date
 *       - deal_price: Sort by deal price
 *       - savings: Sort by savings percentage
 *       - product_name: Sort alphabetically by product name
 *       - status: Sort by deal status
 *     tags: [Pharmacy - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by product name, distributor, deal number, NDC, or category
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, active, sold, expired]
 *         description: Filter by deal status (default shows all)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [product_name, category, distributor, status, posted_date, expiry_date, deal_price, quantity, savings]
 *           default: posted_date
 *         description: Sort by field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Marketplace deals retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     deals:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PharmacyMarketplaceDeal'
 *                     stats:
 *                       $ref: '#/components/schemas/PharmacyMarketplaceStats'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', getMarketplaceDealsHandler);

/**
 * @swagger
 * /api/marketplace/categories:
 *   get:
 *     summary: Get marketplace categories
 *     description: Returns all unique categories from active deals with counts.
 *     tags: [Pharmacy - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/categories', getMarketplaceCategoriesHandler);

/**
 * @swagger
 * /api/marketplace/cart:
 *   get:
 *     summary: Get pharmacy cart
 *     description: Returns the pharmacy's shopping cart with all items and totals.
 *     tags: [Pharmacy - Marketplace Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CartResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/cart', getCartHandler);

/**
 * @swagger
 * /api/marketplace/cart/count:
 *   get:
 *     summary: Get cart item count
 *     description: Returns the number of items in the cart (useful for header badge).
 *     tags: [Pharmacy - Marketplace Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     count:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/cart/count', getCartCountHandler);

/**
 * @swagger
 * /api/marketplace/cart/validate:
 *   get:
 *     summary: Validate cart before checkout
 *     description: |
 *       Validates all items in cart are still available and returns any issues.
 *       Should be called before checkout to ensure cart is valid.
 *       
 *       **Possible Issues:**
 *       - Deal is no longer active (sold or expired)
 *       - Quantity in cart exceeds available stock
 *     tags: [Pharmacy - Marketplace Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CartValidationResponse'
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/cart/validate', validateCartHandler);

/**
 * @swagger
 * /api/marketplace/cart:
 *   post:
 *     summary: Add item to cart
 *     description: |
 *       Adds a deal to the pharmacy's cart. If the deal is already in cart,
 *       the quantity will be increased.
 *       
 *       **Validation:**
 *       - Deal must be active
 *       - Quantity must not exceed available stock
 *     tags: [Pharmacy - Marketplace Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddToCartRequest'
 *     responses:
 *       200:
 *         description: Item added to cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Item added to cart
 *                 data:
 *                   type: object
 *                   properties:
 *                     item:
 *                       type: object
 *                       properties:
 *                         dealId:
 *                           type: string
 *                         productName:
 *                           type: string
 *                         quantity:
 *                           type: integer
 *                         unitPrice:
 *                           type: number
 *                         totalPrice:
 *                           type: number
 *       400:
 *         description: Bad request - deal not found, not active, or quantity exceeds stock
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.post('/cart', addToCartHandler);

/**
 * @swagger
 * /api/marketplace/cart/{itemId}:
 *   patch:
 *     summary: Update cart item quantity
 *     description: Updates the quantity of an item in the cart.
 *     tags: [Pharmacy - Marketplace Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCartItemRequest'
 *     responses:
 *       200:
 *         description: Cart item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Cart updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     newQuantity:
 *                       type: integer
 *       400:
 *         description: Bad request - item not found or quantity exceeds stock
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.patch('/cart/:itemId', updateCartItemHandler);

/**
 * @swagger
 * /api/marketplace/cart/{itemId}:
 *   delete:
 *     summary: Remove item from cart
 *     description: Removes a single item from the cart.
 *     tags: [Pharmacy - Marketplace Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Cart item ID
 *     responses:
 *       200:
 *         description: Item removed from cart successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Item removed from cart
 *       400:
 *         description: Bad request - item not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/cart/:itemId', removeFromCartHandler);

/**
 * @swagger
 * /api/marketplace/cart:
 *   delete:
 *     summary: Clear entire cart
 *     description: Removes all items from the pharmacy's cart.
 *     tags: [Pharmacy - Marketplace Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Cart cleared successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     itemsRemoved:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.delete('/cart', clearCartHandler);

/**
 * @swagger
 * /api/marketplace/{id}:
 *   get:
 *     summary: Get marketplace deal by ID
 *     description: |
 *       Returns detailed information about a specific deal.
 *       Also includes whether the deal is in the pharmacy's cart.
 *     tags: [Pharmacy - Marketplace]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Deal ID
 *     responses:
 *       200:
 *         description: Deal retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     deal:
 *                       $ref: '#/components/schemas/PharmacyMarketplaceDeal'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Deal not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getMarketplaceDealByIdHandler);

export default router;

