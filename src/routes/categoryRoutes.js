import express from 'express';
import { list, create } from '../controllers/categoryController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Public: list categories
router.get('/', list);

// Admin: create category
router.post('/', auth, create);

export default router;
