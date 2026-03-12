import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { uploadStableLogo } from '../middleware/upload.middleware.js';
import {
  createStableController,
  deleteStableController,
  getAllStablesController,
  getStableByIdController,
  updateStableController,
} from '../controllers/stable.controller.js';

const router = express.Router();

router.post('/', adminAuthMiddleware, uploadStableLogo, createStableController);
router.get('/', adminAuthMiddleware, getAllStablesController);
router.get('/:id', adminAuthMiddleware, getStableByIdController);
router.put('/:id', adminAuthMiddleware, uploadStableLogo, updateStableController);
router.delete('/:id', adminAuthMiddleware, deleteStableController);

export default router;
