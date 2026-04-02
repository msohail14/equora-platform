import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import { uploadUserProfileImage } from '../middleware/upload.middleware.js';
import { authRateLimiter, otpRateLimiter } from '../middleware/rate-limit.middleware.js';
import {
  validate,
  signupValidation,
  loginValidation,
  verifyEmailOtpValidation,
  resendEmailOtpValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  changePasswordValidation,
  updateFcmTokenValidation,
} from '../middleware/validation.middleware.js';
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
router.post('/signup', authRateLimiter, uploadUserProfileImage, signupValidation, validate, signup);
router.post('/login', authRateLimiter, loginValidation, validate, login);
router.post('/verify-email-otp', otpRateLimiter, verifyEmailOtpValidation, validate, verifyEmailOtpController);
router.post('/resend-verification-otp', otpRateLimiter, resendEmailOtpValidation, validate, resendEmailOtpController);
router.post('/forgot-password', authRateLimiter, forgotPasswordValidation, validate, forgotPasswordController);
router.post('/resend-reset-token', authRateLimiter, forgotPasswordValidation, validate, forgotPasswordController);
router.post('/reset-password', authRateLimiter, resetPasswordValidation, validate, resetPasswordController);
router.get('/me', authMiddleware, getMyProfileController);
router.post('/change-password', authMiddleware, changePasswordValidation, validate, changePasswordController);
router.put('/change-profile', authMiddleware, uploadUserProfileImage, changeProfileController);
router.patch('/me/fcm-token', authMiddleware, updateFcmTokenValidation, validate, updateFcmTokenController);

export default router;
