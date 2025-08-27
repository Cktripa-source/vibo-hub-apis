import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { createLink, myLinks, trackClick } from '../controllers/affiliateController.js';

const router = Router();

router.post('/links', auth(), permit('affiliate','admin'), createLink);
router.get('/links/mine', auth(), permit('affiliate','admin'), myLinks);
router.get('/track/:code', trackClick);

export default router;
