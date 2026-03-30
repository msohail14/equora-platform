import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
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

// Rider self-enrollment and viewing own enrollments
router.post('/', authMiddleware, createEnrollmentController);
router.get('/my', authMiddleware, getMyEnrollmentsController);
router.get('/course/:courseId', authMiddleware, getCourseEnrollmentsController);
router.delete('/:id', authMiddleware, withdrawEnrollmentController);

// Admin-only operations
router.post('/admin/bulk', adminAuthMiddleware, createEnrollmentsByAdminController);
router.get('/all', adminAuthMiddleware, getAllEnrollmentsController);
router.put('/:id/status', adminAuthMiddleware, updateEnrollmentStatusController);

export default router;
