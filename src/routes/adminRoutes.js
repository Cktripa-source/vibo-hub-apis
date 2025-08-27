import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { stats } from '../controllers/adminController.js';

const router = Router();

router.get('/stats', auth(), permit('admin'), stats);

export default router;
