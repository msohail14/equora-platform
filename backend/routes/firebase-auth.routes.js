import { Router } from 'express';
import { firebaseVerifyController, firebaseLinkController, bypassOtpController } from '../controllers/firebase-auth.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { authRateLimiter, otpRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Public — verify Firebase ID token and login/signup
router.post('/verify', authRateLimiter, firebaseVerifyController);

// Public — dev/test bypass OTP (only works when FIREBASE_OTP_BYPASS=true)
router.post('/bypass-otp', otpRateLimiter, bypassOtpController);

// Protected — link Firebase UID to existing authenticated account
router.post('/link', authMiddleware, firebaseLinkController);

export default router;
