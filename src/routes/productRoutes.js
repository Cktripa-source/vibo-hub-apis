import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { permit } from '../middleware/roles.js';
import { list, create, update, remove, get } from '../controllers/productController.js';

const router = Router();

router.get('/', list);
router.get('/:id', get);
router.post('/', auth(), permit('vendor','admin'), create);
router.put('/:id', auth(), permit('vendor','admin'), update);
router.delete('/:id', auth(), permit('vendor','admin'), remove);

export default router;
