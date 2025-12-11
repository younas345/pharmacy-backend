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
 *     description: Returns dashboard summary with total pharmacy added products count, top distributor count, and package statistics. Top distributors count includes all active distributors (matching the top distributors API which returns all active distributors regardless of documents). Package statistics are calculated using the same logic as /api/optimization/custom-packages. Pharmacy ID is automatically determined from authentication token.
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
 *                       description: Count of all active distributors (all active distributors in the system, not filtered by pharmacy documents)
 *                     totalPackages:
 *                       type: number
 *                       example: 10
 *                       description: Total number of custom packages (delivered + non-delivered)
 *                     deliveredPackages:
 *                       type: number
 *                       example: 6
 *                       description: Number of packages with status true (delivered)
 *                     nonDeliveredPackages:
 *                       type: number
 *                       example: 4
 *                       description: Number of packages with status false (non-delivered)
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/summary', getDashboardSummaryHandler);

export default router;

