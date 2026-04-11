import { Op, Transaction } from 'sequelize';
import sequelize from '../config/database.js';
import {
  Arena, CoachReview, CoachStable, CoachStableSchedule, Course, CourseSession,
  Discipline, Horse, HorseAvailability, Invitation, LessonBooking,
  Payment, Stable, User,
} from '../models/index.js';
import { createNotification } from './notification.service.js';
import CoachWeeklyAvailability from '../models/coachWeeklyAvailability.model.js';
import CoachAvailabilityException from '../models/coachAvailabilityException.model.js';

// Shared includes for booking queries — ensures rider/coach/stable/horse/arena are always loaded
const BOOKING_DETAIL_INCLUDES = [
  {
    model: User,
    as: 'rider',
    attributes: ['id', 'first_name', 'last_name', 'email', 'mobile_number', 'profile_picture_url'],
  },
  {
    model: User,
    as: 'coach',
    attributes: ['id', 'first_name', 'last_name', 'email', 'mobile_number', 'profile_picture_url'],
  },
  {
    model: Stable,
    as: 'stable',
    attributes: ['id', 'name', 'city', 'country', 'admin_id'],
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
  {
    model: Course,
    as: 'course',
    attributes: ['id', 'title', 'difficulty_level'],
    required: false,
  },
];

/**
 * Format a 24h time string (e.g. "20:00:00") to 12h AM/PM (e.g. "8:00 PM").
 */
const formatTime12h = (time24) => {
  if (!time24) return '';
  const parts = String(time24).split(':');
  let hour = parseInt(parts[0], 10);
  const min = parts.length > 1 ? parseInt(parts[1], 10) : 0;
  if (isNaN(hour) || isNaN(min)) return String(time24);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  if (hour === 0) hour = 12;
  if (hour > 12) hour -= 12;
  return `${hour}:${String(min).padStart(2, '0')} ${ampm}`;
};

/**
 * Convert a date string to ISO day-of-week (1=Monday ... 7=Sunday).
 * Uses T12:00:00 to avoid UTC midnight timezone shift issues.
 */
const getIsoDayOfWeek = (dateString) => {
  const d = new Date(`${dateString}T12:00:00`);
  const jsDay = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return jsDay === 0 ? 7 : jsDay; // Convert to 1=Mon, ..., 7=Sun
};

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

export const getBookingStables = async ({ search, page, limit, coachId }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const where = { is_active: true, is_approved: true };

  // Filter by coach's linked stables if coachId provided
  if (coachId) {
    const coachLinks = await CoachStable.findAll({
      where: { coach_id: coachId, is_active: true },
      attributes: ['stable_id'],
      raw: true,
    });
    const stableIds = coachLinks.map((l) => l.stable_id);
    if (stableIds.length === 0) {
      return { data: [], pagination: buildPaginationMeta({ currentPage: 1, limit: pagination.limit, totalRecords: 0 }) };
    }
    where.id = { [Op.in]: stableIds };
  }
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

export const getStableCoaches = async ({ stableId, search, page, limit, date, startTime, riderId }) => {
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

  // Track visibility per coach for privacy filtering
  const visibilityMap = new Map();
  for (const link of coachLinks) {
    if (link.coach && !coachMap.has(link.coach.id)) {
      coachMap.set(link.coach.id, link.coach);
      visibilityMap.set(link.coach.id, link.visibility || 'public');
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

  // ── Multi-stable privacy: filter coaches with 'featured_riders_only' visibility ──
  const restrictedCoachIds = coaches
    .filter((c) => visibilityMap.get(c.id) === 'featured_riders_only')
    .map((c) => c.id);

  if (restrictedCoachIds.length > 0) {
    if (!riderId) {
      // Unauthenticated: exclude all restricted coaches
      coaches = coaches.filter((c) => visibilityMap.get(c.id) !== 'featured_riders_only');
    } else {
      // Check if rider has completed bookings with these coaches
      const priorBookings = await LessonBooking.findAll({
        where: {
          rider_id: riderId,
          coach_id: { [Op.in]: restrictedCoachIds },
          status: { [Op.in]: ['confirmed', 'completed', 'in_progress'] },
        },
        attributes: ['coach_id'],
        group: ['coach_id'],
        raw: true,
      });
      const allowedCoachIds = new Set(priorBookings.map((b) => b.coach_id));

      // Also check for accepted rider invitations from these coaches
      const acceptedInvitations = await Invitation.findAll({
        where: {
          rider_id: riderId,
          coach_id: { [Op.in]: restrictedCoachIds },
          role: 'rider',
          status: 'accepted',
        },
        attributes: ['coach_id'],
        group: ['coach_id'],
        raw: true,
      });
      for (const inv of acceptedInvitations) {
        allowedCoachIds.add(inv.coach_id);
      }

      coaches = coaches.filter((c) => {
        if (visibilityMap.get(c.id) !== 'featured_riders_only') return true;
        return allowedCoachIds.has(c.id);
      });
    }
  }

  // ── Availability filtering: only show coaches available at selected date/time ──
  if (date && startTime && coaches.length > 0) {
    const coachIds = coaches.map((c) => c.id);
    const isoDay = getIsoDayOfWeek(date);

    // Batch-fetch weekly availability for all candidate coaches on this day
    const availabilities = await CoachWeeklyAvailability.findAll({
      where: {
        coach_id: { [Op.in]: coachIds },
        day_of_week: isoDay,
        is_active: true,
        start_time: { [Op.lte]: startTime },
        end_time: { [Op.gte]: startTime },
      },
      raw: true,
    });
    const availableCoachIds = new Set(availabilities.map((a) => a.coach_id));

    // Batch-fetch exceptions (day off) for this date
    const exceptions = await CoachAvailabilityException.findAll({
      where: {
        coach_id: { [Op.in]: [...availableCoachIds] },
        exception_date: date,
        exception_type: 'unavailable',
      },
      raw: true,
    });
    const dayOffCoachIds = new Set(exceptions.map((e) => e.coach_id));

    // Batch-fetch conflicting bookings at this time
    const conflicts = await LessonBooking.findAll({
      where: {
        coach_id: { [Op.in]: [...availableCoachIds] },
        booking_date: date,
        start_time: startTime,
        status: { [Op.notIn]: ['cancelled', 'declined'] },
      },
      attributes: ['coach_id'],
      raw: true,
    });
    const busyCoachIds = new Set(conflicts.map((b) => b.coach_id));

    coaches = coaches.filter((c) => {
      const id = c.id;
      return availableCoachIds.has(id) && !dayOffCoachIds.has(id) && !busyCoachIds.has(id);
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

export const getCoachSlots = async ({ coachId, date, stableId }) => {
  if (!coachId || !date) {
    throw new Error('coachId and date are required.');
  }

  const coach = await User.findByPk(coachId);
  if (!coach || coach.role !== 'coach') {
    throw new Error('Coach not found.');
  }

  const dayOfWeek = getIsoDayOfWeek(date);
  console.log(`[getCoachSlots] coachId=${coachId}, date=${date}, dayOfWeek=${dayOfWeek}, stableId=${stableId || 'none'}`);

  const exception = await CoachAvailabilityException.findOne({
    where: {
      coach_id: coachId,
      exception_date: date,
      exception_type: 'unavailable',
    },
  });

  if (exception && !exception.start_time && !exception.end_time) {
    return { data: [], allowed_durations: coach.allowed_durations || [30, 45, 60], default_duration: coach.default_duration || 45 };
  }

  // Try per-stable schedule first, then fall back to global weekly availability
  let scheduleRows = [];

  if (stableId) {
    const coachStableLink = await CoachStable.findOne({
      where: { coach_id: coachId, stable_id: stableId, is_active: true },
    });

    if (coachStableLink) {
      scheduleRows = await CoachStableSchedule.findAll({
        where: {
          coach_stable_id: coachStableLink.id,
          day_of_week: dayOfWeek,
          is_active: true,
          [Op.and]: [
            { [Op.or]: [{ valid_from: null }, { valid_from: { [Op.lte]: date } }] },
            { [Op.or]: [{ valid_to: null }, { valid_to: { [Op.gte]: date } }] },
          ],
        },
      });
    }
  }

  // Fallback to global CoachWeeklyAvailability if no per-stable schedules found
  if (scheduleRows.length === 0) {
    scheduleRows = await CoachWeeklyAvailability.findAll({
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
  }

  if (scheduleRows.length === 0) {
    // Debug: check what availability actually exists for this coach
    const allAvail = await CoachWeeklyAvailability.findAll({ where: { coach_id: coachId }, raw: true });
    console.log(`[getCoachSlots] No schedule found for dayOfWeek=${dayOfWeek}. Coach has ${allAvail.length} availability records:`, allAvail.map(a => `day=${a.day_of_week} ${a.start_time}-${a.end_time} active=${a.is_active}`));
    return { data: [], allowed_durations: coach.allowed_durations || [30, 45, 60], default_duration: coach.default_duration || 45 };
  }

  console.log(`[getCoachSlots] Found ${scheduleRows.length} schedule rows for dayOfWeek=${dayOfWeek}`);

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

  const bufferMinutes = Number(process.env.BOOKING_BUFFER_MINUTES) || 0;
  const slots = [];

  for (const row of scheduleRows) {
    const slotDuration = row.slot_duration_minutes || 45;
    const [startH, startM] = row.start_time.split(':').map(Number);
    const [endH, endM] = row.end_time.split(':').map(Number);
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

      const conflict = booked.some((b) => {
        const bStart = b.start;
        const bEnd = b.end;
        if (bufferMinutes > 0) {
          // Extend booked range by buffer on both sides
          const bStartMins = parseInt(bStart.split(':')[0]) * 60 + parseInt(bStart.split(':')[1]) - bufferMinutes;
          const bEndMins = parseInt(bEnd.split(':')[0]) * 60 + parseInt(bEnd.split(':')[1]) + bufferMinutes;
          const bufferedStart = `${String(Math.floor(Math.max(0, bStartMins) / 60)).padStart(2, '0')}:${String(Math.max(0, bStartMins) % 60).padStart(2, '0')}:00`;
          const bufferedEnd = `${String(Math.floor(bEndMins / 60)).padStart(2, '0')}:${String(bEndMins % 60).padStart(2, '0')}:00`;
          return slotStart < bufferedEnd && slotEnd > bufferedStart;
        }
        return slotStart < bEnd && slotEnd > bStart;
      });
      if (!conflict) {
        slots.push({ start_time: slotStart, end_time: slotEnd, duration_minutes: slotDuration });
      }
    }
  }

  // Resolve stable for this coach (so the mobile app can pass stableId to horse selection)
  let resolvedStableId = stableId || null;
  if (!resolvedStableId) {
    const primaryLink = await CoachStable.findOne({
      where: { coach_id: coachId, is_active: true },
      order: [['is_primary', 'DESC'], ['id', 'ASC']],
    });
    if (primaryLink) resolvedStableId = primaryLink.stable_id;
  }

  return {
    data: slots,
    stable_id: resolvedStableId ? Number(resolvedStableId) : null,
    allowed_durations: coach.allowed_durations || [30, 45, 60],
    default_duration: coach.default_duration || 45,
    approval_mode: coach.approval_mode || 'manual',
  };
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
  if (!riderId || !bookingDate || !startTime || !endTime) {
    throw new Error('riderId, bookingDate, startTime, and endTime are required.');
  }

  // Validate time ordering
  if (startTime >= endTime) {
    throw new Error('startTime must be before endTime.');
  }

  // Coach-first flow: auto-resolve stable from coach if not provided
  if (!stableId && coachId) {
    stableId = await resolveStableForCoach(coachId);
  }
  if (!stableId) {
    throw new Error('stableId is required (or provide coachId to auto-resolve).');
  }

  const isArenaOnly = bookingType === 'arena_only';
  if (isArenaOnly) {
    if (!arenaId) throw new Error('arenaId is required for arena-only booking.');
  }

  const rider = await User.findByPk(riderId);
  if (!rider) throw new Error('Rider not found.');

  let coachRecord = null;
  if (coachId) {
    coachRecord = await User.findByPk(coachId);
    if (!coachRecord || coachRecord.role !== 'coach') throw new Error('Coach not found.');
  }

  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');

  // Validate coach is linked to this stable
  if (coachId) {
    const coachStableLink = await CoachStable.findOne({
      where: { coach_id: coachId, stable_id: stableId, is_active: true },
    });
    if (!coachStableLink) {
      throw new Error('This coach is not available at the selected stable.');
    }
  }

  if (arenaId) {
    const arena = await Arena.findByPk(arenaId);
    if (!arena) throw new Error('Arena not found.');
  }

  if (horseId) {
    const horse = await Horse.findByPk(horseId);
    if (!horse) throw new Error('Horse not found.');
  }

  // Determine initial status based on coach approval mode
  const approvalMode = coachRecord?.approval_mode || 'manual';
  let initialStatus = 'pending_review';
  if (coachId && approvalMode === 'auto') {
    initialStatus = 'pending_payment';
  }

  // ── Wrap conflict checks + booking creation in a serializable transaction ──
  // Uses SELECT ... FOR UPDATE to acquire row-level locks, preventing race
  // conditions where two concurrent requests both pass availability checks
  // before either booking is committed.
  const booking = await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (t) => {
      const lockOpts = { transaction: t, lock: t.LOCK.UPDATE };
      const activeStatuses = ['pending_review', 'pending_horse_approval', 'pending_payment', 'confirmed', 'in_progress'];
      const overlapWhere = (extraFields) => ({
        ...extraFields,
        booking_date: bookingDate,
        status: { [Op.in]: activeStatuses },
        [Op.or]: [
          { start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } },
        ],
      });

      // Coach capacity check (respects max_concurrent_riders setting)
      if (coachId) {
        const maxConcurrent = coachRecord?.max_concurrent_riders || 1;
        const coachConflictCount = await LessonBooking.count({
          where: overlapWhere({ coach_id: coachId }),
          ...lockOpts,
        });
        if (coachConflictCount >= maxConcurrent) {
          throw new Error(maxConcurrent === 1
            ? 'This coach is already booked for the selected time slot.'
            : `This coach has reached maximum capacity (${maxConcurrent} riders) for the selected time slot.`);
        }
      }

      // Arena double-booking prevention (with row lock)
      if (arenaId) {
        const arenaConflict = await LessonBooking.findOne({
          where: overlapWhere({ arena_id: arenaId }),
          ...lockOpts,
        });
        if (arenaConflict) {
          throw new Error('This arena is already booked for the selected time slot.');
        }
      }

      // Auto-assign horse inside the transaction so the lock covers it
      let resolvedHorseId = horseId;
      if (horseAssignment === 'auto' && !resolvedHorseId) {
        resolvedHorseId = await autoAssignHorse(stableId, bookingDate, startTime, endTime, t);
      }

      // Horse double-booking prevention (with row lock)
      if (resolvedHorseId) {
        const horseConflict = await LessonBooking.findOne({
          where: overlapWhere({ horse_id: resolvedHorseId }),
          ...lockOpts,
        });
        if (horseConflict) {
          throw new Error('This horse is already booked for the selected time slot.');
        }
      }

      // Rider double-booking prevention (with row lock)
      const riderConflict = await LessonBooking.findOne({
        where: overlapWhere({ rider_id: riderId }),
        ...lockOpts,
      });
      if (riderConflict) {
        throw new Error('You already have a booking during the selected time slot.');
      }

      const created = await LessonBooking.create({
        rider_id: riderId,
        coach_id: coachId || null,
        stable_id: stableId,
        arena_id: arenaId || null,
        horse_id: resolvedHorseId || null,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime,
        lesson_type: lessonType || 'private',
        status: initialStatus,
        price: price || null,
        notes: notes || null,
        booking_type: isArenaOnly ? 'arena_only' : 'lesson',
        duration_minutes: durationMinutes || null,
        horse_assignment: horseAssignment || 'stable_assigns',
      }, { transaction: t });

      if (resolvedHorseId) {
        const [availability] = await HorseAvailability.findOrCreate({
          where: { horse_id: resolvedHorseId, date: bookingDate },
          defaults: {
            horse_id: resolvedHorseId,
            date: bookingDate,
            max_sessions_per_day: 3,
            sessions_booked: 0,
            is_available: true,
          },
          transaction: t,
          lock: t.LOCK.UPDATE,
        });
        await availability.save({ transaction: t });
      }

      return created;
    }
  );

  // ── Notifications are sent outside the transaction to avoid holding locks ──
  if (coachId) {
    const notifTitle = approvalMode === 'auto' ? 'New Booking (Auto-Approved)' : 'New Booking Request';
    const notifBody = approvalMode === 'auto'
      ? `${rider.first_name || 'A rider'} has booked a lesson on ${bookingDate}. Auto-approved per your settings.`
      : `${rider.first_name || 'A rider'} has requested a lesson on ${bookingDate}.`;

    await createNotification({
      userId: coachId,
      type: 'lesson_booked',
      title: notifTitle,
      body: notifBody,
      data: { booking_id: booking.id },
    });

    // If auto-approved, also notify rider
    if (approvalMode === 'auto') {
      await createNotification({
        userId: riderId,
        type: 'booking_approved',
        title: 'Booking Auto-Approved',
        body: `Your booking on ${bookingDate} has been auto-approved. Please complete payment to confirm.`,
        data: { booking_id: booking.id },
      });
    }
  }

  // Notify stable admin about new booking
  if (stable.admin_id) {
    try {
      await createNotification({
        adminId: stable.admin_id,
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

  await createNotification({
    userId: booking.rider_id,
    type: 'horse_approved',
    title: 'Horse Approved',
    body: 'Your coach has approved the horse for your upcoming lesson. Please proceed with payment.',
    data: { booking_id: booking.id },
  });

  // Reload with full associations so the response always has rider/coach/stable data
  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
};

export const confirmHorseAvailability = async ({ bookingId, adminId }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: BOOKING_DETAIL_INCLUDES,
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
    await HorseAvailability.increment('sessions_booked', {
      by: 1,
      where: { horse_id: booking.horse_id, date: booking.booking_date },
    });
  }

  if (booking.coach_id) {
    await createNotification({
      userId: booking.coach_id,
      type: 'payment_confirmed',
      title: 'Payment Confirmed',
      body: `Payment has been confirmed for the lesson on ${booking.booking_date}.`,
      data: { booking_id: booking.id },
    });
  }

  await createNotification({
    userId: booking.rider_id,
    type: 'payment_confirmed',
    title: 'Booking Confirmed',
    body: `Your lesson on ${booking.booking_date} is now confirmed.`,
    data: { booking_id: booking.id },
  });

  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
};

export const getMyBookings = async ({ userId, role, status, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const where = {};
  if (role === 'coach') {
    // Coach sees bookings assigned to them OR unassigned bookings at their linked stables
    const coachLinks = await CoachStable.findAll({
      where: { coach_id: userId, status: 'approved', is_active: true },
      attributes: ['stable_id'],
    });
    const stableIds = coachLinks.map(l => l.stable_id);

    if (stableIds.length > 0) {
      where[Op.or] = [
        { coach_id: userId },
        { coach_id: null, stable_id: { [Op.in]: stableIds } },
      ];
    } else {
      where.coach_id = userId;
    }
  } else {
    where.rider_id = userId;
  }

  if (status) {
    where.status = status;
  }

  const { rows, count } = await LessonBooking.findAndCountAll({
    where,
    include: BOOKING_DETAIL_INCLUDES,
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

  if (['cancelled', 'completed', 'declined'].includes(booking.status)) {
    throw new Error('This booking cannot be cancelled.');
  }

  const wasConfirmed = ['confirmed', 'in_progress'].includes(booking.status);
  const hadHorse = booking.horse_id;

  booking.status = 'cancelled';
  await booking.save();

  if (hadHorse && wasConfirmed) {
    await HorseAvailability.decrement('sessions_booked', {
      by: 1,
      where: {
        horse_id: booking.horse_id,
        date: booking.booking_date,
        sessions_booked: { [Op.gt]: 0 },
      },
    });
  }

  const notifyUserId = booking.rider_id === userId ? booking.coach_id : booking.rider_id;
  const cancelledByRole = booking.rider_id === userId ? 'rider' : 'coach';

  if (notifyUserId) {
    await createNotification({
      userId: notifyUserId,
      type: 'general',
      title: 'Booking Cancelled',
      body: `The lesson on ${booking.booking_date} has been cancelled by the ${cancelledByRole}.`,
      data: { booking_id: booking.id },
    });
  }

  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
};

/**
 * Get booked/available time slots for a specific arena on a given date.
 * Called by mobile: GET /bookings/arenas/:arenaId/slots?date=YYYY-MM-DD
 */
export const getArenaSlots = async ({ arenaId, date }) => {
  if (!arenaId || !date) throw new Error('arenaId and date are required.');

  const arena = await Arena.findByPk(arenaId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!arena) throw new Error('Arena not found.');

  const stable = arena.stable;
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dateObj = new Date(`${date}T12:00:00`);
  const dayName = dayNames[dateObj.getDay()];

  let openTime = '06:00';
  let closeTime = '22:00';
  let isClosed = false;

  if (stable?.operating_hours && stable.operating_hours[dayName]) {
    const dayHours = stable.operating_hours[dayName];
    if (dayHours.is_closed) isClosed = true;
    if (dayHours.open) openTime = dayHours.open;
    if (dayHours.close) closeTime = dayHours.close;
  }

  if (isClosed) return { data: [] };

  // Find all bookings for this arena on this date
  const bookings = await LessonBooking.findAll({
    where: {
      arena_id: arenaId,
      booking_date: date,
      status: { [Op.in]: ['pending_review', 'confirmed', 'in_progress', 'pending_horse_approval', 'pending_payment'] },
    },
    attributes: ['id', 'start_time', 'end_time', 'status', 'lesson_type'],
    include: [
      { model: User, as: 'rider', attributes: ['id', 'first_name'] },
      { model: User, as: 'coach', attributes: ['id', 'first_name'] },
    ],
    order: [['start_time', 'ASC']],
  });

  // Generate 30-minute slots across operating hours
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM;

  const slots = [];
  for (let m = openMins; m + 30 <= closeMins; m += 30) {
    const startStr = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`;
    const endMin = m + 30;
    const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}:00`;

    const overlapping = bookings.find(b => startStr < b.end_time && endStr > b.start_time);

    slots.push({
      start_time: startStr,
      end_time: endStr,
      available: !overlapping,
      booking: overlapping ? {
        id: overlapping.id,
        status: overlapping.status,
        lesson_type: overlapping.lesson_type,
        rider: overlapping.rider,
        coach: overlapping.coach,
      } : null,
    });
  }

  return { data: slots };
};

export const getAvailableSlots = async ({ stableId, date, duration = 60 }) => {
  if (!stableId || !date) throw new Error('stableId and date are required.');

  const stable = await Stable.findByPk(stableId);
  if (!stable) throw new Error('Stable not found.');

  const durationMins = Number(duration) || 60;
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dateObj = new Date(`${date}T12:00:00`);
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

export const approveBooking = async ({ bookingId, userId, isAdmin = false }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!booking) throw new Error('Booking not found.');
  if (booking.status !== 'pending_review') throw new Error('Booking is not pending review.');

  // Allow if admin or if the coach assigned to this booking
  if (isAdmin) {
    if (!booking.stable || booking.stable.admin_id !== userId) {
      throw new Error('Admin does not own the stable for this booking.');
    }
  } else if (booking.coach_id !== userId) {
    throw new Error('Only the assigned coach or an admin can approve this booking.');
  }

  booking.status = 'pending_payment';
  await booking.save();

  await createNotification({
    userId: booking.rider_id,
    type: 'booking_approved',
    title: 'Booking Approved — Payment Required',
    body: `Your booking on ${booking.booking_date} has been approved. Please complete payment to confirm.`,
    data: { booking_id: booking.id },
  });

  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
};

// Allow coach to confirm a booking directly (bypasses payment when stable allows it)
export const coachConfirmBooking = async ({ bookingId, coachId }) => {
  const booking = await LessonBooking.findByPk(parseInt(bookingId, 10), {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!booking) throw new Error('Booking not found.');
  if (Number(booking.coach_id) !== Number(coachId)) {
    throw new Error('Only the assigned coach can confirm this booking.');
  }
  if (!['pending_payment', 'pending_review'].includes(booking.status)) {
    throw new Error('Booking is not in a confirmable state.');
  }

  booking.status = 'confirmed';
  await booking.save();

  // Increment horse availability if assigned
  if (booking.horse_id) {
    await HorseAvailability.increment('sessions_booked', {
      by: 1,
      where: { horse_id: booking.horse_id, date: booking.booking_date },
    });
  }

  await createNotification({
    userId: booking.rider_id,
    type: 'booking_approved',
    title: 'Booking Confirmed',
    body: `Your booking on ${booking.booking_date} has been confirmed by your coach.`,
    data: { booking_id: booking.id },
  });

  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
};

// Allow admin to manually confirm a booking (bypasses payment requirement during Coming Soon phase)
export const adminConfirmBooking = async ({ bookingId, adminId }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!booking) throw new Error('Booking not found.');
  if (!booking.stable || booking.stable.admin_id !== adminId) {
    throw new Error('Admin does not own the stable for this booking.');
  }
  if (!['pending_payment', 'pending_review'].includes(booking.status)) {
    throw new Error('Booking is not in a confirmable state.');
  }

  booking.status = 'confirmed';
  await booking.save();

  await createNotification({
    userId: booking.rider_id,
    type: 'booking_approved',
    title: 'Booking Confirmed',
    body: `Your booking on ${booking.booking_date} has been confirmed.`,
    data: { booking_id: booking.id },
  });

  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
};

export const declineBooking = async ({ bookingId, userId, isAdmin = false, reason }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!booking) throw new Error('Booking not found.');
  if (booking.status !== 'pending_review') throw new Error('Booking is not pending review.');

  if (isAdmin) {
    if (!booking.stable || booking.stable.admin_id !== userId) {
      throw new Error('Admin does not own the stable for this booking.');
    }
  } else if (booking.coach_id !== userId) {
    throw new Error('Only the assigned coach or an admin can decline this booking.');
  }

  booking.status = 'declined';
  booking.decline_reason = reason || null;
  await booking.save();

  await createNotification({
    userId: booking.rider_id,
    type: 'booking_declined',
    title: 'Booking Declined',
    body: reason ? `Your booking on ${booking.booking_date} was declined: ${reason}` : `Your booking on ${booking.booking_date} was declined.`,
    data: { booking_id: booking.id },
  });

  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
};

export const startBooking = async ({ bookingId, userId }) => {
  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found.');
  if (userId !== booking.coach_id) throw new Error('Only the assigned coach can start a session.');
  if (booking.status !== 'confirmed') throw new Error('Booking must be confirmed to start.');

  booking.status = 'in_progress';
  await booking.save();
  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
};

export const completeBooking = async ({ bookingId, userId }) => {
  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found.');
  if (userId !== booking.coach_id) throw new Error('Only the assigned coach can complete a session.');
  if (booking.status !== 'in_progress' && booking.status !== 'confirmed') {
    throw new Error('Booking must be in progress or confirmed to complete.');
  }

  booking.status = 'completed';
  await booking.save();

  await createNotification({
    userId: booking.rider_id,
    type: 'general',
    title: 'Session Completed',
    body: `Your session on ${booking.booking_date} has been completed.`,
    data: { booking_id: booking.id },
  });

  // Auto-favorite: link horse to rider after completed booking
  if (booking.rider_id && booking.horse_id) {
    try {
      const { autoFavoriteHorse } = await import('./riderHorse.service.js');
      await autoFavoriteHorse({
        riderId: booking.rider_id,
        horseId: booking.horse_id,
        stableId: booking.stable_id,
      });
    } catch (e) {
      console.warn('[booking] Auto-favorite horse failed:', e.message);
    }
  }

  return LessonBooking.findByPk(booking.id, { include: BOOKING_DETAIL_INCLUDES });
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
  if (!['pending_payment', 'completed'].includes(booking.status)) {
    throw new Error('Can only send payment reminders for pending payment or completed bookings.');
  }

  const coach = booking.coach;
  const coachType = coach?.coach_type || 'freelancer';

  if ((coachType === 'stable_employed' || booking.stable_id) && booking.stable?.admin_id) {
    await createNotification({
      adminId: booking.stable.admin_id,
      type: 'payment_reminder',
      title: 'Payment Reminder',
      body: `Coach ${coach.first_name || ''} ${coach.last_name || ''} is requesting payment for session on ${booking.booking_date}.`,
      data: { booking_id: booking.id, coach_id: coachId },
    });
  }

  if (coachType === 'independent' || coachType === 'freelancer') {
    await createNotification({
      userId: booking.rider_id,
      type: 'payment_reminder',
      title: 'Payment Reminder',
      body: `Coach ${coach.first_name || ''} ${coach.last_name || ''} is requesting payment for your session on ${booking.booking_date}.`,
      data: { booking_id: booking.id, coach_id: coachId },
    });
  }

  return { message: 'Payment reminder sent.' };
};

// ──────────────────────────────────────────────────
// Coach-first booking helpers
// ──────────────────────────────────────────────────

/**
 * Resolve the stable for a coach based on their primary link or any active link.
 */
export const resolveStableForCoach = async (coachId) => {
  // Try primary stable first
  const primary = await CoachStable.findOne({
    where: { coach_id: coachId, is_active: true, is_primary: true, status: 'approved' },
    attributes: ['stable_id'],
  });
  if (primary) return primary.stable_id;

  // Fall back to any active approved link
  const anyLink = await CoachStable.findOne({
    where: { coach_id: coachId, is_active: true, status: 'approved' },
    attributes: ['stable_id'],
    order: [['joined_at', 'ASC']],
  });
  if (anyLink) return anyLink.stable_id;

  return null;
};

/**
 * Auto-assign an available horse at the stable for the given time slot.
 */
export const autoAssignHorse = async (stableId, bookingDate, startTime, endTime, transaction = null) => {
  const activeStatuses = ['pending_review', 'pending_horse_approval', 'pending_payment', 'confirmed', 'in_progress'];
  const txOpts = transaction ? { transaction } : {};
  const lockOpts = transaction ? { transaction, lock: transaction.LOCK.UPDATE } : {};

  // Get all active horses at this stable
  const horses = await Horse.findAll({
    where: { stable_id: stableId, status: 'available' },
    attributes: ['id', 'name', 'max_daily_sessions'],
    ...txOpts,
  });

  for (const horse of horses) {
    // Check daily session limit (with row lock when inside a transaction)
    const availability = await HorseAvailability.findOne({
      where: { horse_id: horse.id, date: bookingDate },
      ...lockOpts,
    });
    if (availability && (!availability.is_available || availability.sessions_booked >= availability.max_sessions_per_day)) {
      continue;
    }

    // Check time slot conflict (with row lock when inside a transaction)
    const conflict = await LessonBooking.findOne({
      where: {
        horse_id: horse.id,
        booking_date: bookingDate,
        status: { [Op.in]: activeStatuses },
        [Op.or]: [
          { start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } },
        ],
      },
      ...lockOpts,
    });
    if (!conflict) {
      return horse.id; // Found an available horse
    }
  }

  return null; // No horse available — will be assigned by stable later
};

/**
 * Get returning rider defaults — last coach, horse, and next available slot.
 */
export const getReturningRiderDefaults = async (riderId) => {
  const lastBooking = await LessonBooking.findOne({
    where: {
      rider_id: riderId,
      coach_id: { [Op.not]: null },
      status: { [Op.in]: ['confirmed', 'completed', 'in_progress'] },
    },
    order: [['booking_date', 'DESC'], ['start_time', 'DESC']],
    include: [
      { model: User, as: 'coach', attributes: ['id', 'first_name', 'last_name', 'profile_picture_url', 'default_duration', 'allowed_durations'] },
      { model: Horse, as: 'horse', attributes: ['id', 'name', 'profile_picture_url'] },
      { model: Stable, as: 'stable', attributes: ['id', 'name'] },
    ],
  });

  if (!lastBooking) {
    return { hasDefaults: false };
  }

  return {
    hasDefaults: true,
    coach: lastBooking.coach ? {
      id: lastBooking.coach.id,
      name: `${lastBooking.coach.first_name || ''} ${lastBooking.coach.last_name || ''}`.trim(),
      profile_picture_url: lastBooking.coach.profile_picture_url,
      default_duration: lastBooking.coach.default_duration,
      allowed_durations: lastBooking.coach.allowed_durations,
    } : null,
    horse: lastBooking.horse ? {
      id: lastBooking.horse.id,
      name: lastBooking.horse.name,
      profile_picture_url: lastBooking.horse.profile_picture_url,
    } : null,
    stable: lastBooking.stable ? {
      id: lastBooking.stable.id,
      name: lastBooking.stable.name,
    } : null,
    lastDuration: lastBooking.duration_minutes,
  };
};

/**
 * Coach can modify a pending booking (change horse, stable, or time).
 */
export const coachModifyBooking = async (bookingId, coachId, { horseId, stableId: newStableId, startTime: newStartTime, endTime: newEndTime, notes: newNotes, courseId, durationMinutes, bookingDate }) => {
  const booking = await LessonBooking.findByPk(bookingId, {
    include: [{ model: Stable, as: 'stable' }],
  });
  if (!booking) throw new Error('Booking not found.');
  if (booking.coach_id !== coachId) throw new Error('Only the assigned coach can modify this booking.');

  const modifiableStatuses = ['pending_review', 'pending_horse_approval', 'pending_payment', 'confirmed'];
  if (!modifiableStatuses.includes(booking.status)) {
    throw new Error('This booking cannot be modified.');
  }

  if (horseId !== undefined) {
    if (horseId) {
      const horse = await Horse.findByPk(horseId);
      if (!horse) throw new Error('Horse not found.');
    }
    booking.horse_id = horseId || null;
  }

  if (newStableId !== undefined) {
    const stable = await Stable.findByPk(newStableId);
    if (!stable) throw new Error('Stable not found.');
    booking.stable_id = newStableId;
  }

  if (newStartTime !== undefined) booking.start_time = newStartTime;
  if (newEndTime !== undefined) booking.end_time = newEndTime;
  if (newNotes !== undefined) booking.notes = newNotes;

  // Coach can assign a course to the booking
  if (courseId !== undefined) {
    if (courseId) {
      const course = await Course.findByPk(courseId);
      if (!course) throw new Error('Course not found.');
    }
    booking.course_id = courseId || null;
  }

  // Coach can update booking date
  if (bookingDate !== undefined) booking.booking_date = bookingDate;

  // Coach can set duration — auto-calculate end_time from start_time + duration
  if (durationMinutes !== undefined && durationMinutes > 0) {
    booking.duration_minutes = durationMinutes;
    if (!booking.start_time) throw new Error('Cannot calculate end time: start time is not set.');
    const [h, m] = booking.start_time.split(':').map(Number);
    const startMins = h * 60 + m;
    const endMins = startMins + durationMinutes;
    if (endMins >= 1440) {
      throw new Error('Session cannot extend past midnight.');
    }
    const endH = Math.floor(endMins / 60).toString().padStart(2, '0');
    const endM = (endMins % 60).toString().padStart(2, '0');
    booking.end_time = `${endH}:${endM}:00`;
  }

  await booking.save();

  // Build notification body with details
  const details = [];
  if (courseId !== undefined) details.push('course assigned');
  if (durationMinutes !== undefined) details.push(`duration: ${durationMinutes} min`);
  if (horseId !== undefined) details.push('horse updated');
  const detailText = details.length > 0 ? ` Updates: ${details.join(', ')}.` : '';

  // Notify rider about the modification
  if (booking.rider_id) {
    await createNotification({
      userId: booking.rider_id,
      type: 'general',
      title: 'Booking Updated',
      body: `Your coach has updated your booking.${detailText} Please review the changes.`,
      data: { booking_id: booking.id },
    });
  }

  return booking;
};

/**
 * Rider can reschedule a pending booking (change date/time).
 */
export const riderModifyBooking = async ({ bookingId, riderId, bookingDate, startTime, endTime }) =>
  sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (t) => {
      const lockOpts = { transaction: t, lock: t.LOCK.UPDATE };
      const booking = await LessonBooking.findByPk(bookingId, lockOpts);
      if (!booking) throw new Error('Booking not found.');
      if (booking.rider_id !== riderId) throw new Error('Only the booking rider can modify this booking.');

      const modifiableStatuses = ['pending_review', 'pending_payment', 'pending_horse_approval'];
      if (!modifiableStatuses.includes(booking.status)) {
        throw new Error('This booking can no longer be modified.');
      }

      // Reject no-op reschedules (no fields provided)
      if (bookingDate === undefined && startTime === undefined && endTime === undefined) {
        throw new Error('At least one of booking_date, start_time, or end_time is required.');
      }

      // Compute effective values
      const nextStartTime = startTime ?? booking.start_time;
      const nextEndTime = endTime ?? booking.end_time;
      const nextBookingDate = bookingDate ?? booking.booking_date;

      // Validate time range
      if (nextStartTime >= nextEndTime) {
        throw new Error('start_time must be before end_time.');
      }

      // Skip if the requested schedule matches the current booking
      const hasActualChange =
        nextBookingDate !== booking.booking_date ||
        nextStartTime !== booking.start_time ||
        nextEndTime !== booking.end_time;

      if (!hasActualChange) {
        throw new Error('The requested schedule matches the current booking.');
      }

      // Check for overlapping bookings (rider, coach, arena, horse)
      const activeStatuses = ['pending_review', 'pending_horse_approval', 'pending_payment', 'confirmed', 'in_progress'];
      const overlapWhere = (extra) => ({
        ...extra,
        id: { [Op.ne]: booking.id },
        booking_date: nextBookingDate,
        status: { [Op.in]: activeStatuses },
        start_time: { [Op.lt]: nextEndTime },
        end_time: { [Op.gt]: nextStartTime },
      });

      const riderConflict = await LessonBooking.findOne({ where: overlapWhere({ rider_id: booking.rider_id }), ...lockOpts });
      if (riderConflict) throw new Error('You already have a booking during the selected time slot.');

      if (booking.coach_id) {
        const coachConflict = await LessonBooking.findOne({ where: overlapWhere({ coach_id: booking.coach_id }), ...lockOpts });
        if (coachConflict) throw new Error('This coach is already booked for the selected time slot.');
      }
      if (booking.arena_id) {
        const arenaConflict = await LessonBooking.findOne({ where: overlapWhere({ arena_id: booking.arena_id }), ...lockOpts });
        if (arenaConflict) throw new Error('This arena is already booked for the selected time slot.');
      }
      if (booking.horse_id) {
        const horseConflict = await LessonBooking.findOne({ where: overlapWhere({ horse_id: booking.horse_id }), ...lockOpts });
        if (horseConflict) throw new Error('This horse is already booked for the selected time slot.');
      }

      booking.booking_date = nextBookingDate;
      booking.start_time = nextStartTime;
      booking.end_time = nextEndTime;
      booking.status = 'pending_review';

      await booking.save({ transaction: t });

      // Notify coach about the reschedule
      if (booking.coach_id) {
        await createNotification({
          userId: booking.coach_id,
          type: 'general',
          title: 'Booking Rescheduled',
          body: 'A rider has rescheduled their booking. Please review the changes.',
          data: { booking_id: booking.id },
        });
      }

      return { message: 'Booking rescheduled successfully', data: booking };
    }
  );

// ──────────────────────────────────────────────────
// ──────────────────────────────────────────────────
// Delay Management
// ──────────────────────────────────────────────────

/**
 * Coach delays bookings — shifts start/end times for remaining sessions.
 */
export const delayBookings = async ({ bookingId, coachId, delayMinutes, delayAll = true, reason }) => {
  if (!delayMinutes || delayMinutes <= 0 || delayMinutes > 60) {
    throw new Error('delayMinutes must be between 1 and 60.');
  }

  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) throw new Error('Booking not found.');
  if (booking.coach_id !== coachId) throw new Error('Only the assigned coach can delay bookings.');

  const activeStatuses = ['confirmed', 'in_progress', 'pending_review', 'pending_payment'];

  // Find bookings to delay
  const where = {
    coach_id: coachId,
    booking_date: booking.booking_date,
    status: { [Op.in]: activeStatuses },
  };

  if (delayAll) {
    // Delay current booking + all subsequent on same day
    where.start_time = { [Op.gte]: booking.start_time };
  } else {
    // Only delay the next session after current
    where.start_time = { [Op.gt]: booking.end_time };
  }

  const affectedBookings = await LessonBooking.findAll({
    where,
    order: [['start_time', 'ASC']],
    include: [{ model: User, as: 'rider', attributes: ['id', 'first_name', 'last_name'] }],
  });

  const shiftTime = (timeStr, minutes) => {
    const [h, m, s] = timeStr.split(':').map(Number);
    const totalMins = h * 60 + m + minutes;
    if (totalMins >= 1440) {
      throw new Error('Delayed session would extend past midnight.');
    }
    const newH = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const newM = (totalMins % 60).toString().padStart(2, '0');
    return `${newH}:${newM}:${(s || 0).toString().padStart(2, '0')}`;
  };

  // Wrap all updates in a transaction for atomicity
  const updated = await sequelize.transaction(async (t) => {
    const result = [];
    for (const b of affectedBookings) {
      const oldStart = b.start_time;
      b.start_time = shiftTime(b.start_time, delayMinutes);
      b.end_time = shiftTime(b.end_time, delayMinutes);
      if (reason) b.delay_reason = reason;
      await b.save({ transaction: t });

      result.push({
        id: b.id,
        rider: b.rider ? `${b.rider.first_name || ''} ${b.rider.last_name || ''}`.trim() : null,
        rider_id: b.rider_id,
        oldStart,
        newStart: b.start_time,
      });
    }
    return result;
  });

  // Send notifications outside transaction (after commit)
  for (const u of updated) {
    if (u.rider_id && u.id !== bookingId) {
      await createNotification({
        userId: u.rider_id,
        type: 'general',
        title: 'Session Time Updated',
        body: `Your session has been pushed by ${delayMinutes} minutes. New time: ${formatTime12h(u.newStart)}.${reason ? ` Reason: ${reason}` : ''}`,
        data: { booking_id: u.id },
      });
    }
  }

  return { message: `${updated.length} session(s) delayed by ${delayMinutes} minutes.`, affected: updated };
};

// ──────────────────────────────────────────────────
// Booking Reminders
// ──────────────────────────────────────────────────

/**
 * Send upcoming booking reminders. Call from a cron job every 30 minutes.
 */
export const sendUpcomingReminders = async () => {
  // Use Asia/Riyadh timezone (UTC+3) to match booking_date storage
  const OFFSET_HOURS = 3; // Saudi Arabia (AST) is UTC+3
  const now = new Date();
  const localNow = new Date(now.getTime() + OFFSET_HOURS * 60 * 60 * 1000);
  const today = localNow.toISOString().split('T')[0];
  const tomorrowDate = new Date(localNow.getTime() + 24 * 60 * 60 * 1000);
  const tomorrow = tomorrowDate.toISOString().split('T')[0];

  // Current local time in HH:MM format for 1h-ahead check
  const localHours = localNow.getUTCHours();
  const localMinutes = localNow.getUTCMinutes();
  const nowMins = localHours * 60 + localMinutes;
  const oneHourAheadMins = Math.min(nowMins + 90, 1439); // Clamp to 23:59
  const oneHourAheadTime = `${Math.floor(oneHourAheadMins / 60).toString().padStart(2, '0')}:${(oneHourAheadMins % 60).toString().padStart(2, '0')}:00`;
  const nowTime = `${localHours.toString().padStart(2, '0')}:${localMinutes.toString().padStart(2, '0')}:00`;

  let sent24h = 0;
  let sent1h = 0;

  // 24h reminders — bookings tomorrow that haven't been reminded
  try {
    const bookings24h = await LessonBooking.findAll({
      where: {
        booking_date: tomorrow,
        status: 'confirmed',
        reminder_24h_sent: false,
      },
      include: [
        { model: User, as: 'rider', attributes: ['id', 'first_name'] },
        { model: User, as: 'coach', attributes: ['id', 'first_name'] },
      ],
    });

    for (const b of bookings24h) {
      const timeDisplay = b.start_time ? formatTime12h(b.start_time) : '';
      // Mark as sent first to prevent duplicates on partial failure
      b.reminder_24h_sent = true;
      await b.save();
      if (b.rider_id) {
        await createNotification({
          userId: b.rider_id,
          type: 'general',
          title: 'Session Tomorrow',
          body: `Reminder: You have a session tomorrow at ${timeDisplay}.`,
          data: { booking_id: b.id },
        });
      }
      if (b.coach_id) {
        await createNotification({
          userId: b.coach_id,
          type: 'general',
          title: 'Session Tomorrow',
          body: `Reminder: You have a session with ${b.rider?.first_name || 'a rider'} tomorrow at ${timeDisplay}.`,
          data: { booking_id: b.id },
        });
      }
      sent24h++;
    }
  } catch (e) {
    console.error('[reminders] 24h reminder error:', e.message);
  }

  // 1h reminders — bookings today starting within next 90 minutes
  try {
    const bookings1h = await LessonBooking.findAll({
      where: {
        booking_date: today,
        status: 'confirmed',
        reminder_1h_sent: false,
        start_time: { [Op.between]: [nowTime, oneHourAheadTime] },
      },
      include: [
        { model: User, as: 'rider', attributes: ['id', 'first_name'] },
        { model: User, as: 'coach', attributes: ['id', 'first_name'] },
      ],
    });

    for (const b of bookings1h) {
      const timeDisplay = b.start_time ? formatTime12h(b.start_time) : '';
      // Mark as sent first to prevent duplicates on partial failure
      b.reminder_1h_sent = true;
      await b.save();
      if (b.rider_id) {
        await createNotification({
          userId: b.rider_id,
          type: 'general',
          title: 'Session Starting Soon',
          body: `Your session starts at ${timeDisplay} — see you soon!`,
          data: { booking_id: b.id },
        });
      }
      if (b.coach_id) {
        await createNotification({
          userId: b.coach_id,
          type: 'general',
          title: 'Session Starting Soon',
          body: `Session with ${b.rider?.first_name || 'a rider'} at ${timeDisplay} is starting soon.`,
          data: { booking_id: b.id },
        });
      }
      sent1h++;
    }
  } catch (e) {
    console.error('[reminders] 1h reminder error:', e.message);
  }

  console.log(`[reminders] Sent ${sent24h} 24h reminders and ${sent1h} 1h reminders.`);
  return { sent24h, sent1h };
};

// ──────────────────────────────────────────────────
// Part B: Waitlist
// ──────────────────────────────────────────────────

/**
 * Promote the next waitlisted rider when a booking is cancelled.
 */
export const promoteFromWaitlist = async ({ coachId, stableId, bookingDate, startTime }) => {
  if (!coachId && !stableId) return null;

  const where = {
    status: 'waitlisted',
    booking_date: bookingDate,
    start_time: startTime,
  };
  if (coachId) where.coach_id = coachId;
  if (stableId) where.stable_id = stableId;

  const nextWaitlisted = await LessonBooking.findOne({
    where,
    order: [['waitlist_position', 'ASC'], ['created_at', 'ASC']],
  });

  if (!nextWaitlisted) return null;

  let newStatus = 'pending_review';
  if (nextWaitlisted.coach_id) {
    const coach = await User.findByPk(nextWaitlisted.coach_id, { attributes: ['approval_mode'] });
    if (coach?.approval_mode === 'auto') newStatus = 'confirmed';
  }

  nextWaitlisted.status = newStatus;
  nextWaitlisted.waitlist_position = null;
  await nextWaitlisted.save();

  await createNotification({
    userId: nextWaitlisted.rider_id,
    type: 'booking_approved',
    title: 'You\'re off the waitlist!',
    body: `A spot opened up for your session on ${bookingDate}. Your booking is now ${newStatus === 'confirmed' ? 'confirmed' : 'under review'}.`,
    data: { booking_id: nextWaitlisted.id },
  });

  return nextWaitlisted;
};

// ──────────────────────────────────────────────────
// Part C: Series (Multi-Session) Booking
// ──────────────────────────────────────────────────

/**
 * Create bookings for multiple dates in one transaction.
 */
export const createSeriesBooking = async ({
  riderId, coachId, stableId, dates, startTime, endTime,
  lessonType, price, notes, bookingType, durationMinutes, horseAssignment, horseId,
}) => {
  if (!dates || !Array.isArray(dates) || dates.length === 0) {
    throw new Error('dates array is required for series booking.');
  }
  if (dates.length > 52) {
    throw new Error('Maximum 52 sessions per series.');
  }

  if (!stableId && coachId) {
    stableId = await resolveStableForCoach(coachId);
  }
  if (!stableId) throw new Error('stableId is required.');

  let initialStatus = 'pending_review';
  if (coachId) {
    const coach = await User.findByPk(coachId, { attributes: ['approval_mode'] });
    if (coach?.approval_mode === 'auto') initialStatus = 'confirmed';
  }

  const seriesId = `SER_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  // ── Wrap all conflict checks + creates in a single transaction with row locks ──
  const bookings = await sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.REPEATABLE_READ },
    async (t) => {
      const lockOpts = { transaction: t, lock: t.LOCK.UPDATE };
      const activeStatuses = ['pending_review', 'pending_horse_approval', 'pending_payment', 'confirmed', 'in_progress'];

      const overlapWhere = (extraFields, date) => ({
        ...extraFields,
        booking_date: date,
        status: { [Op.in]: activeStatuses },
        [Op.or]: [{ start_time: { [Op.lt]: endTime }, end_time: { [Op.gt]: startTime } }],
      });

      const created = [];
      for (const date of dates) {
        // Rider conflict check with row lock
        const riderConflict = await LessonBooking.findOne({
          where: overlapWhere({ rider_id: riderId }, date),
          ...lockOpts,
        });
        if (riderConflict) throw new Error(`You already have a booking on ${date} during this time.`);

        // Coach conflict check with row lock
        if (coachId) {
          const coachConflict = await LessonBooking.findOne({
            where: overlapWhere({ coach_id: coachId }, date),
            ...lockOpts,
          });
          if (coachConflict) throw new Error(`Coach is already booked on ${date} during this time.`);
        }

        // Horse conflict check with row lock
        if (horseId) {
          const horseConflict = await LessonBooking.findOne({
            where: overlapWhere({ horse_id: horseId }, date),
            ...lockOpts,
          });
          if (horseConflict) throw new Error(`Horse is already booked on ${date} during this time.`);
        }

        const booking = await LessonBooking.create({
          rider_id: riderId,
          coach_id: coachId || null,
          stable_id: stableId,
          booking_date: date,
          start_time: startTime,
          end_time: endTime,
          lesson_type: lessonType || 'private',
          status: initialStatus,
          price: price || null,
          notes: notes || null,
          booking_type: bookingType || 'lesson',
          duration_minutes: durationMinutes || null,
          horse_assignment: horseAssignment || 'stable_assigns',
          horse_id: horseId || null,
          series_id: seriesId,
        }, { transaction: t });
        created.push(booking);
      }

      return created;
    }
  );

  // Notifications sent outside the transaction
  if (coachId) {
    const rider = await User.findByPk(riderId, { attributes: ['first_name'] });
    await createNotification({
      userId: coachId,
      type: 'lesson_booked',
      title: `New Series Booking (${dates.length} sessions)`,
      body: `${rider?.first_name || 'A rider'} booked ${dates.length} sessions starting ${dates[0]}.`,
      data: { series_id: seriesId, session_count: dates.length },
    });
  }

  return { series_id: seriesId, bookings, count: bookings.length };
};

// ──────────────────────────────────────────────────
// Part D: Rider Eligibility
// ──────────────────────────────────────────────────

const LEVEL_ORDER = { beginner: 1, intermediate: 2, advanced: 3 };

export const validateRiderEligibility = (riderLevel, requiredLevel) => {
  if (!requiredLevel) return true;
  if (!riderLevel) return false;
  return (LEVEL_ORDER[riderLevel] || 0) >= (LEVEL_ORDER[requiredLevel] || 0);
};

// ──────────────────────────────────────────────────
// Part E: Horse Workload
// ──────────────────────────────────────────────────

export const checkHorseWorkload = async (horseId, bookingDate, startTime) => {
  const horse = await Horse.findByPk(horseId);
  if (!horse) return { available: false, reason: 'Horse not found.' };
  if (horse.status !== 'available') return { available: false, reason: `Horse is currently ${horse.status}.` };

  if (horse.last_session_end && horse.min_rest_hours > 0) {
    const lastEnd = new Date(horse.last_session_end);
    const bookingStart = new Date(`${bookingDate}T${startTime}`);
    const hoursSince = (bookingStart - lastEnd) / (1000 * 60 * 60);
    if (hoursSince < horse.min_rest_hours) {
      return { available: false, reason: `Horse needs ${horse.min_rest_hours}h rest between sessions.` };
    }
  }

  const dailyAvail = await HorseAvailability.findOne({ where: { horse_id: horseId, date: bookingDate } });
  if (dailyAvail && dailyAvail.sessions_booked >= (dailyAvail.max_sessions_per_day || horse.max_daily_sessions)) {
    return { available: false, reason: `Horse has reached daily session limit.` };
  }

  const weekStart = new Date(`${bookingDate}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const activeStatuses = ['pending_review', 'pending_horse_approval', 'pending_payment', 'confirmed', 'in_progress'];
  const weeklyCount = await LessonBooking.count({
    where: {
      horse_id: horseId,
      booking_date: { [Op.between]: [weekStart.toISOString().slice(0, 10), weekEnd.toISOString().slice(0, 10)] },
      status: { [Op.in]: activeStatuses },
    },
  });
  if (weeklyCount >= horse.max_weekly_sessions) {
    return { available: false, reason: `Horse has reached weekly session limit.` };
  }

  return { available: true };
};

export const getHorseWorkloadReport = async (horseId, startDate, endDate) => {
  const horse = await Horse.findByPk(horseId);
  if (!horse) throw new Error('Horse not found.');

  const bookings = await LessonBooking.count({
    where: {
      horse_id: horseId,
      booking_date: { [Op.between]: [startDate, endDate] },
      status: { [Op.in]: ['confirmed', 'in_progress', 'completed'] },
    },
  });

  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)));
  const weeks = Math.max(1, days / 7);
  const avgPerWeek = bookings / weeks;
  const utilizationPercent = Math.round((avgPerWeek / horse.max_weekly_sessions) * 100);

  return {
    horse: { id: horse.id, name: horse.name, status: horse.status },
    totalSessions: bookings,
    avgPerWeek: Math.round(avgPerWeek * 10) / 10,
    maxWeekly: horse.max_weekly_sessions,
    maxDaily: horse.max_daily_sessions,
    minRestHours: horse.min_rest_hours,
    utilizationPercent,
    level: utilizationPercent > 80 ? 'high' : utilizationPercent > 50 ? 'medium' : 'low',
  };
};

/**
 * Mark a booking as "pay at stable" (cash/offline payment intent).
 * Booking stays pending_review — coach/admin confirms after receiving payment.
 */
export const markBookingPayAtStable = async (bookingId, riderId) => {
  const booking = await LessonBooking.findByPk(bookingId);
  if (!booking) throw Object.assign(new Error('Booking not found'), { status: 404 });
  if (booking.rider_id !== riderId) throw Object.assign(new Error('Not your booking'), { status: 403 });

  booking.payment_method = 'pay_at_stable';
  await booking.save();

  return { message: 'Payment method set to pay at stable', data: booking };
};
