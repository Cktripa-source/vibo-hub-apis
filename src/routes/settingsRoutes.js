// src/routes/settingsRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidation } from '../middleware/validate.js';
import { 
  getProfile, 
  updateProfile, 
  changePassword 
} from '../controllers/settingsController.js';

const router = Router();

router.get('/profile', auth(), getProfile);
router.put('/profile', auth(), updateProfile);
router.put('/password', auth(), [
  body('currentPassword').notEmpty().withMessage('Current password required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], handleValidation, changePassword);

export default router;