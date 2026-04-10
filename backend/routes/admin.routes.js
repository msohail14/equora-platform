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
  adminModifyBookingController,
  getAdminDashboardController,
  getAdminPaymentsController,
  getAdminPayoutsController,
  getAdminSettingsController,
  inviteStableOwnerController,
  listAdminAccountsController,
  loginAdminController,
  markManualPaymentController,
  processAdminPayoutController,
  refundPaymentController,
  resetAdminPasswordController,
  signupAdminController,
  resetStableOwnerPasswordController,
  updateAdminSettingsController,
  updateStableOwnerProfileController,
  deleteStableOwnerController,
  verifyCoachController,
} from '../controllers/admin.controller.js';
import {
  submitRegistrationController,
  getRegistrationsController,
  approveRegistrationController,
  rejectRegistrationController,
} from '../controllers/stableRegistration.controller.js';

import { authRateLimiter } from '../middleware/rate-limit.middleware.js';
import {
  validate,
  adminSignupValidation,
  adminLoginValidation,
  adminForgotPasswordValidation,
  adminResetPasswordValidation,
  adminChangePasswordValidation,
  adminIdParamValidation,
  adminCoachIdParamValidation,
} from '../middleware/validation.middleware.js';

const router = express.Router();

// Rate limit auth routes to prevent brute-force attacks
router.post('/signup', authRateLimiter, adminSignupValidation, validate, signupAdminController);
router.post('/login', authRateLimiter, adminLoginValidation, validate, loginAdminController);
router.post('/forgot-password', authRateLimiter, adminForgotPasswordValidation, validate, forgotAdminPasswordController);
router.post('/resend-reset-token', authRateLimiter, adminForgotPasswordValidation, validate, forgotAdminPasswordController);
router.post('/reset-password', authRateLimiter, adminResetPasswordValidation, validate, resetAdminPasswordController);
router.post('/change-password', adminAuthMiddleware, adminChangePasswordValidation, validate, changeAdminPasswordController);
router.put('/change-profile', adminAuthMiddleware, changeAdminProfileController);
router.get('/dashboard', adminAuthMiddleware, getAdminDashboardController);
router.get('/analytics', superAdminOnly, getAdminAnalyticsController);
router.get('/payments', adminAuthMiddleware, getAdminPaymentsController);
router.get('/payouts', superAdminOnly, getAdminPayoutsController);
router.post('/payouts/:id/process', superAdminOnly, adminIdParamValidation, validate, processAdminPayoutController);
router.patch('/stables/:id/approve', superAdminOnly, adminIdParamValidation, validate, approveStableController);
router.patch('/coaches/:id/verify', superAdminOnly, adminIdParamValidation, validate, verifyCoachController);
router.get('/settings', superAdminOnly, getAdminSettingsController);
router.put('/settings', superAdminOnly, updateAdminSettingsController);
router.get('/bookings', adminAuthMiddleware, getAdminBookingsController);
router.patch('/bookings/:id/assign', adminAuthMiddleware, adminModifyBookingController);
router.patch('/payments/:id/manual', adminAuthMiddleware, adminIdParamValidation, validate, markManualPaymentController);
router.patch('/payments/:id/refund', adminAuthMiddleware, adminIdParamValidation, validate, refundPaymentController);
router.post('/stables/:id/invite-owner', superAdminOnly, adminIdParamValidation, validate, inviteStableOwnerController);

// Stable owner management (super admin only)
router.get('/accounts', superAdminOnly, listAdminAccountsController);
router.post('/accounts/:id/reset-password', superAdminOnly, adminIdParamValidation, validate, resetStableOwnerPasswordController);
router.put('/accounts/:id', superAdminOnly, adminIdParamValidation, validate, updateStableOwnerProfileController);
router.delete('/accounts/:id', superAdminOnly, adminIdParamValidation, validate, deleteStableOwnerController);
router.get('/stables/:id/coaches', adminAuthMiddleware, adminIdParamValidation, validate, getStableCoachesAdminController);
router.post('/stables/:id/coaches', adminAuthMiddleware, adminIdParamValidation, validate, linkStableCoachAdminController);
router.delete('/stables/:id/coaches/:coachId', adminAuthMiddleware, adminCoachIdParamValidation, validate, unlinkStableCoachAdminController);

router.post('/stable-registrations', submitRegistrationController);
router.get('/stable-registrations', superAdminOnly, getRegistrationsController);
router.patch('/stable-registrations/:id/approve', superAdminOnly, adminIdParamValidation, validate, approveRegistrationController);
router.patch('/stable-registrations/:id/reject', superAdminOnly, adminIdParamValidation, validate, rejectRegistrationController);

export default router;
