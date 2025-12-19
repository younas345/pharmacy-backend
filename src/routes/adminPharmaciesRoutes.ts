import { Router } from 'express';
import {
  getPharmaciesHandler,
  getPharmacyByIdHandler,
  updatePharmacyHandler,
  updatePharmacyStatusHandler,
} from '../controllers/adminPharmaciesController';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

// Apply admin authentication middleware to all routes
router.use(authenticateAdmin);

/**
 * @swagger
 * /api/admin/pharmacies:
 *   get:
 *     summary: Get list of all pharmacies
 *     description: |
 *       Returns a paginated list of all pharmacies with search and filter options.
 *       Includes business name, owner, contact info, location, status, and total returns count.
 *     tags: [Admin - Pharmacies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by business name, owner name, email, or pharmacy ID
 *         example: "HealthFirst"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, pending, active, suspended, blacklisted]
 *           default: all
 *         description: Filter by pharmacy status
 *         example: active
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items per page (max 100)
 *         example: 20
 *     responses:
 *       200:
 *         description: List of pharmacies retrieved successfully
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
 *                     pharmacies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           businessName:
 *                             type: string
 *                             example: "HealthFirst Pharmacy"
 *                           owner:
 *                             type: string
 *                             example: "John Smith"
 *                           email:
 *                             type: string
 *                             example: "john@healthfirst.com"
 *                           phone:
 *                             type: string
 *                             example: "(555) 123-4567"
 *                           city:
 *                             type: string
 *                             example: "New York"
 *                           state:
 *                             type: string
 *                             example: "NY"
 *                           status:
 *                             type: string
 *                             enum: [pending, active, suspended, blacklisted]
 *                             example: "active"
 *                           address:
 *                             type: string
 *                             example: "123 Main St"
 *                           zipCode:
 *                             type: string
 *                             example: "10001"
 *                           licenseNumber:
 *                             type: string
 *                             example: "NY-12345"
 *                           totalReturns:
 *                             type: integer
 *                             example: 45
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 248
 *                         totalPages:
 *                           type: integer
 *                           example: 13
 *                     filters:
 *                       type: object
 *                       properties:
 *                         search:
 *                           type: string
 *                           nullable: true
 *                         status:
 *                           type: string
 *                           example: "all"
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/', getPharmaciesHandler);

/**
 * @swagger
 * /api/admin/pharmacies/{id}:
 *   get:
 *     summary: Get single pharmacy details
 *     description: |
 *       Returns detailed information about a specific pharmacy including
 *       business info, contact details, addresses, subscription info, and total returns.
 *     tags: [Admin - Pharmacies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Pharmacy ID
 *     responses:
 *       200:
 *         description: Pharmacy details retrieved successfully
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
 *                     pharmacy:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         businessName:
 *                           type: string
 *                         owner:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         city:
 *                           type: string
 *                         state:
 *                           type: string
 *                         status:
 *                           type: string
 *                         address:
 *                           type: string
 *                         zipCode:
 *                           type: string
 *                         licenseNumber:
 *                           type: string
 *                         npiNumber:
 *                           type: string
 *                           nullable: true
 *                         deaNumber:
 *                           type: string
 *                           nullable: true
 *                         totalReturns:
 *                           type: integer
 *                         totalReturnsValue:
 *                           type: number
 *                         physicalAddress:
 *                           type: object
 *                           nullable: true
 *                         billingAddress:
 *                           type: object
 *                           nullable: true
 *                         subscriptionTier:
 *                           type: string
 *                           nullable: true
 *                         subscriptionStatus:
 *                           type: string
 *                           nullable: true
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Pharmacy not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.get('/:id', getPharmacyByIdHandler);

/**
 * @swagger
 * /api/admin/pharmacies/{id}:
 *   put:
 *     summary: Update pharmacy details
 *     description: |
 *       Updates pharmacy information. Only the provided fields will be updated.
 *       Can update business name, owner, email, phone, address, city, state, zipCode, and licenseNumber.
 *     tags: [Admin - Pharmacies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Pharmacy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Pharmacy business name
 *                 example: "HealthFirst Pharmacy"
 *               owner:
 *                 type: string
 *                 description: Owner/contact name
 *                 example: "John Smith"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email
 *                 example: "john@healthfirst.com"
 *               phone:
 *                 type: string
 *                 description: Phone number
 *                 example: "(555) 123-4567"
 *               address:
 *                 type: string
 *                 description: Street address
 *                 example: "123 Main St"
 *               city:
 *                 type: string
 *                 description: City
 *                 example: "New York"
 *               state:
 *                 type: string
 *                 description: State
 *                 example: "NY"
 *               zipCode:
 *                 type: string
 *                 description: ZIP code
 *                 example: "10001"
 *               licenseNumber:
 *                 type: string
 *                 description: License/NPI number
 *                 example: "NY-12345"
 *     responses:
 *       200:
 *         description: Pharmacy updated successfully
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
 *                   example: "Pharmacy updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pharmacy:
 *                       type: object
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid request body
 *       404:
 *         description: Pharmacy not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.put('/:id', updatePharmacyHandler);

/**
 * @swagger
 * /api/admin/pharmacies/{id}/status:
 *   put:
 *     summary: Update pharmacy status (blacklist/restore/suspend)
 *     description: |
 *       Updates the status of a pharmacy. Used for:
 *       - Blacklisting: Set status to 'blacklisted' to prevent platform access
 *       - Restoring: Set status to 'active' to reactivate platform access
 *       - Suspending: Set status to 'suspended' for temporary suspension
 *     tags: [Admin - Pharmacies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Pharmacy ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, active, suspended, blacklisted]
 *                 description: New status for the pharmacy
 *                 example: "blacklisted"
 *     responses:
 *       200:
 *         description: Pharmacy status updated successfully
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
 *                   example: "Pharmacy status updated to blacklisted"
 *                 data:
 *                   type: object
 *                   properties:
 *                     pharmacy:
 *                       type: object
 *                     statusChange:
 *                       type: object
 *                       properties:
 *                         from:
 *                           type: string
 *                           example: "active"
 *                         to:
 *                           type: string
 *                           example: "blacklisted"
 *                     generatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Pharmacy not found
 *       401:
 *         description: Unauthorized - invalid or missing token
 */
router.put('/:id/status', updatePharmacyStatusHandler);

export default router;

