import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '../utils/catchAsync';
import {
  getPharmacySettings,
  updatePharmacySettings,
  changePassword,
  UpdateSettingsData,
  ChangePasswordData,
} from '../services/settingsService';
import { AppError } from '../utils/appError';

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get pharmacy settings/profile
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Pharmacy settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/PharmacySettings'
 */
export const getSettings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const pharmacyId = req.pharmacyId;

  if (!pharmacyId) {
    return next(new AppError('Pharmacy ID is required', 400));
  }

  const settings = await getPharmacySettings(pharmacyId);

  res.status(200).json({
    status: 'success',
    data: settings,
  });
});

/**
 * @swagger
 * /api/settings:
 *   patch:
 *     summary: Update pharmacy settings/profile
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               contact_phone:
 *                 type: string
 *               pharmacy_name:
 *                 type: string
 *               npi_number:
 *                 type: string
 *               dea_number:
 *                 type: string
 *               title:
 *                 type: string
 *               physical_address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zip:
 *                     type: string
 *               billing_address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   zip:
 *                     type: string
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
export const updateSettings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const pharmacyId = req.pharmacyId;

  if (!pharmacyId) {
    return next(new AppError('Pharmacy ID is required', 400));
  }

  const updateData: UpdateSettingsData = req.body;

  const updatedSettings = await updatePharmacySettings(pharmacyId, updateData);

  res.status(200).json({
    status: 'success',
    data: updatedSettings,
    message: 'Settings updated successfully',
  });
});

/**
 * @swagger
 * /api/settings/change-password:
 *   post:
 *     summary: Change password
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
export const changePasswordHandler = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const pharmacyId = req.pharmacyId;

    if (!pharmacyId) {
      return next(new AppError('Pharmacy ID is required', 400));
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new AppError('All password fields are required', 400));
    }

    await changePassword(pharmacyId, {
      currentPassword,
      newPassword,
      confirmPassword,
    });

    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  }
);

