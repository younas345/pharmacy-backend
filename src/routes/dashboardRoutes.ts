import { Router } from 'express';
import { getDashboardSummaryHandler } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary statistics for authenticated pharmacy
 *     description: Returns dashboard summary with total pharmacy added products count and top distributor count. Top distributors are determined using the same logic as the top distributors API - active distributors that have documents with this pharmacy. Pharmacy ID is automatically determined from authentication token.
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary data
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
 *                     totalPharmacyAddedProducts:
 *                       type: number
 *                       example: 15
 *                       description: Total number of products added by the pharmacy (from product_list_items)
 *                     topDistributorCount:
 *                       type: number
 *                       example: 4
 *                       description: Count of top distributors (active distributors with documents for this pharmacy)
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/summary', getDashboardSummaryHandler);

export default router;

