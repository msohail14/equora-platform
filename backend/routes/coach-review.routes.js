import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import {
  createCoachReviewController,
  deleteCoachReviewController,
  getCoachReviewsController,
  updateCoachReviewController,
} from '../controllers/coach-review.controller.js';

const router = express.Router();

router.get('/public/coach/:coachId', getCoachReviewsController);

router.post('/', authMiddleware, createCoachReviewController);
router.get('/coach/:coachId', adminAuthMiddleware, getCoachReviewsController);
router.put('/:id', authMiddleware, updateCoachReviewController);
router.delete('/:id', authMiddleware, deleteCoachReviewController);

export default router;
