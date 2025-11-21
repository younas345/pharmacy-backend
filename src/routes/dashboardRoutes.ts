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
 *     description: Returns comprehensive dashboard statistics including documents, distributors, NDCs, price variance, potential savings, and more. Pharmacy ID is automatically determined from authentication token.
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
 *                     totalDocuments:
 *                       type: number
 *                       example: 7
 *                       description: Total number of uploaded documents
 *                     documentsThisMonth:
 *                       type: number
 *                       example: 3
 *                       description: Number of documents uploaded this month
 *                     lastUpload:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "2024-01-15T10:30:00Z"
 *                       description: Most recent document upload date
 *                     totalDistributors:
 *                       type: number
 *                       example: 4
 *                       description: Total number of unique distributors
 *                     totalNDCs:
 *                       type: number
 *                       example: 25
 *                       description: Total number of unique NDC codes from return reports
 *                     totalDataPoints:
 *                       type: number
 *                       example: 7
 *                       description: Total number of data points (documents)
 *                     priceVariance:
 *                       type: number
 *                       example: 12.5
 *                       description: Price variance percentage across all return reports
 *                     potentialSavings:
 *                       type: number
 *                       example: 125.50
 *                       description: Potential savings from price optimization
 *                     activeInventory:
 *                       type: number
 *                       example: 0
 *                     totalReturns:
 *                       type: number
 *                       example: 0
 *                     pendingReturns:
 *                       type: number
 *                       example: 0
 *                     completedReturns:
 *                       type: number
 *                       example: 0
 *                     totalEstimatedCredits:
 *                       type: number
 *                       example: 0
 *                     expiringItems:
 *                       type: number
 *                       example: 0
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/summary', getDashboardSummaryHandler);

export default router;

