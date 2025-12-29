import { Request, Response, NextFunction } from 'express';
import { adminLogin, adminForgotPassword, adminVerifyResetToken, adminResetPassword } from '../services/adminService';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/appError';
import { sendAdminPasswordResetEmail, isEmailConfigured } from '../services/emailService';

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

/**
 * Admin forgot password handler
 * POST /api/auth/admin/forgot-password
 */
export const adminForgotPasswordHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { email, redirectTo } = req.body;

    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const result = await adminForgotPassword(email);

    // If we have a reset token, send an email
    if (result.resetToken && result.adminName && result.adminEmail) {
      const baseUrl = redirectTo || process.env.ADMIN_PASSWORD_RESET_REDIRECT_URL || 'http://localhost:3002/reset-password';
      const resetLink = `${baseUrl}?token=${result.resetToken}`;
      
      // Log the reset link for debugging (always log for now)
      console.log(`[Admin Password Reset] Reset link for ${email}: ${resetLink}`);
      
      // Send email if SMTP is configured
      if (isEmailConfigured()) {
        const emailSent = await sendAdminPasswordResetEmail(
          result.adminEmail,
          result.adminName,
          resetLink
        );
        
        if (emailSent) {
          console.log(`[Admin Password Reset] Email sent successfully to ${result.adminEmail}`);
        } else {
          console.error(`[Admin Password Reset] Failed to send email to ${result.adminEmail}`);
        }
      } else {
        console.warn('[Admin Password Reset] SMTP not configured. Email not sent. Check the console for the reset link.');
      }
    }

    // Always return success for security (don't reveal if email exists)
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  }
);

/**
 * Admin verify reset token handler
 * POST /api/auth/admin/verify-reset-token
 */
export const adminVerifyResetTokenHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token } = req.body;

    if (!token) {
      throw new AppError('Reset token is required', 400);
    }

    const result = await adminVerifyResetToken(token);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  }
);

/**
 * Admin reset password handler
 * POST /api/auth/admin/reset-password
 */
export const adminResetPasswordHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { token, newPassword } = req.body;

    if (!token) {
      throw new AppError('Reset token is required', 400);
    }

    if (!newPassword) {
      throw new AppError('New password is required', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    const result = await adminResetPassword(token, newPassword);

    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  }
);
