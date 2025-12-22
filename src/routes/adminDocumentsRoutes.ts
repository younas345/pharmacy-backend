import { Router } from 'express';
import {
  getDocumentsHandler,
  getDocumentByIdHandler,
  deleteDocumentHandler,
  getDocumentsStatsHandler,
} from '../controllers/adminDocumentsController';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Apply admin authentication middleware to all routes
router.use(authenticateAdmin);

/**
 * @swagger
 * /api/admin/documents/stats:
 *   get:
 *     summary: Get documents statistics
 *     description: |
 *       Returns statistics about all uploaded documents including
 *       total count, file sizes, credit amounts, and breakdowns by status and source.
 *     tags: [Admin - Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Documents statistics retrieved successfully
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
 *                       type: integer
 *                       example: 156
 *                     totalFileSize:
 *                       type: integer
 *                       description: Total file size in bytes
 *                       example: 524288000
 *                     totalCreditAmount:
 *                       type: number
 *                       example: 45678.50
 *                     byStatus:
 *                       type: object
 *                       description: Count of documents by status
 *                       example:
 *                         completed: 120
 *                         processing: 10
 *                         failed: 5
 *                         uploading: 1
 *                     bySource:
 *                       type: object
 *                       description: Count of documents by source
 *                       example:
 *                         manual_upload: 100
 *                         email_forward: 30
 *                         portal_fetch: 20
 *                         api: 6
 *                     recentUploads:
 *                       type: integer
 *                       description: Number of uploads in last 7 days
 *                       example: 23
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/stats', getDocumentsStatsHandler);

/**
 * @swagger
 * /api/admin/documents:
 *   get:
 *     summary: Get list of all documents
 *     description: |
 *       Returns a paginated list of all uploaded documents with search and filter options.
 *       Includes pharmacy information and reverse distributor details.
 *     tags: [Admin - Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by pharmacy name, owner name, file name, or document ID
 *         example: "HealthFirst"
 *       - in: query
 *         name: pharmacy_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by specific pharmacy ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *         example: 20
 *     responses:
 *       200:
 *         description: List of documents retrieved successfully
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
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           fileName:
 *                             type: string
 *                             example: "return_receipt_001.pdf"
 *                           fileSize:
 *                             type: integer
 *                             description: File size in bytes
 *                             example: 2457600
 *                           fileType:
 *                             type: string
 *                             example: "application/pdf"
 *                           fileUrl:
 *                             type: string
 *                             example: "https://..."
 *                           source:
 *                             type: string
 *                             enum: [manual_upload, email_forward, portal_fetch, api]
 *                             example: "manual_upload"
 *                           status:
 *                             type: string
 *                             enum: [uploading, processing, completed, failed, needs_review]
 *                             example: "completed"
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *                           processedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                           extractedItems:
 *                             type: integer
 *                             example: 45
 *                           totalCreditAmount:
 *                             type: number
 *                             nullable: true
 *                             example: 1234.56
 *                           reportDate:
 *                             type: string
 *                             format: date
 *                             nullable: true
 *                           pharmacyId:
 *                             type: string
 *                             format: uuid
 *                           pharmacyName:
 *                             type: string
 *                             example: "HealthFirst Pharmacy"
 *                           pharmacyOwner:
 *                             type: string
 *                             example: "John Smith"
 *                           pharmacyEmail:
 *                             type: string
 *                             example: "john@healthfirst.com"
 *                           reverseDistributorId:
 *                             type: string
 *                             format: uuid
 *                             nullable: true
 *                           reverseDistributorName:
 *                             type: string
 *                             nullable: true
 *                             example: "Stericycle"
 *                           reverseDistributorCode:
 *                             type: string
 *                             nullable: true
 *                             example: "STC"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 156
 *                         totalPages:
 *                           type: integer
 *                           example: 8
 *                     filters:
 *                       type: object
 *                       properties:
 *                         search:
 *                           type: string
 *                           nullable: true
 *                         pharmacyId:
 *                           type: string
 *                           nullable: true
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/', getDocumentsHandler);

/**
 * @swagger
 * /api/admin/documents/{id}:
 *   get:
 *     summary: Get single document details
 *     description: |
 *       Returns detailed information about a specific document including
 *       file info, pharmacy details, and reverse distributor information.
 *     tags: [Admin - Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document details retrieved successfully
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
 *                     document:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         fileName:
 *                           type: string
 *                         fileSize:
 *                           type: integer
 *                         fileType:
 *                           type: string
 *                         fileUrl:
 *                           type: string
 *                         source:
 *                           type: string
 *                         status:
 *                           type: string
 *                         uploadedAt:
 *                           type: string
 *                           format: date-time
 *                         processedAt:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                         errorMessage:
 *                           type: string
 *                           nullable: true
 *                         extractedItems:
 *                           type: integer
 *                         totalCreditAmount:
 *                           type: number
 *                           nullable: true
 *                         processingProgress:
 *                           type: integer
 *                           nullable: true
 *                         reportDate:
 *                           type: string
 *                           format: date
 *                           nullable: true
 *                         pharmacyId:
 *                           type: string
 *                           format: uuid
 *                         pharmacyName:
 *                           type: string
 *                         pharmacyOwner:
 *                           type: string
 *                         pharmacyEmail:
 *                           type: string
 *                         pharmacyPhone:
 *                           type: string
 *                           nullable: true
 *                         reverseDistributorId:
 *                           type: string
 *                           format: uuid
 *                           nullable: true
 *                         reverseDistributorName:
 *                           type: string
 *                           nullable: true
 *                         reverseDistributorCode:
 *                           type: string
 *                           nullable: true
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/:id', getDocumentByIdHandler);

/**
 * @swagger
 * /api/admin/documents/{id}:
 *   delete:
 *     summary: Delete a document
 *     description: |
 *       Permanently deletes a document from the system.
 *       This action cannot be undone.
 *     tags: [Admin - Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: "Document deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Document deleted successfully"
 *                     deletedDocument:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         fileName:
 *                           type: string
 *                         pharmacyName:
 *                           type: string
 *                           nullable: true
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Document not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.delete('/:id', deleteDocumentHandler);

export default router;

