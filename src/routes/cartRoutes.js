// src/routes/cartRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
  addToCart, 
  getCart, 
  updateCartItem, 
  removeFromCart, 
  clearCart 
} from '../controllers/cartController.js';

const router = Router();

router.post('/add', auth(), addToCart);
router.get('/', auth(), getCart);
router.put('/update', auth(), updateCartItem);
router.delete('/:productId', auth(), removeFromCart);
router.delete('/', auth(), clearCart);

export default router;