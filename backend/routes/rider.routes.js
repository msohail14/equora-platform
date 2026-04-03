import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import {
  createRiderController,
  deleteRiderController,
  getAllRidersController,
  getRiderDeletionPreviewController,
  getRiderDetailsController,
  getRiderSessionsController,
  getRiderStatsController,
  resetRiderPasswordController,
  updateRiderController,
  updateRiderStatusController,
} from '../controllers/rider.controller.js';

const router = express.Router();

router.post('/', adminAuthMiddleware, createRiderController);
router.get('/', adminAuthMiddleware, getAllRidersController);
router.get('/:id', adminAuthMiddleware, getRiderDetailsController);
router.get('/:id/stats', adminAuthMiddleware, getRiderStatsController);
router.get('/:id/sessions', adminAuthMiddleware, getRiderSessionsController);
router.put('/:id', adminAuthMiddleware, updateRiderController);
router.get('/:id/deletion-preview', adminAuthMiddleware, getRiderDeletionPreviewController);
router.delete('/:id', adminAuthMiddleware, deleteRiderController);
router.put('/:id/status', adminAuthMiddleware, updateRiderStatusController);
router.post('/:id/reset-password', adminAuthMiddleware, resetRiderPasswordController);

export default router;
