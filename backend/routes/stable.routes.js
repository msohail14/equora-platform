import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { uploadStableLogo } from '../middleware/upload.middleware.js';
import {
  createStableController,
  deleteStableController,
  getAllStablesController,
  getPublicStablesController,
  getPublicStableByIdController,
  getStableByIdController,
  updateStableController,
} from '../controllers/stable.controller.js';

const router = express.Router();

router.get('/public', getPublicStablesController);
router.get('/public/:id', getPublicStableByIdController);

router.post('/', adminAuthMiddleware, uploadStableLogo, createStableController);
router.get('/', adminAuthMiddleware, getAllStablesController);
router.get('/:id', adminAuthMiddleware, getStableByIdController);
router.put('/:id', adminAuthMiddleware, uploadStableLogo, updateStableController);
router.delete('/:id', adminAuthMiddleware, deleteStableController);

export default router;
