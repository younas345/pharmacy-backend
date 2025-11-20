import { Router } from 'express';
import { getOptimizationRecommendationsHandler } from '../controllers/optimizationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/optimization/recommendations:
 *   get:
 *     summary: Get optimization recommendations for pharmacy products
 *     description: Analyzes product list items and matches them with return reports to find the best distributor prices and generate optimization recommendations
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
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

export default router;

