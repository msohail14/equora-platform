import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { requireModule } from '../middleware/module-gate.middleware.js';
import {
  createMaintenanceLogController,
  getMaintenanceLogsController,
  getUpcomingMaintenanceController,
  updateMaintenanceLogController,
  deleteMaintenanceLogController,
  getMaintenanceOverviewController,
} from '../controllers/horse-maintenance.controller.js';

const router = express.Router();

// All maintenance routes require admin auth + horse_maintenance module enabled
// The stable_id is resolved from the horse record in the service layer,
// but for the module gate we need it upfront — we pass it via a pre-check middleware.
const maintenanceGate = requireModule('horse_maintenance');

// Per-horse maintenance logs
router.post(
  '/horses/:horseId/maintenance',
  adminAuthMiddleware,
  createMaintenanceLogController
);

router.get(
  '/horses/:horseId/maintenance',
  adminAuthMiddleware,
  getMaintenanceLogsController
);

router.get(
  '/horses/:horseId/maintenance/upcoming',
  adminAuthMiddleware,
  getUpcomingMaintenanceController
);

router.put(
  '/horses/:horseId/maintenance/:logId',
  adminAuthMiddleware,
  updateMaintenanceLogController
);

router.delete(
  '/horses/:horseId/maintenance/:logId',
  adminAuthMiddleware,
  deleteMaintenanceLogController
);

// Stable-wide maintenance overview (for dashboard)
router.get(
  '/stables/:stableId/maintenance-overview',
  adminAuthMiddleware,
  maintenanceGate,
  getMaintenanceOverviewController
);

export default router;
