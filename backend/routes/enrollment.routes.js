import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  createEnrollmentController,
  createEnrollmentsByAdminController,
  getAllEnrollmentsController,
  getCourseEnrollmentsController,
  getMyEnrollmentsController,
  updateEnrollmentStatusController,
  withdrawEnrollmentController,
} from '../controllers/enrollment.controller.js';

const router = express.Router();

router.post('/', authMiddleware, createEnrollmentController);
router.post('/admin/bulk', authMiddleware, createEnrollmentsByAdminController);
router.get('/all', authMiddleware, getAllEnrollmentsController);
router.get('/my', authMiddleware, getMyEnrollmentsController);
router.get('/course/:courseId', authMiddleware, getCourseEnrollmentsController);
router.delete('/:id', authMiddleware, withdrawEnrollmentController);
router.put('/:id/status', authMiddleware, updateEnrollmentStatusController);

export default router;
