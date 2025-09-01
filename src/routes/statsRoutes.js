
// src/routes/statsRoutes.js
import { Router } from 'express';
import { platformStats } from '../controllers/statsController.js';
import { simpleCache } from '../middleware/cache.js';

const router = Router();

router.get('/platform', simpleCache(2 * 60 * 1000), platformStats); // Cache for 2 minutes

export default router;