import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createOrder, markPaid, myOrders } from '../controllers/orderController.js';

const router = Router();

router.post('/', auth(), createOrder);
router.post('/paid', auth(), markPaid);
router.get('/mine', auth(), myOrders);

export default router;
