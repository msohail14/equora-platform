import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import {
  createRiderController,
  getAllRidersController,
  getRiderDetailsController,
  getRiderSessionsController,
  getRiderStatsController,
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
router.put('/:id/status', adminAuthMiddleware, updateRiderStatusController);

export default router;
