import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { uploadUserProfileImage } from '../middleware/upload.middleware.js';
import {
  changePasswordController,
  changeProfileController,
  forgotPasswordController,
  getMyProfileController,
  login,
  resendEmailOtpController,
  resetPasswordController,
  signup,
  updateFcmTokenController,
  verifyEmailOtpController,
} from '../controllers/user.controller.js';

const router = express.Router();

// Note: per-route rate limiters removed — they conflict with Railway's proxy
// and cause 503 errors. The global generalRateLimiter (200 req/15min) still protects all routes.
router.post('/signup', uploadUserProfileImage, signup);
router.post('/login', login);
router.post('/verify-email-otp', verifyEmailOtpController);
router.post('/resend-verification-otp', resendEmailOtpController);
router.post('/forgot-password', forgotPasswordController);
router.post('/resend-reset-token', forgotPasswordController);
router.post('/reset-password', resetPasswordController);
router.get('/me', authMiddleware, getMyProfileController);
router.post('/change-password', authMiddleware, changePasswordController);
router.put('/change-profile', authMiddleware, uploadUserProfileImage, changeProfileController);
router.patch('/me/fcm-token', authMiddleware, updateFcmTokenController);

export default router;
