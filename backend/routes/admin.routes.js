import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import superAdminOnly from '../middleware/super-admin.middleware.js';
import {
  getStableCoachesAdminController,
  linkStableCoachAdminController,
  unlinkStableCoachAdminController,
} from '../controllers/coachStable.controller.js';
import {
  approveStableController,
  changeAdminPasswordController,
  changeAdminProfileController,
  forgotAdminPasswordController,
  getAdminAnalyticsController,
  getAdminBookingsController,
  getAdminDashboardController,
  getAdminPaymentsController,
  getAdminPayoutsController,
  getAdminSettingsController,
  inviteStableOwnerController,
  loginAdminController,
  markManualPaymentController,
  processAdminPayoutController,
  refundPaymentController,
  resetAdminPasswordController,
  signupAdminController,
  updateAdminSettingsController,
  verifyCoachController,
} from '../controllers/admin.controller.js';
import {
  submitRegistrationController,
  getRegistrationsController,
  approveRegistrationController,
  rejectRegistrationController,
} from '../controllers/stableRegistration.controller.js';

const router = express.Router();

// Note: per-route rate limiters removed — they conflict with Railway's proxy
router.post('/signup', signupAdminController);
router.post('/login', loginAdminController);
router.post('/forgot-password', forgotAdminPasswordController);
router.post('/resend-reset-token', forgotAdminPasswordController);
router.post('/reset-password', resetAdminPasswordController);
router.post('/change-password', adminAuthMiddleware, changeAdminPasswordController);
router.put('/change-profile', adminAuthMiddleware, changeAdminProfileController);
router.get('/dashboard', adminAuthMiddleware, getAdminDashboardController);
router.get('/analytics', superAdminOnly, getAdminAnalyticsController);
router.get('/payments', adminAuthMiddleware, getAdminPaymentsController);
router.get('/payouts', superAdminOnly, getAdminPayoutsController);
router.post('/payouts/:id/process', superAdminOnly, processAdminPayoutController);
router.patch('/stables/:id/approve', superAdminOnly, approveStableController);
router.patch('/coaches/:id/verify', superAdminOnly, verifyCoachController);
router.get('/settings', superAdminOnly, getAdminSettingsController);
router.put('/settings', superAdminOnly, updateAdminSettingsController);
router.get('/bookings', adminAuthMiddleware, getAdminBookingsController);
router.patch('/payments/:id/manual', adminAuthMiddleware, markManualPaymentController);
router.patch('/payments/:id/refund', adminAuthMiddleware, refundPaymentController);
router.post('/stables/:id/invite-owner', superAdminOnly, inviteStableOwnerController);
router.get('/stables/:id/coaches', adminAuthMiddleware, getStableCoachesAdminController);
router.post('/stables/:id/coaches', adminAuthMiddleware, linkStableCoachAdminController);
router.delete('/stables/:id/coaches/:coachId', adminAuthMiddleware, unlinkStableCoachAdminController);

router.post('/stable-registrations', submitRegistrationController);
router.get('/stable-registrations', superAdminOnly, getRegistrationsController);
router.patch('/stable-registrations/:id/approve', superAdminOnly, approveRegistrationController);
router.patch('/stable-registrations/:id/reject', superAdminOnly, rejectRegistrationController);

export default router;
