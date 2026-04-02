import { Router } from 'express';
import {
  createInvitationController, acceptInvitationController,
  getStableInvitationsController, cancelInvitationController,
  createRiderInvitationController, getCoachRiderInvitationsController,
  verifyInviteCodeController, acceptRiderInvitationController,
} from '../controllers/invitation.controller.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { inviteCodeRateLimiter } from '../middleware/rate-limit.middleware.js';
import {
  validate,
  createInvitationValidation,
  createRiderInvitationValidation,
  verifyInviteCodeValidation,
  acceptRiderInvitationValidation,
  acceptInvitationParamValidation,
  cancelInvitationValidation,
  stableInvitationsParamValidation,
} from '../middleware/validation.middleware.js';

const router = Router();

// Admin — create invitation to join stable
router.post('/', adminAuthMiddleware, createInvitationValidation, validate, createInvitationController);

// Admin — list invitations for a stable
router.get('/stable/:stableId', adminAuthMiddleware, stableInvitationsParamValidation, validate, getStableInvitationsController);

// Public — accept invitation (coach clicks link)
router.post('/accept/:token', acceptInvitationParamValidation, validate, acceptInvitationController);

// Admin — cancel a pending invitation
router.delete('/:id', adminAuthMiddleware, cancelInvitationValidation, validate, cancelInvitationController);

// ── Coach → Rider invite routes ──
// Coach — create rider invite (generates code, optionally sends email)
router.post('/rider', authMiddleware, createRiderInvitationValidation, validate, createRiderInvitationController);

// Coach — list their rider invitations
router.get('/rider/mine', authMiddleware, getCoachRiderInvitationsController);

// Public — verify an invite code (used during signup)
router.get('/verify/:code', inviteCodeRateLimiter, verifyInviteCodeValidation, validate, verifyInviteCodeController);

// Rider — accept invite code (after signup/login)
router.post('/rider/accept', authMiddleware, acceptRiderInvitationValidation, validate, acceptRiderInvitationController);

export default router;
