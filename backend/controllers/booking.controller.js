import {
  getBookingStables,
  getStableArenas,
  getStableCoaches,
  getCoachSlots,
  getStableHorses,
  createBooking,
  approveHorseForBooking,
  confirmHorseAvailability,
  payForBooking,
  getMyBookings,
  cancelBooking,
} from '../services/booking.service.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('not found') ||
    error.message.includes('access denied') ||
    error.message.includes('must be');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const getBookingStablesController = async (req, res) => {
  try {
    const data = await getBookingStables({
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStableArenasController = async (req, res) => {
  try {
    const data = await getStableArenas({
      stableId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStableCoachesController = async (req, res) => {
  try {
    const data = await getStableCoaches({
      stableId: req.params.id,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachSlotsController = async (req, res) => {
  try {
    const data = await getCoachSlots({
      coachId: req.params.id,
      date: req.query.date,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStableHorsesController = async (req, res) => {
  try {
    const data = await getStableHorses({
      stableId: req.params.id,
      discipline: req.query.discipline,
      level: req.query.level,
      date: req.query.date,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createBookingController = async (req, res) => {
  try {
    const data = await createBooking({
      riderId: req.user.id,
      ...req.body,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const approveHorseController = async (req, res) => {
  try {
    const data = await approveHorseForBooking({
      bookingId: req.params.id,
      userId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const confirmHorseController = async (req, res) => {
  try {
    const data = await confirmHorseAvailability({
      bookingId: req.params.id,
      adminId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const payForBookingController = async (req, res) => {
  try {
    const data = await payForBooking({
      bookingId: req.params.id,
      riderId: req.user.id,
      paymentId: req.body.payment_id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMyBookingsController = async (req, res) => {
  try {
    const data = await getMyBookings({
      userId: req.user.id,
      role: req.user.role,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelBookingController = async (req, res) => {
  try {
    const data = await cancelBooking({
      bookingId: req.params.id,
      userId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
