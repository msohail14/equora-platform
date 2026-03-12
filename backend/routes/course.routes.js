import express from 'express';
import coachAuthMiddleware from '../middleware/coach-auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { uploadCourseThumbnail } from '../middleware/upload.middleware.js';
import {
  createCourseByAdminController,
  createCourseController,
  getAllCoursesController,
  getMyCoursesController,
  getCourseByIdController,
  updateCourseController,
  updateCourseByAdminController,
  deleteCourseController,
} from '../controllers/course.controller.js';

const router = express.Router();

// Public route - anyone can view courses (filtered by is_active)
router.get('/', getAllCoursesController);

// Coach-only routes
router.get('/my/list', coachAuthMiddleware, getMyCoursesController);
router.post('/', coachAuthMiddleware, uploadCourseThumbnail, createCourseController);
router.post('/admin', adminAuthMiddleware, uploadCourseThumbnail, createCourseByAdminController);
router.put('/:id', coachAuthMiddleware, uploadCourseThumbnail, updateCourseController);
router.delete('/:id', coachAuthMiddleware, deleteCourseController);
router.put('/admin/:id', adminAuthMiddleware, uploadCourseThumbnail, updateCourseByAdminController);
router.get('/:id', getCourseByIdController);

export default router;
