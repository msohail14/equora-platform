import { Op } from 'sequelize';
import { Course, User, Discipline, Stable } from '../models/index.js';
import { deleteFileIfExists, toAbsolutePathFromPublic } from '../utils/file.util.js';

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

const validateCoursePayload = (payload) => {
  if (payload.duration_days !== undefined && Number(payload.duration_days) < 1) {
    throw new Error('duration_days must be at least 1.');
  }
  if (payload.max_session_duration !== undefined && Number(payload.max_session_duration) < 1) {
    throw new Error('max_session_duration must be at least 1 minute.');
  }
  if (payload.total_sessions !== undefined && Number(payload.total_sessions) < 1) {
    throw new Error('total_sessions must be at least 1.');
  }
  if (payload.max_enrollment !== undefined && Number(payload.max_enrollment) < 1) {
    throw new Error('max_enrollment must be at least 1.');
  }
};

const ensureStableExists = async (stableId) => {
  const stable = await Stable.findByPk(stableId);
  if (!stable) {
    throw new Error('Stable not found.');
  }
  return stable;
};

export const createCourse = async (coachId, payload) => {
  const { title, discipline_id, stable_id } = payload;
  
  if (!title) {
    throw new Error('Course title is required.');
  }
  if (!discipline_id) {
    throw new Error('discipline_id is required.');
  }
  if (!stable_id) {
    throw new Error('stable_id is required.');
  }
  validateCoursePayload(payload);

  // Verify coach exists and has coach role
  const coach = await User.findByPk(coachId);
  if (!coach || coach.role !== 'coach') {
    throw new Error('Invalid coach.');
  }

  // Verify discipline exists if provided
  const discipline = await Discipline.findByPk(discipline_id);
  if (!discipline) {
    throw new Error('Discipline not found.');
  }
  await ensureStableExists(stable_id);

  const course = await Course.create({
    coach_id: coachId,
    stable_id,
    title: payload.title,
    description: payload.description || null,
    discipline_id,
    course_type: payload.course_type || 'one_to_one',
    difficulty_level: payload.difficulty_level || null,
    focus_type: payload.focus_type || null,
    duration_days: payload.duration_days || null,
    max_session_duration: payload.max_session_duration || null,
    start_date: payload.start_date || null,
    end_date: payload.end_date || null,
    start_time: payload.start_time || null,
    end_time: payload.end_time || null,
    total_sessions: payload.total_sessions || null,
    max_enrollment: payload.max_enrollment || null,
    price: payload.price || null,
    thumbnail_url: payload.thumbnail_url || null,
    status: payload.status || 'draft',
    is_active: payload.is_active ?? true,
  });

  return course;
};

export const getAllCourses = async ({ include_inactive, coach_id, status, search, page, limit } = {}) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;
  const where = {};
  
  if (!include_inactive) {
    where.is_active = true;
  }
  
  if (coach_id) {
    where.coach_id = coach_id;
  }
  
  if (status) {
    where.status = status;
  }
  const keyword = String(search || '').trim();
  if (keyword) {
    where[Op.or] = [
      { title: { [Op.like]: `%${keyword}%` } },
      { description: { [Op.like]: `%${keyword}%` } },
      { course_type: { [Op.like]: `%${keyword}%` } },
      { difficulty_level: { [Op.like]: `%${keyword}%` } },
      { status: { [Op.like]: `%${keyword}%` } },
      { '$coach.first_name$': { [Op.like]: `%${keyword}%` } },
      { '$coach.last_name$': { [Op.like]: `%${keyword}%` } },
      { '$coach.email$': { [Op.like]: `%${keyword}%` } },
      { '$discipline.name$': { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { rows, count } = await Course.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'coach',
        attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture_url'],
      },
      {
        model: Stable,
        as: 'stable',
        attributes: ['id', 'name', 'city', 'state', 'country'],
      },
      {
        model: Discipline,
        as: 'discipline',
        attributes: ['id', 'name', 'icon_url', 'difficulty_level'],
      },
    ],
    order: [['created_at', 'DESC']],
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

export const getMyCourses = async (coachId, { include_inactive = true, status, search, page, limit } = {}) =>
  getAllCourses({
    include_inactive,
    coach_id: coachId,
    status,
    search,
    page,
    limit,
  });

export const getCourseById = async (courseId) => {
  const course = await Course.findByPk(courseId, {
    include: [
      {
        model: User,
        as: 'coach',
        attributes: ['id', 'first_name', 'last_name', 'email', 'profile_picture_url'],
      },
      {
        model: Stable,
        as: 'stable',
        attributes: ['id', 'name', 'city', 'state', 'country'],
      },
      {
        model: Discipline,
        as: 'discipline',
        attributes: ['id', 'name', 'icon_url', 'difficulty_level'],
      },
    ],
  });
  
  if (!course) {
    throw new Error('Course not found.');
  }
  
  return course;
};

export const updateCourse = async (courseId, coachId, payload) => {
  const course = await Course.findByPk(courseId);
  
  if (!course) {
    throw new Error('Course not found.');
  }

  // Ensure the coach owns this course
  if (course.coach_id !== coachId) {
    throw new Error('Access denied. You can only update your own courses.');
  }

  // Verify discipline exists if being updated
  if (payload.discipline_id && payload.discipline_id !== course.discipline_id) {
    const discipline = await Discipline.findByPk(payload.discipline_id);
    if (!discipline) {
      throw new Error('Discipline not found.');
    }
  }
  if (payload.stable_id && Number(payload.stable_id) !== Number(course.stable_id)) {
    await ensureStableExists(payload.stable_id);
  }

  const previousThumbnailUrl = course.thumbnail_url;
  validateCoursePayload(payload);

  // Update fields
  if (payload.title !== undefined) course.title = payload.title;
  if (payload.description !== undefined) course.description = payload.description;
  if (payload.stable_id !== undefined) course.stable_id = payload.stable_id;
  if (payload.discipline_id !== undefined) course.discipline_id = payload.discipline_id;
  if (payload.difficulty_level !== undefined) course.difficulty_level = payload.difficulty_level;
  if (payload.focus_type !== undefined) course.focus_type = payload.focus_type;
  if (payload.course_type !== undefined) course.course_type = payload.course_type;
  if (payload.duration_days !== undefined) course.duration_days = payload.duration_days;
  if (payload.max_session_duration !== undefined) course.max_session_duration = payload.max_session_duration;
  if (payload.start_date !== undefined) course.start_date = payload.start_date;
  if (payload.end_date !== undefined) course.end_date = payload.end_date;
  if (payload.start_time !== undefined) course.start_time = payload.start_time;
  if (payload.end_time !== undefined) course.end_time = payload.end_time;
  if (payload.total_sessions !== undefined) course.total_sessions = payload.total_sessions;
  if (payload.max_enrollment !== undefined) course.max_enrollment = payload.max_enrollment;
  if (payload.price !== undefined) course.price = payload.price;
  if (payload.thumbnail_url !== undefined) course.thumbnail_url = payload.thumbnail_url;
  if (payload.status !== undefined) course.status = payload.status;
  if (payload.is_active !== undefined) course.is_active = payload.is_active;

  await course.save();

  // Clean up old thumbnail if a new one was uploaded
  if (payload.thumbnail_url && previousThumbnailUrl && previousThumbnailUrl !== payload.thumbnail_url) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousThumbnailUrl));
    } catch (_error) {
      // Do not fail update if old file cleanup fails
    }
  }

  return course;
};

export const updateCourseByAdmin = async (courseId, payload) => {
  const course = await Course.findByPk(courseId);
  if (!course) {
    throw new Error('Course not found.');
  }

  if (payload.coach_id !== undefined && payload.coach_id !== course.coach_id) {
    const coach = await User.findByPk(payload.coach_id);
    if (!coach || coach.role !== 'coach') {
      throw new Error('Invalid coach.');
    }
  }

  if (payload.discipline_id && payload.discipline_id !== course.discipline_id) {
    const discipline = await Discipline.findByPk(payload.discipline_id);
    if (!discipline) {
      throw new Error('Discipline not found.');
    }
  }
  if (payload.stable_id && Number(payload.stable_id) !== Number(course.stable_id)) {
    await ensureStableExists(payload.stable_id);
  }

  const previousThumbnailUrl = course.thumbnail_url;
  validateCoursePayload(payload);

  if (payload.title !== undefined) course.title = payload.title;
  if (payload.description !== undefined) course.description = payload.description;
  if (payload.coach_id !== undefined) course.coach_id = payload.coach_id;
  if (payload.stable_id !== undefined) course.stable_id = payload.stable_id;
  if (payload.discipline_id !== undefined) course.discipline_id = payload.discipline_id;
  if (payload.difficulty_level !== undefined) course.difficulty_level = payload.difficulty_level;
  if (payload.focus_type !== undefined) course.focus_type = payload.focus_type;
  if (payload.course_type !== undefined) course.course_type = payload.course_type;
  if (payload.duration_days !== undefined) course.duration_days = payload.duration_days;
  if (payload.max_session_duration !== undefined) course.max_session_duration = payload.max_session_duration;
  if (payload.start_date !== undefined) course.start_date = payload.start_date;
  if (payload.end_date !== undefined) course.end_date = payload.end_date;
  if (payload.start_time !== undefined) course.start_time = payload.start_time;
  if (payload.end_time !== undefined) course.end_time = payload.end_time;
  if (payload.total_sessions !== undefined) course.total_sessions = payload.total_sessions;
  if (payload.max_enrollment !== undefined) course.max_enrollment = payload.max_enrollment;
  if (payload.price !== undefined) course.price = payload.price;
  if (payload.thumbnail_url !== undefined) course.thumbnail_url = payload.thumbnail_url;
  if (payload.status !== undefined) course.status = payload.status;
  if (payload.is_active !== undefined) course.is_active = payload.is_active;

  await course.save();

  if (payload.thumbnail_url && previousThumbnailUrl && previousThumbnailUrl !== payload.thumbnail_url) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousThumbnailUrl));
    } catch (_error) {
      // Do not fail update if old file cleanup fails
    }
  }

  return course;
};

export const deleteCourse = async (courseId, coachId) => {
  const course = await Course.findByPk(courseId);
  
  if (!course) {
    throw new Error('Course not found.');
  }

  // Ensure the coach owns this course
  if (course.coach_id !== coachId) {
    throw new Error('Access denied. You can only delete your own courses.');
  }

  if (!course.is_active) {
    throw new Error('Course is already deactivated.');
  }

  // Soft delete - deactivate instead of removing
  course.is_active = false;
  course.status = 'archived';
  await course.save();

  return { message: 'Course deactivated successfully.' };
};
