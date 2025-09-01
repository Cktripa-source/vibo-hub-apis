// src/routes/uploadRoutes.js
import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { auth } from '../middleware/auth.js';
import { ok } from '../utils/response.js';

const router = Router();

router.post('/images', auth(), upload.array('images', 5), (req, res, next) => {
  try {
    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/${file.filename}`,
      size: file.size
    }));
    ok(res, files, 'Images uploaded successfully');
  } catch (e) { next(e); }
});

export default router;