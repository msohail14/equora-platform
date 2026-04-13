import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { requireModule } from '../middleware/module-gate.middleware.js';
import Horse from '../models/horse.model.js';
import {
  createMaintenanceLogController,
  getMaintenanceLogsController,
  getUpcomingMaintenanceController,
  updateMaintenanceLogController,
  deleteMaintenanceLogController,
  getMaintenanceOverviewController,
} from '../controllers/horse-maintenance.controller.js';

const router = express.Router();

const maintenanceGate = requireModule('horse_maintenance');

// Resolve stable_id from horseId param so the module gate can check it
const resolveStableFromHorse = async (req, res, next) => {
  try {
    const horse = await Horse.findByPk(req.params.horseId, { attributes: ['id', 'stable_id'] });
    if (!horse) return res.status(404).json({ message: 'Horse not found.' });
    req.stableId = horse.stable_id;
    return next();
  } catch {
    return res.status(500).json({ message: 'Failed to resolve horse stable.' });
  }
};

// Per-horse maintenance logs — all gated by module + admin auth
router.post(
  '/horses/:horseId/maintenance',
  adminAuthMiddleware,
  resolveStableFromHorse,
  maintenanceGate,
  createMaintenanceLogController
);

router.get(
  '/horses/:horseId/maintenance',
  adminAuthMiddleware,
  resolveStableFromHorse,
  maintenanceGate,
  getMaintenanceLogsController
);

router.get(
  '/horses/:horseId/maintenance/upcoming',
  adminAuthMiddleware,
  resolveStableFromHorse,
  maintenanceGate,
  getUpcomingMaintenanceController
);

router.put(
  '/horses/:horseId/maintenance/:logId',
  adminAuthMiddleware,
  resolveStableFromHorse,
  maintenanceGate,
  updateMaintenanceLogController
);

router.delete(
  '/horses/:horseId/maintenance/:logId',
  adminAuthMiddleware,
  resolveStableFromHorse,
  maintenanceGate,
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
