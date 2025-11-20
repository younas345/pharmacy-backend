import express from 'express';
import { parseBarcode } from '../controllers/barcodeController';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Barcode
 *   description: Barcode parsing operations
 */

router.post('/parse', parseBarcode);

export default router;

