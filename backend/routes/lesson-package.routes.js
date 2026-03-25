import express from 'express';
import coachAuthMiddleware from '../middleware/coach-auth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  createPackageController,
  deletePackageController,
  getCoachPackagesController,
  getPackageByIdController,
  updatePackageController,
  purchasePackageController,
  getMyPackagesController,
} from '../controllers/lesson-package.controller.js';

const router = express.Router();

router.get('/coach/:id', getCoachPackagesController);
router.get('/my', authMiddleware, getMyPackagesController);
router.get('/:id', getPackageByIdController);
router.post('/', coachAuthMiddleware, createPackageController);
router.put('/:id', coachAuthMiddleware, updatePackageController);
router.delete('/:id', coachAuthMiddleware, deletePackageController);
router.post('/:id/purchase', authMiddleware, purchasePackageController);

export default router;
