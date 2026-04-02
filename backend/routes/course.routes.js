import express from 'express';
import coachAuthMiddleware from '../middleware/coach-auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import { uploadCourseThumbnail } from '../middleware/upload.middleware.js';
import {
  validate,
  createCourseValidation,
  updateCourseValidation,
  courseIdParamValidation,
} from '../middleware/validation.middleware.js';
import {
  createCourseByAdminController,
  createCourseController,
  getAllCoursesController,
  getMyCoursesController,
  getCourseByIdController,
  updateCourseController,
  updateCourseByAdminController,
  deleteCourseController,
  deleteCourseByAdminController,
} from '../controllers/course.controller.js';

const router = express.Router();

// Public route - anyone can view courses (filtered by is_active)
router.get('/', getAllCoursesController);

// Coach-only routes
router.get('/my/list', coachAuthMiddleware, getMyCoursesController);
router.post('/', coachAuthMiddleware, uploadCourseThumbnail, createCourseValidation, validate, createCourseController);
router.post('/admin', adminAuthMiddleware, uploadCourseThumbnail, createCourseValidation, validate, createCourseByAdminController);
router.put('/:id', coachAuthMiddleware, uploadCourseThumbnail, updateCourseValidation, validate, updateCourseController);
router.delete('/:id', coachAuthMiddleware, courseIdParamValidation, validate, deleteCourseController);
router.put('/admin/:id', adminAuthMiddleware, uploadCourseThumbnail, updateCourseValidation, validate, updateCourseByAdminController);
router.delete('/admin/:id', adminAuthMiddleware, courseIdParamValidation, validate, deleteCourseByAdminController);
router.get('/:id', courseIdParamValidation, validate, getCourseByIdController);

export default router;
