// src/routes/notificationRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} from '../controllers/notificationController.js';

const router = Router();

router.get('/', auth(), getNotifications);
router.patch('/:id/read', auth(), markAsRead);
router.patch('/read-all', auth(), markAllAsRead);

export default router;