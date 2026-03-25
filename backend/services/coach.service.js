import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { Course, CourseSession, LessonBooking, User } from '../models/index.js';
import CoachStable from '../models/coachStable.model.js';
import Stable from '../models/stable.model.js';
import CoachWeeklyAvailability from '../models/coachWeeklyAvailability.model.js';
import { getCoachReviewSummary, getCoachReviewSummaryMap, getCoachReviews } from './coach-review.service.js';
import {
  createWeeklyAvailability,
  deleteWeeklyAvailability,
  getWeeklyAvailability,
  updateWeeklyAvailability,
} from './coach-availability.service.js';

const publicCoachFields = [
  'id',
  'email',
  'mobile_number',
  'role',
  'first_name',
  'last_name',
  'city',
  'state',
  'country',
  'pincode',
  'date_of_birth',
  'gender',
  'profile_picture_url',
  'coach_type',
  'specialties',
  'bio',
  'is_featured',
  'is_verified',
  'is_email_verified',
  'is_active',
  'created_at',
];

const toBoolean = (value, fallback = true) => {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const allowedGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
const normalizeGender = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toLowerCase();
  if (!allowedGenders.includes(normalized)) {
    throw new Error(`gender must be one of: ${allowedGenders.join(', ')}.`);
  }
  return normalized;
};

export const createCoach = async ({
  email,
  password,
  mobile_number,
  first_name,
  last_name,
  city,
  state,
  country,
  pincode,
  date_of_birth,
  gender,
  is_active,
}) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new Error('Email already exists.');
  }

  const password_hash = await bcrypt.hash(password, 10);

  const coach = await User.create({
    email,
    mobile_number: mobile_number || null,
    password_hash,
    role: 'coach',
    first_name: first_name || null,
    last_name: last_name || null,
    city: city || null,
    state: state || null,
    country: country || null,
    pincode: pincode || null,
    date_of_birth: date_of_birth || null,
    gender: normalizeGender(gender),
    is_email_verified: true,
    is_active: toBoolean(is_active, true),
  });

  const safeCoach = await User.findByPk(coach.id, { attributes: publicCoachFields });
  return {
    message: 'Coach created successfully.',
    coach: safeCoach,
  };
};

export const getAllCoaches = async ({ include_inactive, search, page, limit, featured } = {}) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;
  const where = { role: 'coach' };
  if (!include_inactive) {
    where.is_active = true;
  }
  if (featured) {
    where.is_featured = true;
  }
  const keyword = String(search || '').trim();
  if (keyword) {
    where[Op.or] = [
      { email: { [Op.like]: `%${keyword}%` } },
      { mobile_number: { [Op.like]: `%${keyword}%` } },
      { first_name: { [Op.like]: `%${keyword}%` } },
      { last_name: { [Op.like]: `%${keyword}%` } },
      { city: { [Op.like]: `%${keyword}%` } },
      { state: { [Op.like]: `%${keyword}%` } },
      { country: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: publicCoachFields,
    order: [['id', 'DESC']],
    offset,
    limit: pagination.limit,
  });
  const coachIds = rows.map((item) => Number(item.id));
  const reviewSummaryMap = await getCoachReviewSummaryMap(coachIds);

  // Fetch stable associations for all coaches in this page
  const stableLinks = coachIds.length > 0
    ? await CoachStable.findAll({
        where: { coach_id: { [Op.in]: coachIds }, is_active: true },
        include: [{ model: Stable, as: 'stable', attributes: ['id', 'name'] }],
      })
    : [];
  const stableMap = new Map();
  for (const link of stableLinks) {
    const cId = Number(link.coach_id);
    if (!stableMap.has(cId)) stableMap.set(cId, []);
    stableMap.get(cId).push({
      stable_id: link.stable_id,
      stable_name: link.stable?.name || null,
      is_primary: link.is_primary,
    });
  }

  const meta = buildPaginationMeta({
    page: pagination.page,
    limit: pagination.limit,
    totalItems: count,
  });

  return {
    data: rows.map((coach) => {
      const summary = reviewSummaryMap.get(Number(coach.id)) || { average_rating: 0, total_reviews: 0 };
      const stables = stableMap.get(Number(coach.id)) || [];
      const primaryStable = stables.find((s) => s.is_primary) || stables[0] || null;
      return {
        ...coach.toJSON(),
        average_rating: summary.average_rating,
        total_reviews: summary.total_reviews,
        stables,
        primary_stable_id: primaryStable?.stable_id || null,
        primary_stable_name: primaryStable?.stable_name || null,
      };
    }),
    pagination: {
      ...meta,
      totalRecords: meta.totalItems,
      currentPage: meta.page,
      nextPage: meta.hasNext ? meta.page + 1 : null,
    },
  };
};

export const getCoachById = async (coachId) => {
  const coach = await User.findOne({
    where: { id: coachId, role: 'coach' },
    attributes: publicCoachFields,
  });

  if (!coach) {
    throw new Error('Coach not found.');
  }

  return coach;
};

export const updateCoach = async (coachId, payload) => {
  const coach = await User.findOne({ where: { id: coachId, role: 'coach' } });
  if (!coach) {
    throw new Error('Coach not found.');
  }

  if (payload.email && payload.email !== coach.email) {
    const existingUser = await User.findOne({ where: { email: payload.email } });
    if (existingUser) {
      throw new Error('Email already exists.');
    }
  }

  coach.email = payload.email ?? coach.email;
  coach.mobile_number = payload.mobile_number ?? coach.mobile_number;
  coach.first_name = payload.first_name ?? coach.first_name;
  coach.last_name = payload.last_name ?? coach.last_name;
  coach.city = payload.city ?? coach.city;
  coach.state = payload.state ?? coach.state;
  coach.country = payload.country ?? coach.country;
  coach.pincode = payload.pincode ?? coach.pincode;
  coach.date_of_birth = payload.date_of_birth ?? coach.date_of_birth;
  if (payload.gender !== undefined) {
    coach.gender = normalizeGender(payload.gender);
  }
  coach.is_featured = toBoolean(payload.is_featured, coach.is_featured);
  coach.is_active = toBoolean(payload.is_active, coach.is_active);
  await coach.save();

  return User.findByPk(coach.id, { attributes: publicCoachFields });
};

const normalizePagination = ({ page, limit }) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit = Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;
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

const ensureCoachExists = async (coachId) => {
  const coach = await User.findOne({
    where: { id: coachId, role: 'coach' },
    attributes: publicCoachFields,
  });
  if (!coach) {
    throw new Error('Coach not found.');
  }
  return coach;
};

export const getCoachDetails = async (coachId, pagination = {}) => {
  const coach = await ensureCoachExists(coachId);
  const { page, limit } = normalizePagination(pagination);
  const offset = (page - 1) * limit;

  const sessionsWhere = { coach_id: coachId };
  const totalItems = await CourseSession.count({ where: sessionsWhere });
  const sessions = await CourseSession.findAll({
    where: sessionsWhere,
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'course_type', 'status', 'is_active'],
      },
      {
        model: User,
        as: 'rider',
        attributes: ['id', 'first_name', 'last_name', 'email'],
      },
    ],
    order: [['session_date', 'DESC'], ['start_time', 'DESC']],
    offset,
    limit,
  });

  const weeklyAvailability = await CoachWeeklyAvailability.findAll({
    where: { coach_id: coachId },
    order: [['day_of_week', 'ASC'], ['start_time', 'ASC']],
  });

  const counts = await Promise.all([
    Course.count({ where: { coach_id: coachId } }),
    Course.count({ where: { coach_id: coachId, is_active: true } }),
    CourseSession.count({ where: { coach_id: coachId, status: 'scheduled' } }),
    CourseSession.count({
      where: {
        coach_id: coachId,
        status: 'scheduled',
        session_date: { [Op.gte]: new Date().toISOString().slice(0, 10) },
      },
    }),
  ]);
  const [reviewSummary, reviews, courses] = await Promise.all([
    getCoachReviewSummary(coachId),
    getCoachReviews({
      coachId,
      pagination: { page: 1, limit: 20 },
    }),
    Course.findAll({
      where: { coach_id: coachId },
      attributes: ['id', 'title', 'course_type', 'status', 'is_active'],
      order: [['id', 'DESC']],
    }),
  ]);

  return {
    coach,
    summary: {
      total_courses: counts[0],
      active_courses: counts[1],
      total_scheduled_sessions: counts[2],
      upcoming_sessions: counts[3],
      average_rating: reviewSummary.average_rating,
      total_reviews: reviewSummary.total_reviews,
    },
    courses,
    reviews,
    weekly_availability: weeklyAvailability,
    sessions: {
      data: sessions,
      pagination: buildPaginationMeta({ page, limit, totalItems }),
    },
  };
};

export const getCoachSummary = async (coachId) => {
  await ensureCoachExists(coachId);

  const counts = await Promise.all([
    Course.count({ where: { coach_id: coachId } }),
    Course.count({ where: { coach_id: coachId, is_active: true } }),
    CourseSession.count({ where: { coach_id: coachId, status: 'scheduled' } }),
    CourseSession.count({
      where: {
        coach_id: coachId,
        status: 'scheduled',
        session_date: { [Op.gte]: new Date().toISOString().slice(0, 10) },
      },
    }),
  ]);
  const reviewSummary = await getCoachReviewSummary(coachId);

  return {
    total_courses: counts[0],
    active_courses: counts[1],
    total_scheduled_sessions: counts[2],
    upcoming_sessions: counts[3],
    average_rating: reviewSummary.average_rating,
    total_reviews: reviewSummary.total_reviews,
  };
};

export const getCoachCourses = async (coachId) => {
  await ensureCoachExists(coachId);
  return Course.findAll({
    where: { coach_id: coachId },
    attributes: ['id', 'title', 'course_type', 'status', 'is_active'],
    order: [['id', 'DESC']],
  });
};

export const getCoachSessions = async (coachId, pagination = {}) => {
  await ensureCoachExists(coachId);
  const { page, limit } = normalizePagination(pagination);
  const offset = (page - 1) * limit;
  const sessionsWhere = { coach_id: coachId };

  const totalItems = await CourseSession.count({ where: sessionsWhere });
  const sessions = await CourseSession.findAll({
    where: sessionsWhere,
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'course_type', 'status', 'is_active'],
      },
      {
        model: User,
        as: 'rider',
        attributes: ['id', 'first_name', 'last_name', 'email'],
      },
    ],
    order: [['session_date', 'DESC'], ['start_time', 'DESC']],
    offset,
    limit,
  });

  return {
    data: sessions,
    pagination: buildPaginationMeta({ page, limit, totalItems }),
  };
};

export const createCoachWeeklyAvailabilityByAdmin = async (coachId, payload) => {
  await ensureCoachExists(coachId);
  return createWeeklyAvailability(coachId, payload);
};

export const updateCoachWeeklyAvailabilityByAdmin = async (coachId, availabilityId, payload) => {
  await ensureCoachExists(coachId);
  return updateWeeklyAvailability(coachId, availabilityId, payload);
};

export const getCoachWeeklyAvailabilityByAdmin = async (coachId, { include_inactive } = {}) => {
  await ensureCoachExists(coachId);
  return getWeeklyAvailability(coachId, { include_inactive });
};

export const deleteCoachWeeklyAvailabilityByAdmin = async (coachId, availabilityId) => {
  await ensureCoachExists(coachId);
  return deleteWeeklyAvailability(coachId, availabilityId);
};

export const deleteCoach = async (coachId) => {
  const coach = await User.findOne({ where: { id: coachId, role: 'coach' } });
  if (!coach) {
    throw new Error('Coach not found.');
  }

  const activeBookings = await LessonBooking.count({
    where: {
      coach_id: coachId,
      status: { [Op.in]: ['pending_review', 'pending_payment', 'confirmed', 'in_progress', 'pending_horse_approval'] },
    },
  });
  if (activeBookings > 0) {
    throw new Error(`Cannot delete coach with ${activeBookings} active booking(s). Cancel or complete them first.`);
  }

  await CoachStable.destroy({ where: { coach_id: coachId } });
  await CoachWeeklyAvailability.destroy({ where: { coach_id: coachId } });
  await coach.destroy();

  return { message: 'Coach deleted successfully.' };
};
