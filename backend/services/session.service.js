import { Op, QueryTypes } from 'sequelize';
import sequelize from '../config/database.js';
import { Course, CourseEnrollment, CourseSession, User } from '../models/index.js';

const sessionInclude = [
  {
    model: Course,
    as: 'course',
    attributes: [
      'id',
      'title',
      'course_type',
      'coach_id',
      'max_session_duration',
      'start_date',
      'end_date',
      'start_time',
      'end_time',
    ],
  },
  {
    model: User,
    as: 'coach',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
  {
    model: User,
    as: 'rider',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
  {
    model: User,
    as: 'created_by_user',
    attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
  },
  {
    model: User,
    as: 'cancelled_by_user',
    attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
  },
];

const normalizePagination = ({ page, limit }) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;
  return { page: safePage, limit: safeLimit };
};

const buildPaginationMeta = ({ page, limit, totalItems }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

const parseTimeToMinutes = (timeValue) => {
  if (!timeValue) return null;
  const [hh, mm] = String(timeValue).split(':');
  const h = Number(hh);
  const m = Number(mm);
  if (!Number.isInteger(h) || !Number.isInteger(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    return null;
  }
  return h * 60 + m;
};

const toTimeValue = (timeValue) => {
  if (!timeValue) return null;
  const raw = String(timeValue);
  const normalized = raw.length === 5 ? `${raw}:00` : raw;
  const minutes = parseTimeToMinutes(normalized);
  if (minutes === null) {
    return null;
  }
  return normalized;
};

const getDayOfWeekOneToSeven = (dateStr) => {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 ? 7 : day;
};

const todayDateString = () => new Date().toISOString().slice(0, 10);

const isOverlapping = (startA, endA, startB, endB) => startA < endB && endA > startB;
const isWithinRange = (startA, endA, startB, endB) => startA >= startB && endA <= endB;

const isUpcomingSession = ({ session_date, start_time }) => {
  const now = new Date();
  const datePart = String(session_date || '').slice(0, 10);
  const timePart = String(start_time || '').length === 5 ? `${start_time}:00` : String(start_time);
  const sessionStart = new Date(`${datePart}T${timePart}`);
  return !Number.isNaN(sessionStart.getTime()) && sessionStart > now;
};

const assertCanManageSession = ({ user, course }) => {
  const isAdmin = user?.type === 'admin';
  const isCourseCoach = user?.role === 'coach' && Number(course.coach_id) === Number(user.id);
  if (!isAdmin && !isCourseCoach) {
    throw new Error('Access denied.');
  }
};

const assertCanCancelSession = ({ user, course, session }) => {
  const isAdmin = user?.type === 'admin';
  const isCourseCoach = user?.role === 'coach' && Number(course.coach_id) === Number(user.id);
  const isSessionRider = user?.role === 'rider' && Number(session.rider_id) === Number(user.id);
  if (!isAdmin && !isCourseCoach && !isSessionRider) {
    throw new Error('Access denied.');
  }
};

const ensureActiveEnrollment = async (courseId, riderId) => {
  const enrollment = await CourseEnrollment.findOne({
    where: {
      course_id: courseId,
      rider_id: riderId,
      status: 'active',
    },
  });
  if (!enrollment) {
    throw new Error('Selected rider must be actively enrolled in this course.');
  }
};

const validateCourseSessionWindow = (course, sessionDate, startMinute, endMinute) => {
  if (course.start_date && sessionDate < course.start_date) {
    throw new Error('Session date is before course start_date.');
  }
  if (course.end_date && sessionDate > course.end_date) {
    throw new Error('Session date is after course end_date.');
  }
  if (course.start_time) {
    const courseStart = parseTimeToMinutes(course.start_time);
    if (courseStart !== null && startMinute < courseStart) {
      throw new Error('Session start_time is before course start_time.');
    }
  }
  if (course.end_time) {
    const courseEnd = parseTimeToMinutes(course.end_time);
    if (courseEnd !== null && endMinute > courseEnd) {
      throw new Error('Session end_time is after course end_time.');
    }
  }
};

const ensureCoachAndRiderNoOverlap = async ({
  coachId,
  riderId,
  sessionDate,
  startTime,
  endTime,
  excludeSessionId,
}) => {
  const baseWhere = {
    session_date: sessionDate,
    status: { [Op.ne]: 'cancelled' },
    start_time: { [Op.lt]: endTime },
    end_time: { [Op.gt]: startTime },
  };

  const whereCoach = { ...baseWhere, coach_id: coachId };
  if (excludeSessionId) {
    whereCoach.id = { [Op.ne]: excludeSessionId };
  }
  const hasCoachOverlap = await CourseSession.findOne({ where: whereCoach });
  if (hasCoachOverlap) {
    throw new Error('Coach already has another session in this time range.');
  }

  if (!riderId) {
    return;
  }
  const whereRider = { ...baseWhere, rider_id: riderId };
  if (excludeSessionId) {
    whereRider.id = { [Op.ne]: excludeSessionId };
  }
  const hasRiderOverlap = await CourseSession.findOne({ where: whereRider });
  if (hasRiderOverlap) {
    throw new Error('Rider already has another session in this time range.');
  }
};

const isInsideCoachAvailability = async ({ coachId, sessionDate, startMinute, endMinute }) => {
  const dayOfWeek = getDayOfWeekOneToSeven(sessionDate);

  const weeklyWindows = await sequelize.query(
    `
      SELECT start_time, end_time
      FROM coach_weekly_availability
      WHERE coach_id = :coachId
        AND day_of_week = :dayOfWeek
        AND is_active = TRUE
        AND (valid_from IS NULL OR valid_from <= :sessionDate)
        AND (valid_to IS NULL OR valid_to >= :sessionDate)
    `,
    {
      replacements: { coachId, dayOfWeek, sessionDate },
      type: QueryTypes.SELECT,
    }
  );

  const availableExceptions = await sequelize.query(
    `
      SELECT start_time, end_time
      FROM coach_availability_exceptions
      WHERE coach_id = :coachId
        AND exception_date = :sessionDate
        AND exception_type = 'available'
        AND start_time IS NOT NULL
        AND end_time IS NOT NULL
    `,
    {
      replacements: { coachId, sessionDate },
      type: QueryTypes.SELECT,
    }
  );

  const blockedExceptions = await sequelize.query(
    `
      SELECT start_time, end_time
      FROM coach_availability_exceptions
      WHERE coach_id = :coachId
        AND exception_date = :sessionDate
        AND exception_type = 'unavailable'
    `,
    {
      replacements: { coachId, sessionDate },
      type: QueryTypes.SELECT,
    }
  );

  const hasFullDayBlock = blockedExceptions.some((x) => x.start_time === null && x.end_time === null);
  if (hasFullDayBlock) {
    return false;
  }

  const blockedOverlap = blockedExceptions.some((x) => {
    if (x.start_time === null || x.end_time === null) return false;
    const blockStart = parseTimeToMinutes(x.start_time);
    const blockEnd = parseTimeToMinutes(x.end_time);
    if (blockStart === null || blockEnd === null) return false;
    return isOverlapping(startMinute, endMinute, blockStart, blockEnd);
  });
  if (blockedOverlap) {
    return false;
  }

  const inWeekly = weeklyWindows.some((w) => {
    const windowStart = parseTimeToMinutes(w.start_time);
    const windowEnd = parseTimeToMinutes(w.end_time);
    if (windowStart === null || windowEnd === null) return false;
    return isWithinRange(startMinute, endMinute, windowStart, windowEnd);
  });
  const inAvailableException = availableExceptions.some((w) => {
    const windowStart = parseTimeToMinutes(w.start_time);
    const windowEnd = parseTimeToMinutes(w.end_time);
    if (windowStart === null || windowEnd === null) return false;
    return isWithinRange(startMinute, endMinute, windowStart, windowEnd);
  });

  return inWeekly || inAvailableException;
};

const buildCreateContext = async ({ user, payload }) => {
  const { course_id, session_date } = payload;
  const startTime = toTimeValue(payload.start_time);
  const endTime = toTimeValue(payload.end_time);
  const riderIdFromPayload = payload.rider_id ? Number(payload.rider_id) : null;

  if (!course_id || !session_date || !startTime || !endTime) {
    throw new Error('course_id, session_date, start_time, and end_time are required.');
  }

  const course = await Course.findByPk(course_id);
  if (!course || !course.is_active) {
    throw new Error('Course not found.');
  }

  const coach = await User.findByPk(course.coach_id);
  if (!coach || coach.role !== 'coach' || !coach.is_active) {
    throw new Error('Course coach is not active.');
  }

  const startMinute = parseTimeToMinutes(startTime);
  const endMinute = parseTimeToMinutes(endTime);
  if (startMinute === null || endMinute === null || endMinute <= startMinute) {
    throw new Error('Invalid start_time or end_time.');
  }

  const durationMinutes = endMinute - startMinute;
  if (course.max_session_duration && durationMinutes > course.max_session_duration) {
    throw new Error('Session duration exceeds course max_session_duration.');
  }

  validateCourseSessionWindow(course, session_date, startMinute, endMinute);

  if (session_date < todayDateString()) {
    throw new Error('Session cannot be created in the past.');
  }

  if (course.total_sessions) {
    const existingCount = await CourseSession.count({
      where: {
        course_id,
        status: { [Op.ne]: 'cancelled' },
      },
    });
    if (existingCount >= course.total_sessions) {
      throw new Error('Total session limit for this course is reached.');
    }
  }

  const isAvailable = await isInsideCoachAvailability({
    coachId: course.coach_id,
    sessionDate: session_date,
    startMinute,
    endMinute,
  });
  if (!isAvailable) {
    throw new Error('Requested slot is outside coach availability.');
  }

  let riderId = null;
  const isAdmin = user?.type === 'admin';
  const isCourseCoach = user?.role === 'coach' && Number(user.id) === Number(course.coach_id);
  const isRider = user?.role === 'rider';

  if (course.course_type === 'group') {
    if (!isAdmin && !isCourseCoach) {
      throw new Error('Only admin or course coach can create group sessions.');
    }
  } else if (course.course_type === 'one_to_one') {
    if (isRider) {
      riderId = Number(user.id);
      await ensureActiveEnrollment(course.id, riderId);
    } else if (isAdmin || isCourseCoach) {
      if (!Number.isInteger(riderIdFromPayload) || riderIdFromPayload <= 0) {
        throw new Error('rider_id is required for one_to_one session.');
      }
      const rider = await User.findByPk(riderIdFromPayload);
      if (!rider || rider.role !== 'rider' || !rider.is_active) {
        throw new Error('Invalid rider.');
      }
      await ensureActiveEnrollment(course.id, riderIdFromPayload);
      riderId = riderIdFromPayload;
    } else {
      throw new Error('Access denied.');
    }
  } else {
    throw new Error('Invalid course_type.');
  }

  await ensureCoachAndRiderNoOverlap({
    coachId: course.coach_id,
    riderId,
    sessionDate: session_date,
    startTime,
    endTime,
  });

  return {
    course,
    startTime,
    endTime,
    sessionDate: session_date,
    durationMinutes,
    riderId,
  };
};

export const createCourseSession = async ({ user, payload }) => {
  const context = await buildCreateContext({ user, payload });
  const created = await CourseSession.create({
    course_id: context.course.id,
    coach_id: context.course.coach_id,
    rider_id: context.riderId,
    created_by_user_id: user.id,
    session_date: context.sessionDate,
    start_time: context.startTime,
    end_time: context.endTime,
    duration_minutes: context.durationMinutes,
    status: 'scheduled',
    cancel_reason: null,
    cancelled_by_user_id: null,
  });
  return CourseSession.findByPk(created.id, { include: sessionInclude });
};

const getSessionForManage = async ({ user, sessionId }) => {
  const session = await CourseSession.findByPk(sessionId, {
    include: [{ model: Course, as: 'course' }],
  });
  if (!session) {
    throw new Error('Session not found.');
  }
  assertCanManageSession({ user, course: session.course });
  if (session.status !== 'scheduled') {
    throw new Error('Only scheduled sessions can be modified.');
  }
  if (!isUpcomingSession({ session_date: session.session_date, start_time: session.start_time })) {
    throw new Error('Only upcoming sessions can be modified.');
  }
  return session;
};

export const updateCourseSession = async ({ user, sessionId, payload }) => {
  const session = await getSessionForManage({ user, sessionId });

  const startTime = toTimeValue(payload.start_time || session.start_time);
  const endTime = toTimeValue(payload.end_time || session.end_time);
  const sessionDate = payload.session_date || session.session_date;

  if (!startTime || !endTime || !sessionDate) {
    throw new Error('session_date, start_time, and end_time are required.');
  }

  const course = await Course.findByPk(session.course_id);
  if (!course || !course.is_active) {
    throw new Error('Course not found.');
  }

  const startMinute = parseTimeToMinutes(startTime);
  const endMinute = parseTimeToMinutes(endTime);
  if (startMinute === null || endMinute === null || endMinute <= startMinute) {
    throw new Error('Invalid start_time or end_time.');
  }
  const durationMinutes = endMinute - startMinute;
  if (course.max_session_duration && durationMinutes > course.max_session_duration) {
    throw new Error('Session duration exceeds course max_session_duration.');
  }
  validateCourseSessionWindow(course, sessionDate, startMinute, endMinute);

  if (!isUpcomingSession({ session_date: sessionDate, start_time: startTime })) {
    throw new Error('Only upcoming sessions can be modified.');
  }

  const isAvailable = await isInsideCoachAvailability({
    coachId: course.coach_id,
    sessionDate,
    startMinute,
    endMinute,
  });
  if (!isAvailable) {
    throw new Error('Requested slot is outside coach availability.');
  }

  await ensureCoachAndRiderNoOverlap({
    coachId: course.coach_id,
    riderId: session.rider_id,
    sessionDate,
    startTime,
    endTime,
    excludeSessionId: session.id,
  });

  session.session_date = sessionDate;
  session.start_time = startTime;
  session.end_time = endTime;
  session.duration_minutes = durationMinutes;
  await session.save();

  return CourseSession.findByPk(session.id, { include: sessionInclude });
};

export const cancelCourseSession = async ({ user, sessionId, cancelReason }) => {
  const session = await CourseSession.findByPk(sessionId, {
    include: [{ model: Course, as: 'course' }],
  });
  if (!session) {
    throw new Error('Session not found.');
  }
  assertCanCancelSession({ user, course: session.course, session });
  if (session.status !== 'scheduled') {
    throw new Error('Only scheduled sessions can be modified.');
  }
  if (!isUpcomingSession({ session_date: session.session_date, start_time: session.start_time })) {
    throw new Error('Only upcoming sessions can be modified.');
  }
  const reason = String(cancelReason || '').trim();
  if (reason.length < 3 || reason.length > 255) {
    throw new Error('cancel_reason must be between 3 and 255 characters.');
  }
  session.status = 'cancelled';
  session.cancel_reason = reason;
  session.cancelled_by_user_id = user.id;
  await session.save();
  return CourseSession.findByPk(session.id, { include: sessionInclude });
};

export const getMySessions = async ({ user, pagination = {} }) => {
  const { page, limit } = normalizePagination(pagination);
  const offset = (page - 1) * limit;

  if (user.role === 'coach') {
    const where = { coach_id: user.id };
    const totalItems = await CourseSession.count({ where });
    const sessions = await CourseSession.findAll({
      where,
      include: sessionInclude,
      order: [['session_date', 'DESC'], ['start_time', 'DESC']],
      offset,
      limit,
    });
    return { sessions, pagination: buildPaginationMeta({ page, limit, totalItems }) };
  }

  if (user.role === 'rider') {
    const enrollments = await CourseEnrollment.findAll({
      where: { rider_id: user.id, status: 'active' },
      attributes: ['course_id'],
    });
    const enrolledCourseIds = enrollments.map((e) => e.course_id);
    const where = {
      [Op.or]: [
        { rider_id: user.id },
        {
          [Op.and]: [
            { course_id: { [Op.in]: enrolledCourseIds.length ? enrolledCourseIds : [0] } },
            { rider_id: null },
          ],
        },
      ],
    };
    const totalItems = await CourseSession.count({ where });
    const sessions = await CourseSession.findAll({
      where,
      include: sessionInclude,
      order: [['session_date', 'DESC'], ['start_time', 'DESC']],
      offset,
      limit,
    });
    return { sessions, pagination: buildPaginationMeta({ page, limit, totalItems }) };
  }

  if (user.type === 'admin') {
    const totalItems = await CourseSession.count();
    const sessions = await CourseSession.findAll({
      include: sessionInclude,
      order: [['session_date', 'DESC'], ['start_time', 'DESC']],
      offset,
      limit,
    });
    return { sessions, pagination: buildPaginationMeta({ page, limit, totalItems }) };
  }

  return { sessions: [], pagination: buildPaginationMeta({ page, limit, totalItems: 0 }) };
};

export const getCourseSessions = async ({ user, courseId, pagination = {}, filters = {} }) => {
  const { page, limit } = normalizePagination(pagination);
  const offset = (page - 1) * limit;

  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new Error('Course not found.');
  }

  const isAdmin = user.type === 'admin';
  const isCoachOwner = user.role === 'coach' && course.coach_id === user.id;
  const isEnrolledRider =
    user.role === 'rider' &&
    (await CourseEnrollment.findOne({
      where: { course_id: courseId, rider_id: user.id, status: 'active' },
    }));

  if (!isAdmin && !isCoachOwner && !isEnrolledRider) {
    throw new Error('Access denied.');
  }

  const where = { course_id: courseId };
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.rider_id !== undefined && filters.rider_id !== null) {
    where.rider_id = filters.rider_id;
  }

  const totalItems = await CourseSession.count({ where });
  const sessions = await CourseSession.findAll({
    where,
    include: sessionInclude,
    order: [['session_date', 'DESC'], ['start_time', 'DESC']],
    offset,
    limit,
  });

  return { sessions, pagination: buildPaginationMeta({ page, limit, totalItems }) };
};
