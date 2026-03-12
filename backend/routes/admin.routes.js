import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import {
  changeAdminPasswordController,
  changeAdminProfileController,
  forgotAdminPasswordController,
  getAdminDashboardController,
  loginAdminController,
  resetAdminPasswordController,
  signupAdminController,
} from '../controllers/admin.controller.js';

const router = express.Router();

router.post('/signup', signupAdminController);
router.post('/login', loginAdminController);
router.post('/forgot-password', forgotAdminPasswordController);
router.post('/resend-reset-token', forgotAdminPasswordController);
router.post('/reset-password', resetAdminPasswordController);
router.post('/change-password', adminAuthMiddleware, changeAdminPasswordController);
router.put('/change-profile', adminAuthMiddleware, changeAdminProfileController);
router.get('/dashboard', adminAuthMiddleware, getAdminDashboardController);

export default router;
