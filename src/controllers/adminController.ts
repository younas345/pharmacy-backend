import { Request, Response, NextFunction } from 'express';
import { adminLogin } from '../services/adminService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login endpoint
 *     description: Authenticates admin user with email and password. Returns JWT token and user data.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@pharmadmin.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: your_password_here
 *     responses:
 *       200:
 *         description: Admin successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 access_token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: user_id_here
 *                     email:
 *                       type: string
 *                       example: admin@pharmadmin.com
 *                     name:
 *                       type: string
 *                       example: Admin User
 *                     role:
 *                       type: string
 *                       example: admin
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Invalid email or password
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Please provide email and password
 */
export const loginHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    const result = await adminLogin({ email, password });

    // Return response in the format expected by frontend
    // Frontend will look for token, accessToken, or access_token
    res.status(200).json({
      token: result.token,
      accessToken: result.accessToken,
      access_token: result.access_token,
      user: result.user,
    });
  }
);
