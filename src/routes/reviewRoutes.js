// src/routes/reviewRoutes.js
import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createReview, getProductReviews } from '../controllers/reviewController.js';

const router = Router();

router.post('/', auth(), createReview);
router.get('/product/:productId', getProductReviews);

export default router;