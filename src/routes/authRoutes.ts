import express from 'express';
import { signupHandler, signinHandler, refreshTokenHandler, logoutHandler, logoutAllHandler } from '../controllers/authController';
import { loginHandler } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new pharmacy user with Supabase Auth
 *     description: Creates a new user in Supabase Auth and links it to a pharmacy profile. Returns access token and custom refresh token for authentication.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SignupRequest'
 *     responses:
 *       201:
 *         description: User successfully registered and authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Bad request - validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               validationError:
 *                 value:
 *                   status: 'fail'
 *                   message: 'Please provide email, password, name, and pharmacyName'
 *               userExists:
 *                 value:
 *                   status: 'fail'
 *                   message: 'User with this email already exists'
 *       500:
 *         description: Server error - Supabase admin client not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/signup', signupHandler);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Admin login endpoint
 *     description: Authenticates admin user with email and password. Returns JWT token and user data. This endpoint is specifically for admin panel authentication.
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
router.post('/login', loginHandler);

/**
 * @swagger
 * /api/auth/signin:
 *   post:
 *     summary: Login with email and password using Supabase Auth
 *     description: Authenticates user with Supabase Auth and returns access token and custom refresh token. The access token expires in 1 hour, while the refresh token is valid for 30 days.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SigninRequest'
 *     responses:
 *       200:
 *         description: User successfully authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: 'fail'
 *               message: 'Invalid email or password'
 *       400:
 *         description: Bad request - validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: 'fail'
 *               message: 'Please provide email and password'
 *       404:
 *         description: Pharmacy profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: 'fail'
 *               message: 'Pharmacy profile not found'
 */
router.post('/signin', signinHandler);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using custom refresh token
 *     description: |
 *       Uses a custom refresh token to obtain a new access token. 
 *       
 *       **Important:** 
 *       - Custom refresh tokens are valid for 30 days (independent of Supabase session expiry)
 *       - Tokens are rotated on each refresh - always use the new refresh token from the response
 *       - Each refresh token can only be used once for security
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token successfully refreshed. Returns new access token and rotated refresh token.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Unauthorized - invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: 'fail'
 *               message: 'Invalid or expired refresh token. Please sign in again.'
 *       400:
 *         description: Bad request - refresh token not provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: 'fail'
 *               message: 'Refresh token is required'
 *       404:
 *         description: Pharmacy profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/refresh', refreshTokenHandler);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     description: Revokes the provided refresh token, preventing it from being used to obtain new access tokens. Client should also clear local token storage.
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LogoutRequest'
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 */
router.post('/logout', logoutHandler);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     description: Revokes all refresh tokens for the authenticated user, effectively logging them out from all devices. Requires authentication.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogoutResponse'
 *             example:
 *               status: 'success'
 *               message: 'Logged out from all devices successfully'
 *       401:
 *         description: Unauthorized - no valid access token provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: 'fail'
 *               message: 'Authentication required'
 */
router.post('/logout-all', authenticate, logoutAllHandler);

export default router;
