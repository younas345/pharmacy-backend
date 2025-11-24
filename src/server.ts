import express from 'express';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import authRoutes from './routes/authRoutes';
import returnReportRoutes from './routes/returnReportRoutes';
import inventoryRoutes from './routes/inventoryRoutes';
import returnsRoutes from './routes/returnsRoutes';
import productsRoutes from './routes/productsRoutes';
import productListsRoutes from './routes/productListsRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import creditsRoutes from './routes/creditsRoutes';
import documentsRoutes from './routes/documentsRoutes';
import barcodeRoutes from './routes/barcodeRoutes';
import optimizationRoutes from './routes/optimizationRoutes';
import distributorsRoutes from './routes/distributorsRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import { globalErrorHandler } from './controllers/errorController';
import { swaggerSpec } from './config/swagger';
import cors from 'cors';

dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3000;

// CORS Configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, or curl)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For production, you might want to be more strict
    if (process.env.NODE_ENV === 'production') {
      return callback(new Error('Not allowed by CORS'));
    }
    
    callback(null, true);
  },
  credentials: true, // Allow cookies/auth headers
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
}));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Webhook route (must be before JSON middleware to get raw body)
import { handleWebhook } from './controllers/webhookController';
app.post('/api/subscriptions/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Middleware (after webhook route)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/return-reports', returnReportRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/product-lists', productListsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/barcode', barcodeRoutes);
app.use('/api/optimization', optimizationRoutes);
app.use('/api/distributors', distributorsRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is running
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
 *                   example: Server is running
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
  });
});

// Global error handler (must be last)
app.use(globalErrorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});

