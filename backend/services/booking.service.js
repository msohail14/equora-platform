import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Arena, CoachReview, CoachStable, Course, CourseSession, Discipline, Horse,
  HorseAvailability, LessonBooking, Notification, Payment, Stable, User,
} from '../models/index.js';
import CoachWeeklyAvailability from '../models/coachWeeklyAvailability.model.js';
import CoachAvailabilityException from '../models/coachAvailabilityException.model.js';

const normalizePagination = ({ page, limit }) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;
  return { page: safePage, limit: safeLimit };
};

const buildPaginationMeta = ({ currentPage, limit, totalRecords }) => {
  const totalPages = Math.max(1, Math.ceil(totalRecords / limit));
  return {
    totalRecords,
    currentPage,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    limit,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

export const getBookingStables = async ({ search, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const where = { is_active: true, is_approved: true };
  const keyword = String(search || '').trim();
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { city: { [Op.like]: `%${keyword}%` } },
      { country: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { rows, count } = await Stable.findAndCountAll({
    where,
    include: [
      { model: Arena, as: 'arenas', attributes: ['id'] },
      { model: Horse, as: 'horses', attributes: ['id'] },
    ],
    order: [['name', 'ASC']],
    offset,
    limit: pagination.limit,
    distinct: true,
    subQuery: false,
  });

  const data = rows.map((stable) => {
    const plain = stable.get({ plain: true });
    return {
      ...plain,
      arena_count: plain.arenas ? plain.arenas.length : 0,
      horse_count: plain.horses ? plain.horses.length : 0,
      average_rating: plain.rating || null,
      arenas: undefined,
      horses: undefined,
    };
  });

  return {
    data,
    pagination: buildPaginationMeta({
      currentPage: pagination.page,
      limit: pagination.limit,
      totalRecords: count,
    }),
  };
};

export const getStableArenas = async ({ stableId }) => {
  if (!stableId) {
    throw new Error('stableId is required.');
  }

  const stable = await Stable.findByPk(stableId);
  if (!stable || !stable.is_active || !stable.is_approved) {
    throw new Error('Stable not found.');
  }

  const arenas = await Arena.findAll({
    where: { stable_id: stableId },
    attributes: ['id', 'name', 'description', 'capacity', 'discipline_id', 'image_url'],
    order: [['name', 'ASC']],
  });

  return {
    data: arenas.map((a) => a.get({ plain: true })),
  };
};

export const getStableCoaches = async ({ stableId, search, page, limit }) => {
  if (!stableId) {
    throw new Error('stableId is required.');
  }

  const stable = await Stable.findByPk(stableId);
  if (!stable) {
    throw new Error('Stable not found.');
  }

  const coachMap = new Map();

  // Primary source: CoachStable links
  const coachLinks = await CoachStable.findAll({
    where: { stable_id: stableId, is_active: true },
    include: [
      {
        model: User,
        as: 'coach',
        attributes: [
          'id', 'first_name', 'last_name', 'email', 'profile_picture_url',
          'specialties', 'is_verified', 'bio',
        ],
      },
    ],
  });

  for (const link of coachLinks) {
    if (link.coach && !coachMap.has(link.coach.id)) {
      coachMap.set(link.coach.id, link.coach);
    }
  }

  // Backward compatibility: coaches from active courses
  const courses = await Course.findAll({
    where: { stable_id: stableId, is_active: true },
    include: [
      {
        model: User,
        as: 'coach',
        attributes: [
          'id', 'first_name', 'last_name', 'email', 'profile_picture_url',
          'specialties', 'is_verified', 'bio',
        ],
      },
    ],
  });

  for (const course of courses) {
    if (course.coach && !coachMap.has(course.coach.id)) {
      coachMap.set(course.coach.id, course.coach);
    }
  }

  let coaches = [...coachMap.values()];

  const keyword = String(search || '').trim().toLowerCase();
  if (keyword) {
    coaches = coaches.filter((c) => {
      const full = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
      return full.includes(keyword) || (c.email || '').toLowerCase().includes(keyword);
    });
  }

  const coachIds = coaches.map((c) => c.id);
  const reviews = coachIds.length
    ? await CoachReview.findAll({
        attributes: [
          'coach_id',
          [sequelize.fn('AVG', sequelize.col('stars')), 'avg_stars'],
        ],
        where: { coach_id: { [Op.in]: coachIds } },
        group: ['coach_id'],
        raw: true,
      })
    : [];

  const ratingMap = new Map();
  for (const r of reviews) {
    ratingMap.set(r.coach_id, parseFloat(Number(r.avg_stars).toFixed(2)));
  }

  const pagination = normalizePagination({ page, limit });
  const totalRecords = coaches.length;
  const start = (pagination.page - 1) * pagination.limit;
  const paged = coaches.slice(start, start + pagination.limit);

  const data = paged.map((c) => {
    const plain = c.get ? c.get({ plain: true }) : c;
    return {
      ...plain,
      average_stars: ratingMap.get(plain.id) || null,
    };
  });

  return {
    data,
    pagination: buildPaginationMeta({
      currentPage: pagination.page,
      limit: pagination.limit,
      totalRecords,
    }),
  };
};

export const getCoachSlots = async ({ coachId, date }) => {
  if (!coachId || !date) {
    throw new Error('coachId and date are required.');
  }

  const coach = await User.findByPk(coachId);
  if (!coach || coach.role !== 'coach') {
    throw new Error('Coach not found.');
  }

  const dateObj = new Date(date);
  const dayOfWeek = dateObj.getDay();

  const exception = await CoachAvailabilityException.findOne({
    where: {
      coach_id: coachId,
      exception_date: date,
      exception_type: 'unavailable',
    },
  });

  if (exception && !exception.start_time && !exception.end_time) {
    return { data: [] };
  }

  const weeklySlots = await CoachWeeklyAvailability.findAll({
    where: {
      coach_id: coachId,
      day_of_week: dayOfWeek,
      is_active: true,
      [Op.and]: [
        { [Op.or]: [{ valid_from: null }, { valid_from: { [Op.lte]: date } }] },
        { [Op.or]: [{ valid_to: null }, { valid_to: { [Op.gte]: date } }] },
      ],
    },
  });

  if (weeklySlots.length === 0) {
    return { data: [] };
  }

  const existingSessions = await LessonBooking.findAll({
    where: {
      coach_id: coachId,
      booking_date: date,
      status: { [Op.notIn]: ['cancelled'] },
    },
    attributes: ['start_time', 'end_time'],
  });

  const courseSessions = await CourseSession.findAll({
    where: {
      coach_id: coachId,
      session_date: date,
      status: { [Op.ne]: 'cancelled' },
    },
    attributes: ['start_time', 'end_time'],
  });

  const booked = [
    ...existingSessions.map((s) => ({ start: s.start_time, end: s.end_time })),
    ...courseSessions.map((s) => ({ start: s.start_time, end: s.end_time })),
  ];

  const slots = [];

  for (const weekly of weeklySlots) {
    const slotDuration = weekly.slot_duration_minutes || 60;
    const [startH, startM] = weekly.start_time.split(':').map(Number);
    const [endH, endM] = weekly.end_time.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration) {
      const slotStart = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`;
      const slotEndMin = m + slotDuration;
      const slotEnd = `${String(Math.floor(slotEndMin / 60)).padStart(2, '0')}:${String(slotEndMin % 60).padStart(2, '0')}:00`;

      if (exception && exception.start_time && exception.end_time) {
        if (slotStart < exception.end_time && slotEnd > exception.start_time) {
          continue;
        }
      }

      const conflict = booked.some((b) => slotStart < b.end && slotEnd > b.start);
      if (!conflict) {
        slots.push({ start_time: slotStart, end_time: slotEnd, duration_minutes: slotDuration });
      }
    }
  }

  return { data: slots };
};

export const getStableHorses = async ({ stableId, discipline, level, date }) => {
  if (!stableId) {
    throw new Error('stableId is required.');
  }

  const stable = await Stable.findByPk(stableId);
  if (!stable) {
    throw new Error('Stable not found.');
  }

  const where = { stable_id: stableId, status: 'available' };

  if (discipline) {
    where.discipline_id = discipline;
  }

  if (level) {
    where.training_level = level;
  }

  let horses = await Horse.findAll({
    where,
    include: [
      { model: Stable, as: 'stable', attributes: ['id', 'name'] },
      { model: Discipline, as: 'discipline', attributes: ['id', 'name', 'difficulty_level'] },
    ],
    order: [['name', 'ASC']],
  });

  if (date) {
    const availabilities = await HorseAvailability.findAll({
      where: {
        horse_id: { [Op.in]: horses.map((h) => h.id) },
        date,
      },
    });

    const availMap = new Map();
    for (const a of availabilities) {
      availMap.set(a.horse_id, a);
    }

    horses = horses.filter((h) => {
      const avail = availMap.get(h.id);
      if (!avail) return true;
      if (!avail.is_available) return false;
      return avail.sessions_booked < avail.max_sessions_per_day;
    });
  }

  return { data: horses };
};

export const createBooking = async ({
  riderId, coachId, stableId, arenaId, horseId,
  bookingDate, startTime, endTime, lessonType, price, notes,
  bookingType = 'lesson', durationMinutes, horseAssignment,
}) => {
  if (!riderId || !stableId || !bookingDate || !startTime || !endTime) {
    throw new Error('riderId, stableId, bookingDate, startTime, and endTime are required.');
  }

  const isArenaOnly = bookingType === 'arena_only';
  if (isArenaOnly) {
    if (!arenaId) throw new Error('arenaId is required for arena-only booking.');
  }

  const rider = await User.findByPk(riderId);
  if (!rider) throw new Error('Rider not found.');

  if (coachId) {
    const coach = await User.findByPk(coachId);
    if (!coach || coach.role !== 'coach') throw new Error('Coach not found.');
  }

  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');

  if (arenaId) {
    const arena = await Arena.findByPk(arenaId);
    if (!arena) throw new Error('Arena not found.');
  }

  if (horseId) {
    const horse = await Horse.findByPk(horseId);
    if (!horse) throw new Error('Horse not found.');
  }

  // --- Availability conflict detection ---
  // Only check against bookings that are not cancelled or declined
  const activeStatuses = ['pending_review', 'pending_horse_approval', 'pending_payment', 'confirmed', 'in_progress'];

  if (coachId) {
    const coachConflict = await LessonBooking.findOne({
      where: {
        coach_id: coachId,
        booking_date: bookingDate,
        status: { [Op.in]: activeStatuses },
        [Op.or]: [
          { start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } },
        ],
      },
    });
    if (coachConflict) {
      throw new Error('This coach is already booked for the selected time slot.');
    }
  }

  if (arenaId) {
    const arenaConflict = await LessonBooking.findOne({
      where: {
        arena_id: arenaId,
        booking_date: bookingDate,
        status: { [Op.in]: activeStatuses },
        [Op.or]: [
          { start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } },
        ],
      },
    });
    if (arenaConflict) {
      throw new Error('This arena is already booked for the selected time slot.');
    }
  }

  if (horseId) {
    const horseConflict = await LessonBooking.findOne({
      where: {
        horse_id: horseId,
        booking_date: bookingDate,
        status: { [Op.in]: activeStatuses },
        [Op.or]: [
          { start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } },
        ],
      },
    });
    if (horseConflict) {
      throw new Error('This horse is already booked for the selected time slot.');
    }
  }
  // --- End conflict detection ---

  const booking = await LessonBooking.create({
    rider_id: riderId,
    coach_id: coachId || null,
    stable_id: stableId,
    arena_id: arenaId || null,
    horse_id: horseId || null,
    booking_date: bookingDate,
    start_time: startTime,
    end_time: endTime,
    lesson_type: lessonType || 'private',
    status: 'pending_review',
    price: price || null,
    notes: notes || null,
    booking_type: isArenaOnly ? 'arena_only' : 'lesson',
    duration_minutes: durationMinutes || null,
    horse_assignment: horseAssignment || 'stable_assigns',
  });

  if (horseId) {
    const [availability] = await HorseAvailability.findOrCreate({
      where: { horse_id: horseId, date: bookingDate },
      defaults: {
        horse_id: horseId,
        date: bookingDate,
        max_sessions_per_day: 3,
        sessions_booked: 0,
        is_available: true,
      },
    });
    await availability.save();
  }

  if (coachId) {
    await Notification.create({
      user_id: coachId,
      type: 'lesson_booked',
      title: 'New Booking Request',
      body: `${rider.first_name || 'A rider'} has requested a lesson on ${bookingDate}.`,
      data: { booking_id: booking.id },
    });
  }

  // Notify stable admin about new booking
  if (stable.admin_id) {
    try {
      await Notification.create({
        admin_id: stable.admin_id,
        type: 'lesson_booked',
        title: 'New Booking at Your Stable',
        body: `${rider.first_name || 'A rider'} booked a ${isArenaOnly ? 'arena session' : 'lesson'} on ${bookingDate}.`,
        data: { booking_id: booking.id, stable_id: stableId },
      });
    } catch (_) {
      // Non-critical
    }
  }

  return booking;
};

export const approveHorseForBooking = async ({ bookingId, userId }) => {
  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.coach_id !== userId) {
    throw new Error('Only the assigned coach can approve the horse.');
  }

  if (booking.status !== 'pending_horse_approval') {
    throw new Error('Booking is not in pending horse approval status.');
  }

  booking.status = 'pending_payment';
  await booking.save();

  await Notification.create({
    user_id: booking.rider_id,
    type: 'horse_approved',
    title: 'Horse Approved',
    body: 'Your coach has approved the horse for your upcoming lesson. Please proceed with payment.',
    data: { booking_id: booking.id },
  });

  return booking;
};

export const confirmHorseAvailability = async ({ bookingId, adminId }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [{ model: Stable, as: 'stable' }],
  });

  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (!booking.stable || booking.stable.admin_id !== adminId) {
    throw new Error('Only the stable admin can confirm horse availability.');
  }

  return booking;
};

export const payForBooking = async ({ bookingId, riderId, paymentId }) => {
  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.rider_id !== riderId) {
    throw new Error('Only the rider can pay for this booking.');
  }

  if (booking.status !== 'pending_payment') {
    throw new Error('Booking is not in pending payment status.');
  }

  if (paymentId) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) throw new Error('Payment not found.');
    booking.payment_id = paymentId;
  }

  booking.status = 'confirmed';
  await booking.save();

  if (booking.horse_id) {
    const availability = await HorseAvailability.findOne({
      where: { horse_id: booking.horse_id, date: booking.booking_date },
    });
    if (availability) {
      availability.sessions_booked += 1;
      await availability.save();
    }
  }

  await Notification.create({
    user_id: booking.coach_id,
    type: 'payment_confirmed',
    title: 'Payment Confirmed',
    body: `Payment has been confirmed for the lesson on ${booking.booking_date}.`,
    data: { booking_id: booking.id },
  });

  await Notification.create({
    user_id: booking.rider_id,
    type: 'payment_confirmed',
    title: 'Booking Confirmed',
    body: `Your lesson on ${booking.booking_date} is now confirmed.`,
    data: { booking_id: booking.id },
  });

  return booking;
};

export const getMyBookings = async ({ userId, role, status, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const where = {};
  if (role === 'coach') {
    where.coach_id = userId;
  } else {
    where.rider_id = userId;
  }

  if (status) {
    where.status = status;
  }

  const { rows, count } = await LessonBooking.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'rider',
        attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture_url'],
      },
      {
        model: User,
        as: 'coach',
        attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture_url'],
      },
      {
        model: Stable,
        as: 'stable',
        attributes: ['id', 'name', 'city', 'country'],
      },
      {
        model: Horse,
        as: 'horse',
        attributes: ['id', 'name', 'breed', 'profile_picture_url'],
      },
      {
        model: Arena,
        as: 'arena',
        attributes: ['id', 'name'],
      },
    ],
    order: [['booking_date', 'DESC'], ['start_time', 'ASC']],
    offset,
    limit: pagination.limit,
    distinct: true,
    subQuery: false,
  });

  return {
    data: rows,
    pagination: buildPaginationMeta({
      currentPage: pagination.page,
      limit: pagination.limit,
      totalRecords: count,
    }),
  };
};

export const cancelBooking = async ({ bookingId, userId }) => {
  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) {
    throw new Error('Booking not found.');
  }

  if (booking.rider_id !== userId && booking.coach_id !== userId) {
    throw new Error('You do not have permission to cancel this booking.');
  }

  if (booking.status === 'cancelled') {
    throw new Error('Booking is already cancelled.');
  }

  const wasConfirmed = booking.status === 'confirmed';
  const hadHorse = booking.horse_id;

  booking.status = 'cancelled';
  await booking.save();

  if (hadHorse && wasConfirmed) {
    const availability = await HorseAvailability.findOne({
      where: { horse_id: booking.horse_id, date: booking.booking_date },
    });
    if (availability && availability.sessions_booked > 0) {
      availability.sessions_booked -= 1;
      await availability.save();
    }
  }

  const notifyUserId = booking.rider_id === userId ? booking.coach_id : booking.rider_id;
  const cancelledByRole = booking.rider_id === userId ? 'rider' : 'coach';

  await Notification.create({
    user_id: notifyUserId,
    type: 'general',
    title: 'Booking Cancelled',
    body: `The lesson on ${booking.booking_date} has been cancelled by the ${cancelledByRole}.`,
    data: { booking_id: booking.id },
  });

  return booking;
};

export const getAvailableSlots = async ({ stableId, date, duration = 60 }) => {
  if (!stableId || !date) throw new Error('stableId and date are required.');

  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');

  const durationMins = Number(duration) || 60;
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dateObj = new Date(date);
  const dayName = dayNames[dateObj.getDay()];

  let openTime = '06:00';
  let closeTime = '22:00';
  let isClosed = false;

  if (stable.operating_hours && stable.operating_hours[dayName]) {
    const dayHours = stable.operating_hours[dayName];
    if (dayHours.is_closed) isClosed = true;
    if (dayHours.open) openTime = dayHours.open;
    if (dayHours.close) closeTime = dayHours.close;
  }

  if (isClosed) return { data: [] };

  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  const allSlots = [];
  for (let m = openMins; m + durationMins <= closeMins; m += 30) {
    const startStr = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`;
    const endMin = m + durationMins;
    const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00`;
    allSlots.push({ start_time: startStr, end_time: endStr, duration_minutes: durationMins });
  }

  const blockingBookings = await LessonBooking.findAll({
    where: {
      stable_id: stableId,
      booking_date: date,
      status: { [Op.in]: ['pending_review', 'confirmed', 'in_progress', 'pending_horse_approval', 'pending_payment'] },
    },
    attributes: ['start_time', 'end_time'],
  });

  const available = allSlots.filter(slot => {
    return !blockingBookings.some(b => slot.start_time < b.end_time && slot.end_time > b.start_time);
  });

  return { data: available };
};

export const approveBooking = async ({ bookingId, adminId }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!booking) throw new Error('Booking not found.');
  if (booking.status !== 'pending_review') throw new Error('Booking is not pending review.');

  // Transition to pending_payment so rider must pay before confirmation.
  // When payment is not yet available (Coming Soon), admin can manually confirm
  // via the separate confirmBooking endpoint.
  booking.status = 'pending_payment';
  await booking.save();

  await Notification.create({
    user_id: booking.rider_id,
    type: 'booking_approved',
    title: 'Booking Approved — Payment Required',
    body: `Your booking on ${booking.booking_date} has been approved. Please complete payment to confirm.`,
    data: { booking_id: booking.id },
  });

  return booking;
};

// Allow admin to manually confirm a booking (bypasses payment requirement during Coming Soon phase)
export const adminConfirmBooking = async ({ bookingId, adminId }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!booking) throw new Error('Booking not found.');
  if (!['pending_payment', 'pending_review'].includes(booking.status)) {
    throw new Error('Booking is not in a confirmable state.');
  }

  booking.status = 'confirmed';
  await booking.save();

  await Notification.create({
    user_id: booking.rider_id,
    type: 'booking_approved',
    title: 'Booking Confirmed',
    body: `Your booking on ${booking.booking_date} has been confirmed.`,
    data: { booking_id: booking.id },
  });

  return booking;
};

export const declineBooking = async ({ bookingId, adminId, reason }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!booking) throw new Error('Booking not found.');
  if (booking.status !== 'pending_review') throw new Error('Booking is not pending review.');

  booking.status = 'declined';
  booking.decline_reason = reason || null;
  await booking.save();

  await Notification.create({
    user_id: booking.rider_id,
    type: 'booking_declined',
    title: 'Booking Declined',
    body: reason ? `Your booking on ${booking.booking_date} was declined: ${reason}` : `Your booking on ${booking.booking_date} was declined.`,
    data: { booking_id: booking.id },
  });

  return booking;
};

export const startBooking = async ({ bookingId, userId }) => {
  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found.');
  if (booking.status !== 'confirmed') throw new Error('Booking must be confirmed to start.');

  booking.status = 'in_progress';
  await booking.save();
  return booking;
};

export const completeBooking = async ({ bookingId, userId }) => {
  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found.');
  if (booking.status !== 'in_progress' && booking.status !== 'confirmed') {
    throw new Error('Booking must be in progress or confirmed to complete.');
  }

  booking.status = 'completed';
  await booking.save();

  await Notification.create({
    user_id: booking.rider_id,
    type: 'general',
    title: 'Session Completed',
    body: `Your session on ${booking.booking_date} has been completed.`,
    data: { booking_id: booking.id },
  });

  return booking;
};

export const sendPaymentReminder = async ({ bookingId, coachId }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [
      { model: Stable, as: 'stable' },
      { model: User, as: 'coach' },
      { model: User, as: 'rider' },
    ],
  });
  if (!booking) throw new Error('Booking not found.');
  if (booking.coach_id !== coachId) throw new Error('Only the assigned coach can send reminders.');
  if (booking.status !== 'completed') throw new Error('Can only send reminders for completed bookings.');

  const coach = booking.coach;
  const coachType = coach?.coach_type || 'freelancer';

  if ((coachType === 'stable_employed' || booking.stable_id) && booking.stable?.admin_id) {
    await Notification.create({
      admin_id: booking.stable.admin_id,
      type: 'payment_reminder',
      title: 'Payment Reminder',
      body: `Coach ${coach.first_name || ''} ${coach.last_name || ''} is requesting payment for session on ${booking.booking_date}.`,
      data: { booking_id: booking.id, coach_id: coachId },
    });
  }

  if (coachType === 'independent' || coachType === 'freelancer') {
    await Notification.create({
      user_id: booking.rider_id,
      type: 'payment_reminder',
      title: 'Payment Reminder',
      body: `Coach ${coach.first_name || ''} ${coach.last_name || ''} is requesting payment for your session on ${booking.booking_date}.`,
      data: { booking_id: booking.id, coach_id: coachId },
    });
  }

  return { message: 'Payment reminder sent.' };
};
