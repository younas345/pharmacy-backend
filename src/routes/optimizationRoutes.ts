import { Router } from 'express';
import { getOptimizationRecommendationsHandler, getPackageRecommendationsHandler } from '../controllers/optimizationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/optimization/recommendations:
 *   get:
 *     summary: Get optimization recommendations for pharmacy products
 *     description: Analyzes product list items and matches them with return reports to find the best distributor prices and generate optimization recommendations. If ndc query parameter is provided, searches for those specific NDCs instead of pharmacy's product list.
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ndc
 *         schema:
 *           type: string
 *         description: Comma-separated NDC codes to search for. If provided, uses these NDCs instead of pharmacy's product list.
 *         example: "42385097801,69315028209"
 *     responses:
 *       200:
 *         description: Optimization recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OptimizationResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/recommendations', getOptimizationRecommendationsHandler);

/**
 * @swagger
 * /api/optimization/packages:
 *   get:
 *     summary: Get package recommendations for pharmacy products
 *     description: Analyzes pharmacy's product list and groups products by distributor based on best prices. Creates optimized packages showing which products should be sent to which distributor for maximum return value.
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Package recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PackageRecommendationResponse'
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/packages', getPackageRecommendationsHandler);

export default router;

