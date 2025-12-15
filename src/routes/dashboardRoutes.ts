import { Router } from 'express';
import { getDashboardSummaryHandler, getHistoricalEarningsHandler } from '../controllers/dashboardController';
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

/**
 * @swagger
 * /api/dashboard/earnings/history:
 *   get:
 *     summary: Get historical earnings graph data for authenticated pharmacy
 *     description: |
 *       Returns monthly or yearly earnings data from return reports over the specified period.
 *       Data is sourced from uploaded_documents.total_credit_amount grouped by report_date.
 *       
 *       Use this endpoint to display:
 *       - Line/bar chart of monthly or yearly earnings over time
 *       - Total earnings summary
 *       - Earnings breakdown by distributor
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: periodType
 *         schema:
 *           type: string
 *           enum: [monthly, yearly]
 *           default: monthly
 *         description: Group earnings by month or year (default monthly)
 *         example: monthly
 *       - in: query
 *         name: periods
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 60
 *           default: 12
 *         description: Number of periods to fetch (default 12, max 60 for monthly, max 10 for yearly)
 *         example: 12
 *     responses:
 *       200:
 *         description: Historical earnings data for graphing
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
 *                     periodEarnings:
 *                       type: array
 *                       description: Array of period earnings data points for the graph
 *                       items:
 *                         type: object
 *                         properties:
 *                           period:
 *                             type: string
 *                             example: "2025-12"
 *                             description: Period identifier (YYYY-MM for monthly, YYYY for yearly)
 *                           label:
 *                             type: string
 *                             example: "December 2025"
 *                             description: Human-readable period label
 *                           earnings:
 *                             type: number
 *                             example: 12500.50
 *                             description: Total earnings for this period
 *                           documentsCount:
 *                             type: number
 *                             example: 15
 *                             description: Number of return reports for this period
 *                     totalEarnings:
 *                       type: number
 *                       example: 157500.25
 *                       description: Total earnings over the entire period
 *                     averagePeriodEarnings:
 *                       type: number
 *                       example: 13125.02
 *                       description: Average earnings per period (only counting periods with earnings)
 *                     totalDocuments:
 *                       type: number
 *                       example: 180
 *                       description: Total number of return reports in the period
 *                     byDistributor:
 *                       type: array
 *                       description: Earnings breakdown by distributor (sorted by earnings desc)
 *                       items:
 *                         type: object
 *                         properties:
 *                           distributorId:
 *                             type: string
 *                             format: uuid
 *                             example: "2da2ca2e-c3c9-4ffa-9a06-a226631a9b4f"
 *                           distributorName:
 *                             type: string
 *                             example: "Return Solutions, Inc."
 *                           totalEarnings:
 *                             type: number
 *                             example: 85000.00
 *                           documentsCount:
 *                             type: number
 *                             example: 100
 *                     period:
 *                       type: object
 *                       description: The date range and type of the query
 *                       properties:
 *                         startDate:
 *                           type: string
 *                           format: date
 *                           example: "2024-12-01"
 *                         endDate:
 *                           type: string
 *                           format: date
 *                           example: "2025-12-31"
 *                         type:
 *                           type: string
 *                           enum: [monthly, yearly]
 *                           example: "monthly"
 *                         periods:
 *                           type: number
 *                           example: 12
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/earnings/history', getHistoricalEarningsHandler);

export default router;

