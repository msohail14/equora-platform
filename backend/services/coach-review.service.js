import { Op } from 'sequelize';
import { Admin, CoachReview, Course, CourseEnrollment, User } from '../models/index.js';

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

const toNumberOrNull = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const validateStars = (stars) => {
  const parsed = Number(stars);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 5) {
    throw new Error('stars must be an integer between 1 and 5.');
  }
  return parsed;
};

const normalizeComment = (comment) => {
  if (comment === undefined) return undefined;
  if (comment === null) return null;
  const normalized = String(comment).trim();
  if (!normalized) return null;
  if (normalized.length > 500) {
    throw new Error('comment must be 500 characters or fewer.');
  }
  return normalized;
};

const ensureCoachForCourse = async ({ coachId, courseId }) => {
  const coach = await User.findOne({
    where: { id: coachId, role: 'coach' },
    attributes: ['id', 'role'],
  });
  if (!coach) {
    throw new Error('Coach not found.');
  }

  const course = await Course.findByPk(courseId, {
    attributes: ['id', 'coach_id', 'title'],
  });
  if (!course) {
    throw new Error('Course not found.');
  }
  if (Number(course.coach_id) !== Number(coachId)) {
    throw new Error('course_id does not belong to the selected coach.');
  }

  return { course };
};

const assertCanSubmitRiderReview = async ({ riderId, courseId, coachId }) => {
  const enrollment = await CourseEnrollment.findOne({
    where: {
      course_id: courseId,
      rider_id: riderId,
      status: { [Op.in]: ['active', 'completed', 'cancelled'] },
    },
    attributes: ['id'],
  });
  if (!enrollment) {
    throw new Error('Rider can review only enrolled courses.');
  }

  const existing = await CoachReview.findOne({
    where: {
      coach_id: coachId,
      course_id: courseId,
      reviewer_type: 'rider',
      reviewer_user_id: riderId,
    },
    attributes: ['id'],
  });
  if (existing) {
    throw new Error('Rider has already reviewed this coach for this course.');
  }
};

const getRequesterType = (user) => {
  if (user?.type === 'admin') return 'admin';
  if (user?.role === 'rider') return 'rider';
  throw new Error('Only rider or admin can submit reviews.');
};

const reviewInclude = [
  {
    model: Course,
    as: 'course',
    attributes: ['id', 'title'],
  },
  {
    model: User,
    as: 'reviewer_user',
    attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
  },
  {
    model: Admin,
    as: 'reviewer_admin',
    attributes: ['id', 'first_name', 'last_name', 'email'],
  },
];

const mapReview = (review) => {
  const payload = review.toJSON();
  if (payload.reviewer_type === 'admin') {
    payload.reviewer = {
      type: 'admin',
      id: payload.reviewer_admin?.id || null,
      first_name: payload.reviewer_admin?.first_name || null,
      last_name: payload.reviewer_admin?.last_name || null,
      email: payload.reviewer_admin?.email || null,
    };
  } else {
    payload.reviewer = {
      type: 'rider',
      id: payload.reviewer_user?.id || null,
      first_name: payload.reviewer_user?.first_name || null,
      last_name: payload.reviewer_user?.last_name || null,
      email: payload.reviewer_user?.email || null,
    };
  }
  return payload;
};

export const getCoachReviewSummary = async (coachId) => {
  const rows = await CoachReview.findAll({
    attributes: [
      'coach_id',
      [CoachReview.sequelize.fn('COUNT', CoachReview.sequelize.col('id')), 'total_reviews'],
      [CoachReview.sequelize.fn('AVG', CoachReview.sequelize.col('stars')), 'average_rating'],
    ],
    where: { coach_id: coachId },
    group: ['coach_id'],
    raw: true,
  });

  const row = rows?.[0];
  return {
    average_rating: row ? Number(Number(row.average_rating).toFixed(2)) : 0,
    total_reviews: row ? Number(row.total_reviews) : 0,
  };
};

export const getCoachReviewSummaryMap = async (coachIds = []) => {
  if (!coachIds.length) return new Map();
  const rows = await CoachReview.findAll({
    attributes: [
      'coach_id',
      [CoachReview.sequelize.fn('COUNT', CoachReview.sequelize.col('id')), 'total_reviews'],
      [CoachReview.sequelize.fn('AVG', CoachReview.sequelize.col('stars')), 'average_rating'],
    ],
    where: { coach_id: { [Op.in]: coachIds } },
    group: ['coach_id'],
    raw: true,
  });

  const map = new Map();
  rows.forEach((row) => {
    map.set(Number(row.coach_id), {
      average_rating: Number(Number(row.average_rating).toFixed(2)),
      total_reviews: Number(row.total_reviews),
    });
  });
  return map;
};

export const createCoachReview = async ({ user, payload }) => {
  const coachId = toNumberOrNull(payload.coach_id);
  const courseId = toNumberOrNull(payload.course_id);
  if (!coachId || !courseId) {
    throw new Error('coach_id and course_id are required.');
  }

  await ensureCoachForCourse({ coachId, courseId });

  const requesterType = getRequesterType(user);
  const stars = validateStars(payload.stars);
  const comment = normalizeComment(payload.comment);

  const createPayload = {
    coach_id: coachId,
    course_id: courseId,
    stars,
    comment: comment ?? null,
    reviewer_type: requesterType,
    reviewer_user_id: null,
    reviewer_admin_id: null,
  };

  if (requesterType === 'rider') {
    await assertCanSubmitRiderReview({
      riderId: Number(user.id),
      courseId,
      coachId,
    });
    createPayload.reviewer_user_id = Number(user.id);
  } else {
    createPayload.reviewer_admin_id = Number(user.id);
  }

  const review = await CoachReview.create(createPayload);
  const result = await CoachReview.findByPk(review.id, { include: reviewInclude });
  return mapReview(result);
};

const assertCanManageReview = (user, review) => {
  if (user?.type === 'admin') return;
  if (user?.role === 'rider' && review.reviewer_type === 'rider' && Number(review.reviewer_user_id) === Number(user.id)) {
    return;
  }
  throw new Error('You are not allowed to modify this review.');
};

export const updateCoachReview = async ({ user, reviewId, payload }) => {
  const review = await CoachReview.findByPk(reviewId);
  if (!review) {
    throw new Error('Review not found.');
  }
  assertCanManageReview(user, review);

  if (payload.stars !== undefined) {
    review.stars = validateStars(payload.stars);
  }
  if (payload.comment !== undefined) {
    review.comment = normalizeComment(payload.comment);
  }
  await review.save();

  const updated = await CoachReview.findByPk(review.id, { include: reviewInclude });
  return mapReview(updated);
};

export const deleteCoachReview = async ({ user, reviewId }) => {
  const review = await CoachReview.findByPk(reviewId);
  if (!review) {
    throw new Error('Review not found.');
  }
  assertCanManageReview(user, review);
  await review.destroy();
  return { message: 'Review deleted successfully.' };
};

export const getCoachReviews = async ({ coachId, pagination = {} }) => {
  const parsedCoachId = toNumberOrNull(coachId);
  if (!parsedCoachId) {
    throw new Error('coachId is required.');
  }

  const coach = await User.findOne({
    where: { id: parsedCoachId, role: 'coach' },
    attributes: ['id'],
  });
  if (!coach) {
    throw new Error('Coach not found.');
  }

  const { page, limit } = normalizePagination(pagination);
  const offset = (page - 1) * limit;

  const { rows, count } = await CoachReview.findAndCountAll({
    where: { coach_id: parsedCoachId },
    include: reviewInclude,
    order: [['id', 'DESC']],
    offset,
    limit,
    distinct: true,
  });

  const summary = await getCoachReviewSummary(parsedCoachId);

  return {
    data: rows.map(mapReview),
    pagination: buildPaginationMeta({
      currentPage: page,
      limit,
      totalRecords: count,
    }),
    summary,
  };
};
