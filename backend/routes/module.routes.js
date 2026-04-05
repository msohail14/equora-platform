import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import {
  getStableModulesController,
  setStableModuleController,
  getGlobalModuleDefaultsController,
  setGlobalModuleDefaultsController,
} from '../controllers/module.controller.js';

const router = express.Router();

// Per-stable module management (admin only)
router.get('/stables/:stableId/modules', adminAuthMiddleware, getStableModulesController);
router.put('/stables/:stableId/modules/:moduleKey', adminAuthMiddleware, setStableModuleController);

// Global module defaults (admin only)
router.get('/defaults', adminAuthMiddleware, getGlobalModuleDefaultsController);
router.put('/defaults', adminAuthMiddleware, setGlobalModuleDefaultsController);

export default router;
