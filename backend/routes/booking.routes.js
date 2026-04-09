import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import coachAuthMiddleware from '../middleware/coach-auth.middleware.js';
import {
  validate,
  createBookingValidation,
  createSeriesBookingValidation,
  bookingIdParamValidation,
  riderModifyBookingValidation,
  stableIdParamValidation,
  stableCoachesQueryValidation,
} from '../middleware/validation.middleware.js';
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
  riderModifyBookingController,
  createSeriesBookingController,
  getHorseWorkloadController,
  payAtStableController,
} from '../controllers/booking.controller.js';

const router = express.Router();

router.get('/stables', getBookingStablesController);
router.get('/stables/:id/arenas', stableIdParamValidation, validate, getStableArenasController);
router.get('/stables/:id/coaches', stableCoachesQueryValidation, validate, getStableCoachesController);
router.get('/stables/:id/horses', stableIdParamValidation, validate, getStableHorsesController);
router.get('/stables/:id/available-slots', stableIdParamValidation, validate, getAvailableSlotsController);
router.get('/arenas/:arenaId/slots', getArenaSlotsController);

router.get('/coaches/:id/slots', authMiddleware, getCoachSlotsController);
router.post('/', authMiddleware, createBookingValidation, validate, createBookingController);
router.patch('/:id/approve-horse', authMiddleware, bookingIdParamValidation, validate, approveHorseController);
router.patch('/:id/confirm-horse', adminAuthMiddleware, bookingIdParamValidation, validate, confirmHorseController);
router.post('/:id/pay', authMiddleware, bookingIdParamValidation, validate, payForBookingController);

router.patch('/:id/approve', authMiddleware, bookingIdParamValidation, validate, approveBookingController);
router.patch('/:id/confirm', adminAuthMiddleware, bookingIdParamValidation, validate, adminConfirmBookingController);
router.patch('/:id/coach-confirm', coachAuthMiddleware, bookingIdParamValidation, validate, coachConfirmBookingController);
router.patch('/:id/decline', authMiddleware, bookingIdParamValidation, validate, declineBookingController);
router.patch('/:id/start', authMiddleware, bookingIdParamValidation, validate, startBookingController);
router.patch('/:id/complete', authMiddleware, bookingIdParamValidation, validate, completeBookingController);
router.post('/:id/payment-reminder', coachAuthMiddleware, bookingIdParamValidation, validate, sendPaymentReminderController);

router.get('/returning-rider-defaults', authMiddleware, getReturningRiderDefaultsController);
router.post('/series', authMiddleware, createSeriesBookingValidation, validate, createSeriesBookingController);
router.get('/my', authMiddleware, getMyBookingsController);
router.patch('/:id/modify', coachAuthMiddleware, bookingIdParamValidation, validate, coachModifyBookingController);
router.patch('/:id/rider-modify', authMiddleware, bookingIdParamValidation, riderModifyBookingValidation, validate, riderModifyBookingController);
router.post('/:id/pay-at-stable', authMiddleware, bookingIdParamValidation, validate, payAtStableController);
router.patch('/:id/cancel', authMiddleware, bookingIdParamValidation, validate, cancelBookingController);
router.get('/horses/:id/workload', authMiddleware, getHorseWorkloadController);

export default router;
