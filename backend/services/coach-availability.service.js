import CoachAvailabilityException from '../models/coachAvailabilityException.model.js';
import CoachWeeklyAvailability from '../models/coachWeeklyAvailability.model.js';
import { Op } from 'sequelize';

const normalizeBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const parseTimeToMinutes = (value) => {
  if (!value) return null;
  const [hh, mm] = String(value).split(':');
  const h = Number(hh);
  const m = Number(mm);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
};

const normalizeTime = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const minutes = parseTimeToMinutes(value);
  if (minutes === null) return null;
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}:00`;
};

const normalizeNumber = (value, fallback = null) => {
  if (value === undefined || value === null || value === '') return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : NaN;
};

const validateWeeklyWindow = ({ day_of_week, start_time, end_time, slot_duration_minutes, valid_from, valid_to }) => {
  const day = normalizeNumber(day_of_week);
  const start = parseTimeToMinutes(start_time);
  const end = parseTimeToMinutes(end_time);
  const slot = normalizeNumber(slot_duration_minutes, 60);

  if (!Number.isInteger(day) || day < 1 || day > 7) {
    throw new Error('day_of_week must be between 1 and 7.');
  }
  if (start === null) {
    throw new Error('start_time must be a valid time (HH:mm:ss).');
  }
  if (end === null) {
    throw new Error('end_time must be a valid time (HH:mm:ss).');
  }
  if (end <= start) {
    throw new Error('end_time must be greater than start_time.');
  }
  if (!Number.isInteger(slot) || slot < 1) {
    throw new Error('slot_duration_minutes must be at least 1.');
  }
  if (valid_from && valid_to && valid_from > valid_to) {
    throw new Error('valid_from cannot be after valid_to.');
  }
};

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  const minDate = '0001-01-01';
  const maxDate = '9999-12-31';
  const startA = aStart || minDate;
  const endA = aEnd || maxDate;
  const startB = bStart || minDate;
  const endB = bEnd || maxDate;
  return startA <= endB && startB <= endA;
};

const ensureNoWeeklyOverlap = async ({
  coachId,
  dayOfWeek,
  startTime,
  endTime,
  validFrom,
  validTo,
  excludeId,
}) => {
  const where = { coach_id: coachId, day_of_week: dayOfWeek };
  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const existingSlots = await CoachWeeklyAvailability.findAll({ where });
  const newStart = parseTimeToMinutes(startTime);
  const newEnd = parseTimeToMinutes(endTime);

  const hasOverlap = existingSlots.some((slot) => {
    const slotStart = parseTimeToMinutes(slot.start_time);
    const slotEnd = parseTimeToMinutes(slot.end_time);
    if (slotStart === null || slotEnd === null) {
      return false;
    }

    const timeOverlap = newStart < slotEnd && newEnd > slotStart;
    if (!timeOverlap) {
      return false;
    }

    return rangesOverlap(validFrom || null, validTo || null, slot.valid_from || null, slot.valid_to || null);
  });

  if (hasOverlap) {
    throw new Error('Schedule time overlaps with an existing slot for this day.');
  }
};

const validateExceptionWindow = ({ exception_type, start_time, end_time }) => {
  if (!['available', 'unavailable'].includes(exception_type)) {
    throw new Error("exception_type must be 'available' or 'unavailable'.");
  }

  const hasStart = start_time !== undefined && start_time !== null && start_time !== '';
  const hasEnd = end_time !== undefined && end_time !== null && end_time !== '';

  if (!hasStart && !hasEnd) {
    return;
  }

  if (!hasStart || !hasEnd) {
    throw new Error('Both start_time and end_time are required for partial-day exception.');
  }

  const start = parseTimeToMinutes(start_time);
  const end = parseTimeToMinutes(end_time);

  if (start === null) {
    throw new Error('start_time must be a valid time (HH:mm:ss).');
  }
  if (end === null) {
    throw new Error('end_time must be a valid time (HH:mm:ss).');
  }
  if (end <= start) {
    throw new Error('end_time must be greater than start_time.');
  }
};

export const createWeeklyAvailability = async (coachId, payload) => {
  validateWeeklyWindow(payload);

  const day = normalizeNumber(payload.day_of_week);
  const start = normalizeTime(payload.start_time);
  const end = normalizeTime(payload.end_time);
  const validFrom = payload.valid_from || null;
  const validTo = payload.valid_to || null;

  await ensureNoWeeklyOverlap({
    coachId,
    dayOfWeek: day,
    startTime: start,
    endTime: end,
    validFrom,
    validTo,
  });

  return CoachWeeklyAvailability.create({
    coach_id: coachId,
    day_of_week: day,
    start_time: start,
    end_time: end,
    slot_duration_minutes: normalizeNumber(payload.slot_duration_minutes, 60),
    is_active: normalizeBoolean(payload.is_active, true),
    valid_from: validFrom,
    valid_to: validTo,
  });
};

export const getWeeklyAvailability = async (coachId, { include_inactive } = {}) => {
  const where = { coach_id: coachId };
  if (!include_inactive) {
    where.is_active = true;
  }

  return CoachWeeklyAvailability.findAll({
    where,
    order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
  });
};

export const updateWeeklyAvailability = async (coachId, availabilityId, payload) => {
  const record = await CoachWeeklyAvailability.findOne({
    where: { id: availabilityId, coach_id: coachId },
  });
  if (!record) {
    throw new Error('Weekly availability record not found.');
  }

  const nextPayload = {
    day_of_week: payload.day_of_week ?? record.day_of_week,
    start_time: payload.start_time ?? record.start_time,
    end_time: payload.end_time ?? record.end_time,
    slot_duration_minutes: payload.slot_duration_minutes ?? record.slot_duration_minutes,
    valid_from: payload.valid_from ?? record.valid_from,
    valid_to: payload.valid_to ?? record.valid_to,
  };
  validateWeeklyWindow(nextPayload);

  const day = normalizeNumber(nextPayload.day_of_week);
  const start = normalizeTime(nextPayload.start_time);
  const end = normalizeTime(nextPayload.end_time);
  const validFrom = nextPayload.valid_from || null;
  const validTo = nextPayload.valid_to || null;

  await ensureNoWeeklyOverlap({
    coachId,
    dayOfWeek: day,
    startTime: start,
    endTime: end,
    validFrom,
    validTo,
    excludeId: record.id,
  });

  record.day_of_week = day;
  record.start_time = start;
  record.end_time = end;
  record.slot_duration_minutes = normalizeNumber(nextPayload.slot_duration_minutes, record.slot_duration_minutes);
  record.is_active = payload.is_active !== undefined ? normalizeBoolean(payload.is_active, record.is_active) : record.is_active;
  record.valid_from = nextPayload.valid_from || null;
  record.valid_to = nextPayload.valid_to || null;

  await record.save();
  return record;
};

export const deleteWeeklyAvailability = async (coachId, availabilityId) => {
  const record = await CoachWeeklyAvailability.findOne({
    where: { id: availabilityId, coach_id: coachId },
  });
  if (!record) {
    throw new Error('Weekly availability record not found.');
  }
  await record.destroy();
  return { message: 'Weekly availability deleted successfully.' };
};

export const createAvailabilityException = async (coachId, payload) => {
  if (!payload.exception_date) {
    throw new Error('exception_date is required.');
  }
  validateExceptionWindow(payload);

  return CoachAvailabilityException.create({
    coach_id: coachId,
    exception_date: payload.exception_date,
    exception_type: payload.exception_type || 'unavailable',
    start_time:
      payload.start_time === undefined || payload.start_time === null || payload.start_time === ''
        ? null
        : normalizeTime(payload.start_time),
    end_time:
      payload.end_time === undefined || payload.end_time === null || payload.end_time === ''
        ? null
        : normalizeTime(payload.end_time),
    note: payload.note || null,
  });
};

export const getAvailabilityExceptions = async (coachId, { from_date, to_date } = {}) => {
  const where = { coach_id: coachId };
  if (from_date) where.exception_date = { ...(where.exception_date || {}), [Op.gte]: from_date };
  if (to_date) where.exception_date = { ...(where.exception_date || {}), [Op.lte]: to_date };

  return CoachAvailabilityException.findAll({
    where,
    order: [['exception_date', 'ASC'], ['start_time', 'ASC']],
  });
};

export const updateAvailabilityException = async (coachId, exceptionId, payload) => {
  const record = await CoachAvailabilityException.findOne({
    where: { id: exceptionId, coach_id: coachId },
  });
  if (!record) {
    throw new Error('Availability exception record not found.');
  }

  const nextPayload = {
    exception_type: payload.exception_type ?? record.exception_type,
    start_time: payload.start_time ?? record.start_time,
    end_time: payload.end_time ?? record.end_time,
  };
  validateExceptionWindow(nextPayload);

  record.exception_date = payload.exception_date ?? record.exception_date;
  record.exception_type = nextPayload.exception_type;
  record.start_time =
    nextPayload.start_time === undefined || nextPayload.start_time === null || nextPayload.start_time === ''
      ? null
      : normalizeTime(nextPayload.start_time);
  record.end_time =
    nextPayload.end_time === undefined || nextPayload.end_time === null || nextPayload.end_time === ''
      ? null
      : normalizeTime(nextPayload.end_time);
  record.note = payload.note ?? record.note;

  await record.save();
  return record;
};

export const deleteAvailabilityException = async (coachId, exceptionId) => {
  const record = await CoachAvailabilityException.findOne({
    where: { id: exceptionId, coach_id: coachId },
  });
  if (!record) {
    throw new Error('Availability exception record not found.');
  }
  await record.destroy();
  return { message: 'Availability exception deleted successfully.' };
};
