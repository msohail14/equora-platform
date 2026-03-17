import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import adminAuthMiddleware from '../middleware/admin-auth.middleware.js';
import {
  getBookingStablesController,
  getStableArenasController,
  getStableCoachesController,
  getCoachSlotsController,
  getStableHorsesController,
  createBookingController,
  approveHorseController,
  confirmHorseController,
  payForBookingController,
  getMyBookingsController,
  cancelBookingController,
} from '../controllers/booking.controller.js';

const router = express.Router();

router.get('/stables', getBookingStablesController);
router.get('/stables/:id/arenas', getStableArenasController);
router.get('/stables/:id/coaches', getStableCoachesController);
router.get('/stables/:id/horses', getStableHorsesController);

router.get('/coaches/:id/slots', authMiddleware, getCoachSlotsController);
router.post('/', authMiddleware, createBookingController);
router.patch('/:id/approve-horse', authMiddleware, approveHorseController);
router.patch('/:id/confirm-horse', adminAuthMiddleware, confirmHorseController);
router.post('/:id/pay', authMiddleware, payForBookingController);
router.get('/my', authMiddleware, getMyBookingsController);
router.patch('/:id/cancel', authMiddleware, cancelBookingController);

export default router;
