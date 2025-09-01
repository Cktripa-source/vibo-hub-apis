// src/routes/analyticsRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { vendorAnalytics, affiliateAnalytics } from '../controllers/analyticsController.js';

const router = Router();

router.get('/vendor', auth(), permit('vendor', 'admin'), vendorAnalytics);
router.get('/affiliate', auth(), permit('affiliate', 'admin'), affiliateAnalytics);

export default router;