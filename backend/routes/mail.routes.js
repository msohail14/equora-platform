import express from 'express';
import {
  sendCustomMailController,
  sendOtpMailController,
  sendResetLinkMailController,
  sendResetTokenMailController,
} from '../controllers/mail.controller.js';

const router = express.Router();

router.post('/send', sendCustomMailController);
router.post('/send-otp', sendOtpMailController);
router.post('/send-reset-token', sendResetTokenMailController);
router.post('/send-reset-link', sendResetLinkMailController);

export default router;
