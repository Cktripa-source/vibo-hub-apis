// src/routes/walletRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
  getBalance, 
  getTransactions, 
  getWithdrawals 
} from '../controllers/walletController.js';

const router = Router();

router.get('/balance', auth(), getBalance);
router.get('/transactions', auth(), getTransactions);
router.get('/withdrawals', auth(), getWithdrawals);

export default router;