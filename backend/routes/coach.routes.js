import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import coachAuthMiddleware from '../middleware/coach-auth.middleware.js';
import {
  getMyStablesController,
  linkMyStableController,
  unlinkMyStableController,
} from '../controllers/coachStable.controller.js';
import {
  createCoachWeeklyAvailabilityByAdminController,
  createCoachController,
  deleteCoachController,
  deleteCoachWeeklyAvailabilityByAdminController,
  getCoachCoursesController,
  getCoachDetailsController,
  getCoachSessionsController,
  getCoachSummaryController,
  getCoachUpcomingAvailabilityController,
  getCoachWeeklyAvailabilityByAdminController,
  getAllCoachesController,
  getCoachByIdController,
  updateCoachWeeklyAvailabilityByAdminController,
  updateCoachController,
} from '../controllers/coach.controller.js';

const router = express.Router();

router.get('/me/stables', coachAuthMiddleware, getMyStablesController);
router.post('/me/stables', coachAuthMiddleware, linkMyStableController);
router.delete('/me/stables/:stableId', coachAuthMiddleware, unlinkMyStableController);

router.get('/public', getAllCoachesController);
router.get('/public/:id', getCoachByIdController);
router.get('/public/:id/summary', getCoachSummaryController);
router.get('/public/:id/courses', getCoachCoursesController);

router.get('/:id/upcoming-availability', authMiddleware, getCoachUpcomingAvailabilityController);
router.post('/', adminAuthMiddleware, createCoachController);
router.get('/', adminAuthMiddleware, getAllCoachesController);
router.get('/:id/details', adminAuthMiddleware, getCoachDetailsController);
router.get('/:id/summary', adminAuthMiddleware, getCoachSummaryController);
router.get('/:id/courses', adminAuthMiddleware, getCoachCoursesController);
router.get('/:id/sessions', adminAuthMiddleware, getCoachSessionsController);
router.get('/:id/weekly-availability', adminAuthMiddleware, getCoachWeeklyAvailabilityByAdminController);
router.get('/:id', adminAuthMiddleware, getCoachByIdController);
router.put('/:id', adminAuthMiddleware, updateCoachController);
router.delete('/:id', adminAuthMiddleware, deleteCoachController);
router.post('/:id/weekly-availability', adminAuthMiddleware, createCoachWeeklyAvailabilityByAdminController);
router.put(
  '/:id/weekly-availability/:availabilityId',
  adminAuthMiddleware,
  updateCoachWeeklyAvailabilityByAdminController
);
router.delete(
  '/:id/weekly-availability/:availabilityId',
  adminAuthMiddleware,
  deleteCoachWeeklyAvailabilityByAdminController
);

export default router;
