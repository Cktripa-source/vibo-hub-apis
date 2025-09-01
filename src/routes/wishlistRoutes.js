// src/routes/wishlistRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { 
  addToWishlist, 
  removeFromWishlist, 
  getWishlist 
} from '../controllers/wishlistController.js';

const router = Router();

router.post('/', auth(), addToWishlist);
router.delete('/:productId', auth(), removeFromWishlist);
router.get('/', auth(), getWishlist);

export default router;