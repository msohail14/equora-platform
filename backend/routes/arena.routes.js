import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { uploadArenaImage } from '../middleware/upload.middleware.js';
import {
  createArenaController,
  deleteArenaController,
  getAllArenasController,
  getAllArenasGlobalController,
  getArenaByIdController,
  updateArenaController,
} from '../controllers/arena.controller.js';

const router = express.Router();

router.post('/', adminAuthMiddleware, uploadArenaImage, createArenaController);
router.get('/', adminAuthMiddleware, getAllArenasController);
router.get('/all', adminAuthMiddleware, getAllArenasGlobalController);
router.get('/:id', adminAuthMiddleware, getArenaByIdController);
router.put('/:id', adminAuthMiddleware, uploadArenaImage, updateArenaController);
router.delete('/:id', adminAuthMiddleware, deleteArenaController);

export default router;
