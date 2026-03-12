import express from 'express';
import coachAuthMiddleware from '../middleware/coach-auth.middleware.js';
import {
  createAvailabilityExceptionController,
  createWeeklyAvailabilityController,
  deleteAvailabilityExceptionController,
  deleteWeeklyAvailabilityController,
  getAvailabilityExceptionsController,
  getWeeklyAvailabilityController,
  updateAvailabilityExceptionController,
  updateWeeklyAvailabilityController,
} from '../controllers/coach-availability.controller.js';

const router = express.Router();

router.post('/weekly', coachAuthMiddleware, createWeeklyAvailabilityController);
router.get('/weekly', coachAuthMiddleware, getWeeklyAvailabilityController);
router.put('/weekly/:id', coachAuthMiddleware, updateWeeklyAvailabilityController);
router.delete('/weekly/:id', coachAuthMiddleware, deleteWeeklyAvailabilityController);

router.post('/exceptions', coachAuthMiddleware, createAvailabilityExceptionController);
router.get('/exceptions', coachAuthMiddleware, getAvailabilityExceptionsController);
router.put('/exceptions/:id', coachAuthMiddleware, updateAvailabilityExceptionController);
router.delete('/exceptions/:id', coachAuthMiddleware, deleteAvailabilityExceptionController);

export default router;
