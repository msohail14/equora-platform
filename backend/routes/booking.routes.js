import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import coachAuthMiddleware from '../middleware/coach-auth.middleware.js';
import {
  getBookingStablesController,
  getStableArenasController,
  getStableCoachesController,
  getCoachSlotsController,
  getStableHorsesController,
  getAvailableSlotsController,
  getArenaSlotsController,
  createBookingController,
  approveHorseController,
  confirmHorseController,
  payForBookingController,
  approveBookingController,
  adminConfirmBookingController,
  coachConfirmBookingController,
  declineBookingController,
  startBookingController,
  completeBookingController,
  sendPaymentReminderController,
  getMyBookingsController,
  cancelBookingController,
  getReturningRiderDefaultsController,
  coachModifyBookingController,
  createSeriesBookingController,
  getHorseWorkloadController,
} from '../controllers/booking.controller.js';

const router = express.Router();

router.get('/stables', getBookingStablesController);
router.get('/stables/:id/arenas', getStableArenasController);
router.get('/stables/:id/coaches', getStableCoachesController);
router.get('/stables/:id/horses', getStableHorsesController);
router.get('/stables/:id/available-slots', getAvailableSlotsController);
router.get('/arenas/:arenaId/slots', getArenaSlotsController);

router.get('/coaches/:id/slots', authMiddleware, getCoachSlotsController);
router.post('/', authMiddleware, createBookingController);
router.patch('/:id/approve-horse', authMiddleware, approveHorseController);
router.patch('/:id/confirm-horse', adminAuthMiddleware, confirmHorseController);
router.post('/:id/pay', authMiddleware, payForBookingController);

router.patch('/:id/approve', authMiddleware, approveBookingController);
router.patch('/:id/confirm', adminAuthMiddleware, adminConfirmBookingController);
router.patch('/:id/coach-confirm', coachAuthMiddleware, coachConfirmBookingController);
router.patch('/:id/decline', authMiddleware, declineBookingController);
router.patch('/:id/start', authMiddleware, startBookingController);
router.patch('/:id/complete', authMiddleware, completeBookingController);
router.post('/:id/payment-reminder', coachAuthMiddleware, sendPaymentReminderController);

router.get('/returning-rider-defaults', authMiddleware, getReturningRiderDefaultsController);
router.post('/series', authMiddleware, createSeriesBookingController);
router.get('/my', authMiddleware, getMyBookingsController);
router.patch('/:id/modify', coachAuthMiddleware, coachModifyBookingController);
router.patch('/:id/cancel', authMiddleware, cancelBookingController);
router.get('/horses/:id/workload', authMiddleware, getHorseWorkloadController);

export default router;
