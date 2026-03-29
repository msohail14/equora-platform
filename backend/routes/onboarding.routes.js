import { Router } from 'express';
import { onboardStableController, stableSetupWizardController, onboardCoachController, getSetupStatusController, setCredentialsController } from '../controllers/onboarding.controller.js';
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

// User auth — set email + password (for phone-only users during onboarding)
router.post('/set-credentials', authMiddleware, setCredentialsController);

export default router;
