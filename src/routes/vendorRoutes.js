// src/routes/vendorRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { 
  dashboard, 
  myProducts, 
  myOrders,
  requestWithdrawal 
} from '../controllers/vendorController.js';

const router = Router();

router.get('/dashboard', auth(), permit('vendor', 'admin'), dashboard);
router.get('/products', auth(), permit('vendor', 'admin'), myProducts);
router.get('/orders', auth(), permit('vendor', 'admin'), myOrders);
router.post('/withdrawals', auth(), permit('vendor', 'admin'), requestWithdrawal);

export default router;