import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  cancelSessionController,
  createSessionController,
  getCourseSessionsController,
  getMySessionsController,
  updateSessionController,
} from '../controllers/session.controller.js';

const router = express.Router();

router.post('/', authMiddleware, createSessionController);
router.get('/my', authMiddleware, getMySessionsController);
router.get('/course/:courseId', authMiddleware, getCourseSessionsController);
router.put('/:id', authMiddleware, updateSessionController);
router.patch('/:id/cancel', authMiddleware, cancelSessionController);

export default router;
