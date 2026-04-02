import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import coachAuthMiddleware from '../middleware/coach-auth.middleware.js';
import {
  getMyStablesController,
  linkMyStableController,
  unlinkMyStableController,
  updateVisibilityController,
  getPendingRequestsController,
  approveRequestController,
  rejectRequestController,
} from '../controllers/coachStable.controller.js';
import {
  adminCreateScheduleController,
  adminGetSchedulesController,
  adminUpdateScheduleController,
  adminDeleteScheduleController,
  coachCreateScheduleController,
  coachGetSchedulesController,
} from '../controllers/coach-stable-schedule.controller.js';
import {
  addFavouriteRiderController,
  createCoachWeeklyAvailabilityByAdminController,
  createCoachController,
  deleteCoachController,
  getFavouriteRidersController,
  getCoachDeletionPreviewController,
  deleteCoachWeeklyAvailabilityByAdminController,
  getCoachCoursesController,
  getCoachDetailsController,
  getCoachSessionsController,
  getCoachSummaryController,
  getCoachUpcomingAvailabilityController,
  getCoachWeeklyAvailabilityByAdminController,
  getAllCoachesController,
  getCoachByIdController,
  removeFavouriteRiderController,
  updateCoachWeeklyAvailabilityByAdminController,
  updateCoachController,
  resetCoachPasswordController,
} from '../controllers/coach.controller.js';

const router = express.Router();

router.get('/me/stables', coachAuthMiddleware, getMyStablesController);
router.post('/me/stables', coachAuthMiddleware, linkMyStableController);
router.delete('/me/stables/:stableId', coachAuthMiddleware, unlinkMyStableController);

// Coach self-management: visibility
router.patch('/me/stables/:stableId/visibility', coachAuthMiddleware, updateVisibilityController);

// Routes accessible by admin AND stable owner
router.get('/stables/:stableId/coach-requests', authMiddleware, getPendingRequestsController);
router.patch('/stables/:stableId/coach-requests/:coachId/approve', authMiddleware, approveRequestController);
router.patch('/stables/:stableId/coach-requests/:coachId/reject', authMiddleware, rejectRequestController);

// Coach self-management: favourite riders
router.get('/me/favourite-riders', coachAuthMiddleware, getFavouriteRidersController);
router.post('/me/favourite-riders/:riderId', coachAuthMiddleware, addFavouriteRiderController);
router.delete('/me/favourite-riders/:riderId', coachAuthMiddleware, removeFavouriteRiderController);

// Coach self-management: per-stable schedules
router.post('/me/stables/:stableId/schedules', coachAuthMiddleware, coachCreateScheduleController);
router.get('/me/stables/:stableId/schedules', coachAuthMiddleware, coachGetSchedulesController);

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
router.post('/:id/reset-password', adminAuthMiddleware, resetCoachPasswordController);
router.get('/:id/deletion-preview', adminAuthMiddleware, getCoachDeletionPreviewController);
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

// Admin: per-stable schedule management
router.post('/:coachId/stables/:stableId/schedules', adminAuthMiddleware, adminCreateScheduleController);
router.get('/:coachId/stables/:stableId/schedules', adminAuthMiddleware, adminGetSchedulesController);
router.put('/:coachId/stables/:stableId/schedules/:scheduleId', adminAuthMiddleware, adminUpdateScheduleController);
router.delete('/:coachId/stables/:stableId/schedules/:scheduleId', adminAuthMiddleware, adminDeleteScheduleController);

export default router;
