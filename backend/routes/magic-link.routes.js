import { Router } from 'express';
import { sendMagicLinkController, verifyMagicLinkController } from '../controllers/magic-link.controller.js';
import { mailRateLimiter, authRateLimiter } from '../middleware/rate-limit.middleware.js';

const router = Router();

// Public — send magic link email (rate limited to prevent spam)
router.post('/send', mailRateLimiter, sendMagicLinkController);

// Public — verify magic link token
router.get('/verify/:token', authRateLimiter, verifyMagicLinkController);

export default router;
