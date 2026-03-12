import { Op } from 'sequelize';
import User from '../models/user.model.js';
import CourseSession from '../models/courseSession.model.js';
import CoachWeeklyAvailability from '../models/coachWeeklyAvailability.model.js';
import CoachAvailabilityException from '../models/coachAvailabilityException.model.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const toDateOnly = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const parseTimeToMinutes = (value) => {
  if (!value) return null;
  const [hh, mm] = String(value).split(':');
  const h = Number(hh);
  const m = Number(mm);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
};

const toTimeString = (minutes) => {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}:00`;
};

const getDayOfWeekOneToSeven = (dateString) => {
  const day = new Date(`${dateString}T00:00:00`).getDay();
  return day === 0 ? 7 : day;
};

const isDateInValidityRange = (dateString, validFrom, validTo) => {
  if (validFrom && dateString < String(validFrom).slice(0, 10)) return false;
  if (validTo && dateString > String(validTo).slice(0, 10)) return false;
  return true;
};

const isOverlapping = (startA, endA, startB, endB) => startA < endB && endA > startB;

const normalizeDays = (days) => {
  const parsed = Number(days);
  if (!Number.isInteger(parsed) || parsed < 1) return 7;
  return Math.min(parsed, 30);
};

export const getCoachUpcomingAvailability = async ({
  coachId,
  fromDate,
  days = 7,
}) => {
  const numericCoachId = Number(coachId);
  if (!Number.isInteger(numericCoachId) || numericCoachId <= 0) {
    throw new Error('coachId must be a valid positive integer.');
  }

  const coach = await User.findOne({
    where: { id: numericCoachId, role: 'coach' },
    attributes: ['id', 'first_name', 'last_name', 'email', 'is_active'],
  });
  if (!coach) {
    throw new Error('Coach not found.');
  }

  const safeDays = normalizeDays(days);
  const startDate = fromDate
    ? String(fromDate).trim()
    : toDateOnly(new Date());

  if (!DATE_REGEX.test(startDate)) {
    throw new Error('from_date must be in YYYY-MM-DD format.');
  }

  const start = new Date(`${startDate}T00:00:00`);
  if (Number.isNaN(start.getTime())) {
    throw new Error('Invalid from_date.');
  }

  const end = new Date(start);
  end.setDate(end.getDate() + safeDays - 1);
  const endDate = toDateOnly(end);

  const [weeklyRows, exceptionRows, bookedRows] = await Promise.all([
    CoachWeeklyAvailability.findAll({
      where: {
        coach_id: numericCoachId,
        is_active: true,
        [Op.and]: [
          {
            [Op.or]: [{ valid_from: null }, { valid_from: { [Op.lte]: endDate } }],
          },
          {
            [Op.or]: [{ valid_to: null }, { valid_to: { [Op.gte]: startDate } }],
          },
        ],
      },
      order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
    }),
    CoachAvailabilityException.findAll({
      where: {
        coach_id: numericCoachId,
        exception_type: 'unavailable',
        exception_date: { [Op.between]: [startDate, endDate] },
      },
      order: [['exception_date', 'ASC'], ['start_time', 'ASC']],
    }),
    CourseSession.findAll({
      where: {
        coach_id: numericCoachId,
        session_date: { [Op.between]: [startDate, endDate] },
        status: { [Op.ne]: 'cancelled' },
      },
      attributes: ['id', 'session_date', 'start_time', 'end_time', 'status', 'course_id', 'rider_id'],
      order: [['session_date', 'ASC'], ['start_time', 'ASC']],
    }),
  ]);

  const exceptionsByDate = new Map();
  for (const row of exceptionRows) {
    const dateKey = String(row.exception_date).slice(0, 10);
    const bucket = exceptionsByDate.get(dateKey) || [];
    bucket.push(row);
    exceptionsByDate.set(dateKey, bucket);
  }

  const bookingsByDate = new Map();
  for (const row of bookedRows) {
    const dateKey = String(row.session_date).slice(0, 10);
    const bucket = bookingsByDate.get(dateKey) || [];
    bucket.push({
      id: row.id,
      course_id: row.course_id,
      rider_id: row.rider_id,
      status: row.status,
      startMinute: parseTimeToMinutes(row.start_time),
      endMinute: parseTimeToMinutes(row.end_time),
    });
    bookingsByDate.set(dateKey, bucket);
  }

  const now = new Date();
  const todayKey = toDateOnly(now);
  const nowMinute = now.getHours() * 60 + now.getMinutes();

  const schedule = [];

  for (let offset = 0; offset < safeDays; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const dateString = toDateOnly(date);
    const dayOfWeek = getDayOfWeekOneToSeven(dateString);

    const weeklyForDay = weeklyRows.filter((row) => {
      if (Number(row.day_of_week) !== dayOfWeek) return false;
      return isDateInValidityRange(dateString, row.valid_from, row.valid_to);
    });

    const dayExceptions = exceptionsByDate.get(dateString) || [];
    const hasFullDayBlock = dayExceptions.some((row) => !row.start_time && !row.end_time);
    const dayBookings = (bookingsByDate.get(dateString) || []).filter(
      (slot) => Number.isInteger(slot.startMinute) && Number.isInteger(slot.endMinute)
    );

    const daySlots = [];

    if (!hasFullDayBlock) {
      for (const weekly of weeklyForDay) {
        const windowStart = parseTimeToMinutes(weekly.start_time);
        const windowEnd = parseTimeToMinutes(weekly.end_time);
        const duration = Number(weekly.slot_duration_minutes) || 60;

        if (
          windowStart === null ||
          windowEnd === null ||
          !Number.isInteger(duration) ||
          duration <= 0 ||
          windowEnd <= windowStart
        ) {
          continue;
        }

        for (let cursor = windowStart; cursor + duration <= windowEnd; cursor += duration) {
          const slotStart = cursor;
          const slotEnd = cursor + duration;

          if (dateString === todayKey && slotStart <= nowMinute) {
            continue;
          }

          const blockedByException = dayExceptions.some((row) => {
            if (!row.start_time || !row.end_time) return false;
            const blockStart = parseTimeToMinutes(row.start_time);
            const blockEnd = parseTimeToMinutes(row.end_time);
            if (blockStart === null || blockEnd === null) return false;
            return isOverlapping(slotStart, slotEnd, blockStart, blockEnd);
          });
          if (blockedByException) {
            continue;
          }

          const blockedByBooking = dayBookings.some((booking) =>
            isOverlapping(slotStart, slotEnd, booking.startMinute, booking.endMinute)
          );
          if (blockedByBooking) {
            continue;
          }

          daySlots.push({
            start_time: toTimeString(slotStart),
            end_time: toTimeString(slotEnd),
            slot_duration_minutes: duration,
          });
        }
      }
    }

    schedule.push({
      date: dateString,
      day_of_week: dayOfWeek,
      slots: daySlots.sort((a, b) => parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time)),
    });
  }

  return {
    coach: {
      id: coach.id,
      first_name: coach.first_name,
      last_name: coach.last_name,
      email: coach.email,
      is_active: coach.is_active,
    },
    range: {
      from_date: startDate,
      to_date: endDate,
      days: safeDays,
    },
    schedule,
  };
};
