import express from 'express';
import { getSettings, updateSettings, changePasswordHandler } from '../controllers/settingsController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.get('/', getSettings);
router.patch('/', updateSettings);
router.post('/change-password', changePasswordHandler);

export default router;

