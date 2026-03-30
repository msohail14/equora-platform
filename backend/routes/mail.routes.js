import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { otpRateLimiter, authRateLimiter } from '../middleware/rate-limit.middleware.js';
import {
  sendCustomMailController,
  sendOtpMailController,
  sendResetLinkMailController,
  sendResetTokenMailController,
} from '../controllers/mail.controller.js';

const router = express.Router();

router.post('/send', adminAuthMiddleware, sendCustomMailController);
router.post('/send-otp', otpRateLimiter, sendOtpMailController);
router.post('/send-reset-token', authRateLimiter, sendResetTokenMailController);
router.post('/send-reset-link', authRateLimiter, sendResetLinkMailController);

export default router;
