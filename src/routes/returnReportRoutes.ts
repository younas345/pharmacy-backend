import express from 'express';
import { processReturnReportHandler } from '../controllers/returnReportController';
import { upload } from '../middleware/upload';

const router = express.Router();

/**
 * @swagger
 * /api/return-reports/process:
 *   post:
 *     summary: Process return report PDF and extract structured data using Azure OpenAI
 *     description: Upload a PDF file containing a pharmacy return report. The API will extract text from the PDF and use Azure OpenAI to extract structured JSON data including distributor info, pharmacy info, returned items, prices, expiry dates, and more.
 *     tags: [Return Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - pharmacy_id
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: PDF file containing the return report (max 10MB)
 *               pharmacy_id:
 *                 type: string
 *                 format: uuid
 *                 description: Pharmacy ID (can also be provided as query parameter)
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               reverse_distributor_id:
 *                 type: string
 *                 format: uuid
 *                 description: Optional reverse distributor ID. If not provided, the system will attempt to find or create one based on the extracted distributor information.
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *     parameters:
 *       - in: query
 *         name: pharmacy_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Pharmacy ID (alternative to providing in form data)
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Return report processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReturnReportResponse'
 *             example:
 *               status: success
 *               message: Return report processed successfully
 *               data:
 *                 distributor: ABC Distributors
 *                 pharmacy: City Pharmacy
 *                 reportDate: 2024-01-15
 *                 returnNumber: RET-2024-001
 *                 items:
 *                   - itemName: Medication A
 *                     itemCode: MED-A-001
 *                     quantity: 10
 *                     unitPrice: 25.50
 *                     totalPrice: 255.00
 *                     expiryDate: 2024-03-15
 *                     reason: Expired
 *                     batchNumber: BATCH-001
 *                 totalAmount: 255.00
 *                 totalItems: 1
 *                 notes: Return processed successfully
 *       400:
 *         description: Bad request - invalid file, missing file, or file is not a PDF
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missingFile:
 *                 value:
 *                   status: fail
 *                   message: Please upload a PDF file
 *               invalidFileType:
 *                 value:
 *                   status: fail
 *                   message: Only PDF files are allowed
 *       500:
 *         description: Internal server error - PDF processing or AI extraction failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: error
 *               message: Failed to extract structured data from PDF
 */
router.post('/process', upload.single('file'), processReturnReportHandler);

export default router;

