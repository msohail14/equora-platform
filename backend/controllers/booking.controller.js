import {
  getBookingStables,
  getStableArenas,
  getStableCoaches,
  getCoachSlots,
  getStableHorses,
  getAvailableSlots,
  getArenaSlots,
  createBooking,
  approveHorseForBooking,
  confirmHorseAvailability,
  payForBooking,
  approveBooking,
  declineBooking,
  startBooking,
  completeBooking,
  sendPaymentReminder,
  getMyBookings,
  cancelBooking,
  adminConfirmBooking,
  coachConfirmBooking,
  getReturningRiderDefaults,
  coachModifyBooking,
  riderModifyBooking,
  createSeriesBooking,
  getHorseWorkloadReport,
  markBookingPayAtStable,
  delayBookings,
  sendUpcomingReminders,
} from '../services/booking.service.js';

const handleError = (res, error) => {
  const msg = (error.message || '').toLowerCase();
  const isClientError =
    msg.includes('required') ||
    msg.includes('not found') ||
    msg.includes('access denied') ||
    msg.includes('must be') ||
    msg.includes('already booked') ||
    msg.includes('already has') ||
    msg.includes('not available') ||
    msg.includes('cannot') ||
    msg.includes('not in a') ||
    msg.includes('only the') ||
    msg.includes('conflict') ||
    msg.includes('invalid') ||
    msg.includes('before');

  return res.status(isClientError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const getBookingStablesController = async (req, res) => {
  try {
    const data = await getBookingStables({
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      coachId: req.query.coach_id,
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
      date: req.query.date,
      startTime: req.query.start_time,
      riderId: req.user?.id,
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
      stableId: req.query.stable_id || null,
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
    const b = req.body;
    const startTime = b.startTime || b.start_time || b.time || '';
    const durationMin = Number(b.durationMinutes || b.duration_minutes || 60);
    let endTime = b.endTime || b.end_time || '';
    if (!endTime && startTime) {
      const [h, m] = startTime.split(':').map(Number);
      const totalMin = (h * 60 + (m || 0)) + durationMin;
      const eH = Math.floor(totalMin / 60) % 24;
      const eM = totalMin % 60;
      endTime = `${String(eH).padStart(2, '0')}:${String(eM).padStart(2, '0')}:00`;
    }
    const data = await createBooking({
      riderId: req.user.id,
      coachId: b.coachId || b.coach_id || null,
      stableId: b.stableId || b.stable_id,
      arenaId: b.arenaId || b.arena_id || null,
      horseId: b.horseId || b.horse_id || null,
      bookingDate: b.bookingDate || b.booking_date || b.date,
      startTime,
      endTime,
      lessonType: b.lessonType || b.lesson_type || 'private',
      price: b.price || null,
      notes: b.notes || null,
      bookingType: b.bookingType || b.booking_type || 'lesson',
      durationMinutes: durationMin,
      horseAssignment: b.horseAssignment || b.horse_assignment || 'stable_assigns',
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

export const getArenaSlotsController = async (req, res) => {
  try {
    const data = await getArenaSlots({
      arenaId: req.params.arenaId,
      date: req.query.date,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAvailableSlotsController = async (req, res) => {
  try {
    const data = await getAvailableSlots({
      stableId: req.params.id,
      date: req.query.date,
      duration: req.query.duration,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const approveBookingController = async (req, res) => {
  try {
    const isAdmin = req.user.type === 'admin';
    const data = await approveBooking({
      bookingId: req.params.id,
      userId: req.user.id,
      isAdmin,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const adminConfirmBookingController = async (req, res) => {
  try {
    const data = await adminConfirmBooking({
      bookingId: req.params.id,
      adminId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const coachConfirmBookingController = async (req, res) => {
  try {
    const data = await coachConfirmBooking({
      bookingId: req.params.id,
      coachId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const declineBookingController = async (req, res) => {
  try {
    const isAdmin = req.user.type === 'admin';
    const data = await declineBooking({
      bookingId: req.params.id,
      userId: req.user.id,
      isAdmin,
      reason: req.body.reason,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const startBookingController = async (req, res) => {
  try {
    const data = await startBooking({
      bookingId: req.params.id,
      userId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const completeBookingController = async (req, res) => {
  try {
    const data = await completeBooking({
      bookingId: req.params.id,
      userId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const sendPaymentReminderController = async (req, res) => {
  try {
    const data = await sendPaymentReminder({
      bookingId: req.params.id,
      coachId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getReturningRiderDefaultsController = async (req, res) => {
  try {
    const data = await getReturningRiderDefaults(req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const coachModifyBookingController = async (req, res) => {
  try {
    const b = req.body;
    const data = await coachModifyBooking(req.params.id, req.user.id, {
      horseId: b.horse_id ?? b.horseId,
      stableId: b.stable_id ?? b.stableId,
      startTime: b.start_time ?? b.startTime,
      endTime: b.end_time ?? b.endTime,
      notes: b.notes,
      courseId: b.course_id ?? b.courseId,
      durationMinutes: b.duration_minutes ?? b.durationMinutes,
      bookingDate: b.booking_date ?? b.bookingDate,
    });
    return res.status(200).json({ booking: data });
  } catch (error) {
    return handleError(res, error);
  }
};

export const riderModifyBookingController = async (req, res) => {
  try {
    const data = await riderModifyBooking({
      bookingId: req.params.id,
      riderId: req.user.id,
      bookingDate: req.body.booking_date,
      startTime: req.body.start_time,
      endTime: req.body.end_time,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createSeriesBookingController = async (req, res) => {
  try {
    const data = await createSeriesBooking({ riderId: req.user.id, ...req.body });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const payAtStableController = async (req, res) => {
  try {
    const riderId = req.user?.id;
    if (!riderId) return res.status(401).json({ error: 'Not authenticated' });
    const data = await markBookingPayAtStable(Number(req.params.id), riderId);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getHorseWorkloadController = async (req, res) => {
  try {
    const startDate = req.query.start_date || new Date().toISOString().slice(0, 10);
    const endDate = req.query.end_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const data = await getHorseWorkloadReport(req.params.id, startDate, endDate, {
      adminId: req.user?.id,
      adminRole: req.user?.role,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const delayBookingsController = async (req, res) => {
  try {
    const coachId = req.user?.id;
    if (!coachId) return res.status(401).json({ error: 'Not authenticated' });
    const { delay_minutes, delay_all, reason } = req.body;
    const data = await delayBookings({
      bookingId: Number(req.params.id),
      coachId,
      delayMinutes: Number(delay_minutes),
      delayAll: delay_all !== false,
      reason,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const sendRemindersController = async (_req, res) => {
  try {
    const data = await sendUpcomingReminders();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
