import express from 'express';
import {
  getDocumentsHandler,
  getDocumentByIdHandler,
  deleteDocumentHandler,
} from '../controllers/documentsController';

const router = express.Router();

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get all uploaded documents
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: pharmacy_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Pharmacy ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [uploading, processing, completed, failed, needs_review]
 *         description: Filter by document status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by file name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of documents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of documents to skip
 *     responses:
 *       200:
 *         description: List of documents
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DocumentsListResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', getDocumentsHandler);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: pharmacy_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Pharmacy ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/UploadedDocument'
 *       404:
 *         description: Document not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', getDocumentByIdHandler);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     parameters:
 *       - in: query
 *         name: pharmacy_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Pharmacy ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Document ID
 *     responses:
 *       204:
 *         description: Document deleted successfully
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', deleteDocumentHandler);

export default router;

