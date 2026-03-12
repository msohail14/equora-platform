import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { uploadHorseProfileImage } from '../middleware/upload.middleware.js';
import {
  createHorseController,
  deleteHorseController,
  getAllHorsesController,
  getAllHorsesGlobalController,
  getHorseByIdController,
  updateHorseController,
} from '../controllers/horse.controller.js';

const router = express.Router();

router.post('/', adminAuthMiddleware, uploadHorseProfileImage, createHorseController);
router.get('/', adminAuthMiddleware, getAllHorsesController);
router.get('/all', adminAuthMiddleware, getAllHorsesGlobalController);
router.get('/:id', adminAuthMiddleware, getHorseByIdController);
router.put('/:id', adminAuthMiddleware, uploadHorseProfileImage, updateHorseController);
router.delete('/:id', adminAuthMiddleware, deleteHorseController);

export default router;
