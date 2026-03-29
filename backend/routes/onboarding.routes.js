import { Router } from 'express';
import { onboardStableController, stableSetupWizardController, onboardCoachController, getSetupStatusController } from '../controllers/onboarding.controller.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = Router();

// Admin auth — create stable after onboarding auth
router.post('/stable', adminAuthMiddleware, onboardStableController);

// Admin auth — setup wizard (add coaches, horses, availability)
router.put('/stable/setup', adminAuthMiddleware, stableSetupWizardController);

// Admin auth — get setup completion status
router.get('/stable/status', adminAuthMiddleware, getSetupStatusController);

// User auth — coach profile setup after onboarding auth
router.post('/coach', authMiddleware, onboardCoachController);

export default router;
