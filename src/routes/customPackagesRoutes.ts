import { Router } from 'express';
import {
  createCustomPackageHandler,
  getCustomPackagesHandler,
  getCustomPackageByIdHandler,
  deleteCustomPackageHandler,
} from '../controllers/customPackagesController';

const router = Router();

// Note: Authentication is handled by the parent route (optimizationRoutes)

/**
 * @swagger
 * /api/optimization/custom-packages:
 *   post:
 *     summary: Create a custom package
 *     description: Creates a custom package with specified items and distributor. Pharmacy can create packages from optimization suggestions.
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCustomPackageRequest'
 *     responses:
 *       201:
 *         description: Package created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CreateCustomPackageResponse'
 *       400:
 *         description: Bad request - validation error or missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', createCustomPackageHandler);

/**
 * @swagger
 * /api/optimization/custom-packages:
 *   get:
 *     summary: Get all custom packages for pharmacy
 *     description: Retrieves all custom packages created by the pharmacy. Supports filtering by status and pagination.
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, ready_to_ship, in_transit, received, processed, completed, cancelled]
 *         description: Filter by package status
 *         example: draft
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of packages to return
 *         example: 10
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Number of packages to skip (for pagination)
 *         example: 0
 *     responses:
 *       200:
 *         description: Packages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetCustomPackagesResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getCustomPackagesHandler);

/**
 * @swagger
 * /api/optimization/custom-packages/{id}:
 *   get:
 *     summary: Get a single custom package by ID
 *     description: Retrieves details of a specific custom package including all items.
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Package ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Package retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GetCustomPackageResponse'
 *       404:
 *         description: Package not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getCustomPackageByIdHandler);

/**
 * @swagger
 * /api/optimization/custom-packages/{id}:
 *   delete:
 *     summary: Delete a custom package
 *     description: Deletes a custom package. Only draft packages can be deleted.
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Package ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Package deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeleteCustomPackageResponse'
 *       400:
 *         description: Cannot delete package (not in draft status) or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               notDraftStatus:
 *                 summary: Package not in draft status
 *                 value:
 *                   status: "error"
 *                   message: "Cannot delete package with status: ready_to_ship. Only draft packages can be deleted."
 *       404:
 *         description: Package not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', deleteCustomPackageHandler);

export default router;

