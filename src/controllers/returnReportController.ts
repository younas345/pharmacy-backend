import { Request, Response, NextFunction } from 'express';
import { processReturnReport } from '../services/returnReportService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

export const processReturnReportHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) {
      throw new AppError('Please upload a PDF file', 400);
    }

    // Check if file is PDF
    if (req.file.mimetype !== 'application/pdf') {
      throw new AppError('Only PDF files are allowed', 400);
    }

    // Process the PDF
    const pdfBuffer = req.file.buffer;
    const structuredData = await processReturnReport(pdfBuffer);

    res.status(200).json({
      status: 'success',
      message: 'Return report processed successfully',
      data: structuredData,
    });
  }
);

