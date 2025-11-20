import { Router } from 'express';
import {
  getDefaultProductListHandler,
  addItemHandler,
  removeItemHandler,
  getProductListsHandler,
  createProductListHandler,
  getProductListItemsHandler,
  addProductListItemHandler,
} from '../controllers/productListsController';

const router = Router();

/**
 * @swagger
 * /api/product-lists/default:
 *   get:
 *     summary: Get default product list (My Products)
 *     tags: [Product Lists]
 *     parameters:
 *       - in: query
 *         name: pharmacy_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Pharmacy ID
 *     responses:
 *       200:
 *         description: Default product list with items
 */
router.get('/default', getDefaultProductListHandler);

/**
 * @swagger
 * /api/product-lists:
 *   get:
 *     summary: Get all product lists
 *     tags: [Product Lists]
 *     parameters:
 *       - in: query
 *         name: pharmacy_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Pharmacy ID
 *     responses:
 *       200:
 *         description: List of product lists
 */
router.get('/', getProductListsHandler);

/**
 * @swagger
 * /api/product-lists:
 *   post:
 *     summary: Create a new product list
 *     tags: [Product Lists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pharmacy_id
 *               - name
 *             properties:
 *               pharmacy_id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       201:
 *         description: Product list created
 */
router.post('/', createProductListHandler);

/**
 * @swagger
 * /api/product-lists/items/add:
 *   post:
 *     summary: Add item to product list (requires list_id)
 *     tags: [Product Lists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pharmacy_id
 *               - list_id
 *               - ndc
 *               - product_name
 *               - quantity
 *             properties:
 *               pharmacy_id:
 *                 type: string
 *               list_id:
 *                 type: string
 *               ndc:
 *                 type: string
 *               product_name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               lot_number:
 *                 type: string
 *               expiration_date:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item added to list
 */
router.post('/items/add', addItemHandler);

/**
 * @swagger
 * /api/product-lists/items/{id}:
 *   delete:
 *     summary: Remove item from product list
 *     tags: [Product Lists]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Item ID
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete('/items/:id', removeItemHandler);

/**
 * @swagger
 * /api/product-lists/items:
 *   get:
 *     summary: Get all product list items directly (simplified API)
 *     tags: [Product Lists]
 *     parameters:
 *       - in: query
 *         name: pharmacy_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Pharmacy ID
 *     responses:
 *       200:
 *         description: List of product list items
 */
router.get('/items', getProductListItemsHandler);

/**
 * @swagger
 * /api/product-lists/items:
 *   post:
 *     summary: Add product list item directly (simplified API - auto-creates list if needed)
 *     tags: [Product Lists]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pharmacy_id
 *               - ndc
 *               - product_name
 *               - quantity
 *             properties:
 *               pharmacy_id:
 *                 type: string
 *               ndc:
 *                 type: string
 *               product_name:
 *                 type: string
 *               quantity:
 *                 type: number
 *               lot_number:
 *                 type: string
 *               expiration_date:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item added to product list
 */
router.post('/items', addProductListItemHandler);

export default router;

