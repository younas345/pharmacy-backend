import express from 'express';
import { signupHandler, signinHandler, refreshTokenHandler } from '../controllers/authController';

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new pharmacy user with Supabase Auth
 *     description: Creates a new user in Supabase Auth and links it to a pharmacy profile. Returns Supabase session tokens for authentication.
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
 * /api/auth/signin:
 *   post:
 *     summary: Login with email and password using Supabase Auth
 *     description: Authenticates user with Supabase Auth and returns session tokens. The access token can be used for subsequent API requests.
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
 *     summary: Refresh access token using refresh token
 *     description: Uses a refresh token to obtain a new access token and refresh token. This should be called when the access token expires (typically after 1 hour).
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: 'v1.abc123def456...'
 *                 description: Refresh token obtained from signin or signup response
 *     responses:
 *       200:
 *         description: Token successfully refreshed
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
 *               message: 'Invalid or expired refresh token'
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

export default router;

