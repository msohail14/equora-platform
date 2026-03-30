import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { uploadUserProfileImage } from '../middleware/upload.middleware.js';
import { authRateLimiter, otpRateLimiter } from '../middleware/rate-limit.middleware.js';
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

// Per-route rate limiters re-enabled. The keyGenerator in rate-limit.middleware.js
// uses req.ip (resolved via trust proxy) to avoid Railway 503 proxy conflicts.
router.post('/signup', authRateLimiter, uploadUserProfileImage, signup);
router.post('/login', authRateLimiter, login);
router.post('/verify-email-otp', otpRateLimiter, verifyEmailOtpController);
router.post('/resend-verification-otp', otpRateLimiter, resendEmailOtpController);
router.post('/forgot-password', authRateLimiter, forgotPasswordController);
router.post('/resend-reset-token', authRateLimiter, forgotPasswordController);
router.post('/reset-password', authRateLimiter, resetPasswordController);
router.get('/me', authMiddleware, getMyProfileController);
router.post('/change-password', authMiddleware, changePasswordController);
router.put('/change-profile', authMiddleware, uploadUserProfileImage, changeProfileController);
router.patch('/me/fcm-token', authMiddleware, updateFcmTokenController);

export default router;
