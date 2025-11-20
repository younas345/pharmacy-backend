import { Router } from 'express';
import { getDashboardSummaryHandler } from '../controllers/dashboardController';

const router = Router();

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary statistics
 *     tags: [Dashboard]
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
 *                     totalDocuments:
 *                       type: number
 *                     totalDistributors:
 *                       type: number
 *                     totalNDCs:
 *                       type: number
 *                     totalDataPoints:
 *                       type: number
 *                     activeInventory:
 *                       type: number
 *                     totalReturns:
 *                       type: number
 *                     pendingReturns:
 *                       type: number
 *                     completedReturns:
 *                       type: number
 *                     totalEstimatedCredits:
 *                       type: number
 *                     expiringItems:
 *                       type: number
 */
router.get('/summary', getDashboardSummaryHandler);

export default router;

