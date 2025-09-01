// src/routes/influencerRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { 
  createCampaign, 
  myCampaigns, 
  updateCampaign, 
  deleteCampaign,
  availableVendors 
} from '../controllers/influencerController.js';

const router = Router();

router.post('/campaigns', auth(), permit('influencer', 'admin'), createCampaign);
router.get('/campaigns/mine', auth(), permit('influencer', 'admin'), myCampaigns);
router.put('/campaigns/:id', auth(), permit('influencer', 'admin'), updateCampaign);
router.delete('/campaigns/:id', auth(), permit('influencer', 'admin'), deleteCampaign);
router.get('/vendors', auth(), permit('influencer', 'admin'), availableVendors);

export default router;