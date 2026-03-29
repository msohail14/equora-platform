import { Router } from 'express';
import { createInvitationController, acceptInvitationController, getStableInvitationsController, cancelInvitationController } from '../controllers/invitation.controller.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';

const router = Router();

// Admin — create invitation to join stable
router.post('/', adminAuthMiddleware, createInvitationController);

// Admin — list invitations for a stable
router.get('/stable/:stableId', adminAuthMiddleware, getStableInvitationsController);

// Public — accept invitation (coach clicks link)
router.post('/accept/:token', acceptInvitationController);

// Admin — cancel a pending invitation
router.delete('/:id', adminAuthMiddleware, cancelInvitationController);

export default router;
