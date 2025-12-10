import { Router } from 'express';
import { getOptimizationRecommendationsHandler, getPackageRecommendationsHandler, getPackageRecommendationsByNdcsHandler, getDistributorSuggestionsHandler } from '../controllers/optimizationController';
import customPackagesRoutes from './customPackagesRoutes';
import { authenticate } from '../middleware/auth';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/optimization/recommendations:
 *   get:
 *     summary: Get optimization recommendations for pharmacy products
 *     description: Analyzes product list items and matches them with return reports to find the best distributor prices and generate optimization recommendations. If ndc query parameter is provided, searches for those specific NDCs instead of pharmacy's product list. In search mode (with ndc), returns both fullPricePerUnit and partialPricePerUnit for each NDC. FullCount and PartialCount are optional - when provided, they filter results; when not provided, all records are fetched and both prices are returned.
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
 *       - in: query
 *         name: FullCount
 *         schema:
 *           type: string
 *         description: Optional. Comma-separated values matching NDC order. When provided, filters return reports to only match records where full > 0.
 *         example: "10,0,5"
 *       - in: query
 *         name: PartialCount
 *         schema:
 *           type: string
 *         description: Optional. Comma-separated values matching NDC order. When provided, filters return reports to only match records where partial > 0.
 *         example: "0,5,0"
 *     responses:
 *       200:
 *         description: Optimization recommendations retrieved successfully. In search mode, includes fullPricePerUnit and partialPricePerUnit fields.
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
 *         description: Bad request - array length mismatch between ndc and FullCount/PartialCount
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

/**
 * @swagger
 * /api/optimization/packages/by-ndc:
 *   get:
 *     summary: Get package recommendations by NDC codes
 *     description: Analyzes provided NDC codes and groups them by distributor based on best prices. Creates optimized packages showing which NDCs should be sent to which distributor for maximum return value. Accepts single or multiple comma-separated NDCs.
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ndc
 *         required: true
 *         schema:
 *           type: string
 *         description: Single NDC code or comma-separated NDC codes to search for
 *         example: "42385097801,69315028209"
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
 *         description: Bad request - NDC parameter is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/packages/by-ndc', getPackageRecommendationsByNdcsHandler);

/**
 * @swagger
 * /api/optimization/suggestions:
 *   post:
 *     summary: Get distributor suggestions for NDC(s) and quantity(ies)
 *     description: Checks if pharmacy has the required quantity for the given NDC(s), then returns distributor suggestions with pricing information. Supports both single NDC and multiple NDCs in one request. This helps pharmacy identify which distributors offer returns for their products and at what prices.
 *     tags: [Optimization]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 description: Single NDC request
 *                 required:
 *                   - ndc
 *                   - quantity
 *                 properties:
 *                   ndc:
 *                     type: string
 *                     description: NDC code of the product
 *                     example: "42385097801"
 *                   product:
 *                     type: string
 *                     description: Product name (optional, will be fetched from database if not provided)
 *                     example: "Lisinopril 10mg Tablets"
 *                   quantity:
 *                     type: number
 *                     description: Quantity requested
 *                     example: 50
 *                     minimum: 1
 *               - type: object
 *                 description: Multiple NDCs request
 *                 required:
 *                   - items
 *                 properties:
 *                   items:
 *                     type: array
 *                     description: Array of NDC items with quantities
 *                     minItems: 1
 *                     items:
 *                       type: object
 *                       required:
 *                         - ndc
 *                         - quantity
 *                       properties:
 *                         ndc:
 *                           type: string
 *                           description: NDC code of the product
 *                           example: "45963-0142-05"
 *                         product:
 *                           type: string
 *                           description: Product name (optional, will be fetched from database if not provided)
 *                           example: "Fluoxetine"
 *                         quantity:
 *                           type: number
 *                           description: Quantity requested for this NDC
 *                           example: 50
 *                           minimum: 1
 *           examples:
 *             singleNdc:
 *               summary: Single NDC request
 *               value:
 *                 ndc: "42385097801"
 *                 product: "Lisinopril 10mg Tablets"
 *                 quantity: 50
 *             multipleNdcs:
 *               summary: Multiple NDCs request
 *               value:
 *                 items:
 *                   - ndc: "45963-0142-05"
 *                     product: "Fluoxetine"
 *                     quantity: 50
 *                   - ndc: "42385097801"
 *                     quantity: 30
 *     responses:
 *       200:
 *         description: Distributor suggestions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Single NDC response
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     data:
 *                       type: object
 *                       properties:
 *                         ndc:
 *                           type: string
 *                           example: "42385097801"
 *                         productName:
 *                           type: string
 *                           example: "Lisinopril 10mg Tablets"
 *                         requestedQuantity:
 *                           type: number
 *                           example: 50
 *                         availableQuantity:
 *                           type: number
 *                           example: 75
 *                         hasEnoughQuantity:
 *                           type: boolean
 *                           example: true
 *                         distributors:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               distributorName:
 *                                 type: string
 *                                 example: "XYZ Pharmaceutical Returns"
 *                               distributorId:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "123e4567-e89b-12d3-a456-426614174000"
 *                               distributorContact:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   email:
 *                                     type: string
 *                                     nullable: true
 *                                     example: "support@xyzpharma.com"
 *                                   phone:
 *                                     type: string
 *                                     nullable: true
 *                                     example: "(555) 987-6543"
 *                                   location:
 *                                     type: string
 *                                     nullable: true
 *                                     example: "456 Oak Ave, Chicago, IL, 60601, USA"
 *                               pricePerUnit:
 *                                 type: number
 *                                 example: 2.50
 *                               totalEstimatedValue:
 *                                 type: number
 *                                 example: 125.00
 *                               averagePricePerUnit:
 *                                 type: number
 *                                 example: 2.50
 *                               available:
 *                                 type: boolean
 *                                 example: true
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *                 - type: object
 *                   description: Multiple NDCs response (grouped by distributor)
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "success"
 *                     data:
 *                       type: object
 *                       properties:
 *                         distributors:
 *                           type: array
 *                           description: Array of distributors with their accepted NDCs
 *                           items:
 *                             type: object
 *                             properties:
 *                               distributorName:
 *                                 type: string
 *                                 example: "XYZ Pharmaceutical Returns"
 *                               distributorId:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "123e4567-e89b-12d3-a456-426614174000"
 *                               distributorContact:
 *                                 type: object
 *                                 nullable: true
 *                                 properties:
 *                                   email:
 *                                     type: string
 *                                     nullable: true
 *                                   phone:
 *                                     type: string
 *                                     nullable: true
 *                                   location:
 *                                     type: string
 *                                     nullable: true
 *                               products:
 *                                 type: array
 *                                 description: NDCs that this distributor accepts
 *                                 items:
 *                                   type: object
 *                                   properties:
 *                                     ndc:
 *                                       type: string
 *                                       example: "45963-0142-05"
 *                                     productName:
 *                                       type: string
 *                                       example: "Fluoxetine"
 *                                     quantity:
 *                                       type: number
 *                                       example: 50
 *                                     pricePerUnit:
 *                                       type: number
 *                                       example: 2.50
 *                                     totalEstimatedValue:
 *                                       type: number
 *                                       example: 125.00
 *                               totalItems:
 *                                 type: number
 *                                 example: 50
 *                               totalEstimatedValue:
 *                                 type: number
 *                                 example: 125.00
 *                               ndcsCount:
 *                                 type: number
 *                                 description: Number of different NDCs this distributor accepts
 *                                 example: 2
 *                         ndcsWithoutDistributors:
 *                           type: array
 *                           description: NDCs that have no distributor returns
 *                           items:
 *                             type: object
 *                             properties:
 *                               ndc:
 *                                 type: string
 *                                 example: "70756024751"
 *                               productName:
 *                                 type: string
 *                                 example: "Product Name"
 *                               quantity:
 *                                 type: number
 *                                 example: 25
 *                               reason:
 *                                 type: string
 *                                 example: "No distributor found offering returns for this NDC"
 *                         totalItems:
 *                           type: number
 *                           example: 3
 *                         totalDistributors:
 *                           type: number
 *                           example: 2
 *                         totalEstimatedValue:
 *                           type: number
 *                           example: 250.00
 *                         generatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Bad request - missing or invalid parameters, or insufficient quantity in pharmacy inventory
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               insufficientQuantity:
 *                 summary: Insufficient quantity error
 *                 value:
 *                   status: "error"
 *                   message: "You don't have enough quantity for this product. NDC: 00093-7352-01, Product: Rosuvastatin, Available: 3, Requested: 30"
 *               productNotFound:
 *                 summary: Product not found in inventory
 *                 value:
 *                   status: "error"
 *                   message: "You don't have this product in your inventory. NDC: 45963-0142-05, Product: Fluoxetine"
 */
router.post('/suggestions', getDistributorSuggestionsHandler);

// Custom packages routes
router.use('/custom-packages', customPackagesRoutes);

export default router;

