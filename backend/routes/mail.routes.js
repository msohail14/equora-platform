import express from 'express';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import {
  sendCustomMailController,
  sendOtpMailController,
  sendResetLinkMailController,
  sendResetTokenMailController,
} from '../controllers/mail.controller.js';

const router = express.Router();

// Note: per-route rate limiters removed — they conflict with Railway's proxy
router.post('/send', adminAuthMiddleware, sendCustomMailController);
router.post('/send-otp', sendOtpMailController);
router.post('/send-reset-token', sendResetTokenMailController);
router.post('/send-reset-link', sendResetLinkMailController);

export default router;
