import { Request, Response, NextFunction } from 'express';
import { processReturnReport } from '../services/returnReportService';
import { createDocument } from '../services/documentsService';
import { findOrCreateReverseDistributor } from '../services/reverseDistributorsService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

const getPharmacyId = (req: Request): string => {
  return (req.body.pharmacy_id || req.query.pharmacy_id) as string;
};

export const processReturnReportHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw new AppError('Please upload a PDF file', 400);
    }

    // Check if file is PDF
    if (req.file.mimetype !== 'application/pdf') {
      throw new AppError('Only PDF files are allowed', 400);
    }

    // Get pharmacy_id from request
    const pharmacyId = getPharmacyId(req);
    if (!pharmacyId) {
      throw new AppError('Pharmacy ID is required', 400);
    }

    // Get reverse_distributor_id from form data if provided
    const reverseDistributorId = req.body.reverse_distributor_id as string | undefined;

    // Process the PDF
    const pdfBuffer = req.file.buffer;
    const structuredData = await processReturnReport(pdfBuffer);

    // Find or create reverse distributor from processed data
    let distributorId = reverseDistributorId;
    if (!distributorId && structuredData.reverseDistributor) {
      try {
        console.log('🔍 Looking for reverse distributor:', structuredData.reverseDistributor);
        distributorId = await findOrCreateReverseDistributor(structuredData.reverseDistributor);
        console.log('✅ Reverse distributor ID:', distributorId);
      } catch (error: any) {
        console.error('⚠️ Failed to find/create reverse distributor:', error.message);
        // Continue without distributor ID if it fails
      }
    }

    // Save document to database
    let savedDocument;
    try {
      savedDocument = await createDocument({
        pharmacy_id: pharmacyId,
        file_name: req.file.originalname || 'document.pdf',
        file_size: req.file.size,
        file_type: req.file.mimetype,
        reverse_distributor_id: distributorId,
        source: 'manual_upload',
        extracted_items: structuredData.totalItems || structuredData.items?.length || 0,
        total_credit_amount: structuredData.totalCreditAmount || 0,
        status: 'completed',
      });
      console.log('✅ Document saved with distributor ID:', distributorId);
    } catch (error: any) {
      console.error('Failed to save document to database:', error);
      // Still return the processed data even if saving fails
    }

    res.status(200).json({
      status: 'success',
      message: 'Return report processed successfully',
      data: structuredData,
      document: savedDocument, // Include saved document info
    });
  }
);

