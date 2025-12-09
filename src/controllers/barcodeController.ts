import { Request, Response, NextFunction } from 'express';
import { parseBarcodeWithAI } from '../services/barcodeService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

/**
 * @swagger
 * /api/barcode/parse:
 *   post:
 *     summary: Parse barcode data to extract NDC, lot number, and expiration date
 *     tags: [Barcode]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - barcodeData
 *             properties:
 *               barcodeData:
 *                 type: string
 *                 description: The barcode data string to parse
 *                 example: "16729009712|RXM2114938|2024-09-24"
 *     responses:
 *       200:
 *         description: Successfully parsed barcode data
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
 *                     ndc:
 *                       type: string
 *                       example: "16729-0097-12"
 *                     lotNumber:
 *                       type: string
 *                       example: "RXM2114938"
 *                     expirationDate:
 *                       type: string
 *                       example: "2024-09-24"
 *       400:
 *         description: Bad request - invalid barcode data
 *       500:
 *         description: Server error
 */
export const parseBarcode = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { barcodeData } = req.body;

    if (!barcodeData || typeof barcodeData !== 'string' || barcodeData.trim() === '') {
      return next(new AppError('Barcode data is required', 400));
    }

    const parsed = await parseBarcodeWithAI(barcodeData.trim());

    res.status(200).json({
      status: 'success',
      data: parsed,
    });
  }
);

