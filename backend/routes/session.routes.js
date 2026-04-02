import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  validate,
  createSessionValidation,
  updateSessionValidation,
  cancelSessionValidation,
  courseSessionsParamValidation,
} from '../middleware/validation.middleware.js';
import {
  cancelSessionController,
  createSessionController,
  getCourseSessionsController,
  getMySessionsController,
  updateSessionController,
} from '../controllers/session.controller.js';

const router = express.Router();

router.post('/', authMiddleware, createSessionValidation, validate, createSessionController);
router.get('/my', authMiddleware, getMySessionsController);
router.get('/course/:courseId', authMiddleware, courseSessionsParamValidation, validate, getCourseSessionsController);
router.put('/:id', authMiddleware, updateSessionValidation, validate, updateSessionController);
router.patch('/:id/cancel', authMiddleware, cancelSessionValidation, validate, cancelSessionController);

export default router;
