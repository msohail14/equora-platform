import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  CoachFavouriteRider, CoachReview, Course, CourseEnrollment, CourseSession,
  Discipline, LessonBooking, Notification, Payment, RiderHorse,
  RiderPackageBalance, SessionFeedback, Subscription, User,
} from '../models/index.js';
import { sendResetPasswordLinkEmail } from './mail.service.js';

/**
 * Admin reset rider password. Supports two methods:
 * - email: send reset link via email (if email fails, still returns reset_link for manual sharing)
 * - manual: set a temporary password and return it so admin can share with the rider
 * @param {string} userId - Rider user id
 * @param {{ method?: 'email' | 'manual' }} [options] - method: 'email' (default) or 'manual'
 */
export const adminResetUserPassword = async (userId, options = {}) => {
  const user = await User.findByPk(userId);
  if (!user) {
    throw new Error('User not found.');
  }

  const method = (options.method || 'email').toLowerCase();
  const expiryMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 60);
  const frontendBaseUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'http://localhost:5173';

  if (method === 'manual') {
    const temporaryPassword = options.customPassword || crypto.randomBytes(12).toString('hex');
    const password_hash = await bcrypt.hash(temporaryPassword, 10);
    user.password_hash = password_hash;
    user.reset_password_token = null;
    user.reset_password_expires = null;
    user.must_change_password = true;
    await user.save();
    return {
      message: 'Temporary password set. Share it with the rider; they should change it after first login.',
      method: 'manual',
      temporary_password: temporaryPassword,
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);
  user.reset_password_token = resetToken;
  user.reset_password_expires = expiryDate;
  await user.save();

  const resetLink = `${frontendBaseUrl.replace(/\/+$/, '')}/reset-password?token=${resetToken}`;

  let emailSent = false;
  try {
    await sendResetPasswordLinkEmail({
      to: user.email,
      resetLink,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User',
      expiresMinutes: expiryMinutes,
    });
    emailSent = true;
  } catch (err) {
    // Email not configured or failed — still return reset_link for manual sharing
  }

  return {
    message: emailSent
      ? `Password reset link sent to ${user.email} (valid for ${expiryMinutes} minutes).`
      : `Reset link generated (email not sent). Share the link below with ${user.email}.`,
    method: 'email',
    email_sent: emailSent,
    reset_link: resetLink,
  };
};

const normalizePagination = ({ page, limit }) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;
  return { page: safePage, limit: safeLimit };
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

const ensureRiderExists = async (riderId) => {
  const rider = await User.findOne({
    where: { id: riderId, role: 'rider' },
    attributes: [
      'id',
      'first_name',
      'last_name',
      'email',
      'mobile_number',
      'city',
      'state',
      'country',
      'pincode',
      'date_of_birth',
      'gender',
      'profile_picture_url',
      'is_active',
      'created_at',
    ],
  });
  if (!rider) {
    throw new Error('Rider not found.');
  }
  return rider;
};

export const createRiderByAdmin = async (payload) => {
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) {
    throw new Error('email is required.');
  }

  const existing = await User.findOne({ where: { email }, attributes: ['id'] });
  if (existing) {
    throw new Error('Email already exists.');
  }

  const randomPassword = crypto.randomBytes(24).toString('hex');
  const password_hash = await bcrypt.hash(randomPassword, 10);
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiryMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 15);
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const rider = await User.create({
    email,
    password_hash,
    role: 'rider',
    first_name: payload.first_name || null,
    last_name: payload.last_name || null,
    mobile_number: payload.mobile_number || null,
    city: payload.city || null,
    state: payload.state || null,
    country: payload.country || null,
    pincode: payload.pincode || null,
    date_of_birth: payload.date_of_birth || null,
    gender: normalizeGender(payload.gender),
    is_email_verified: true,
    is_active:
      payload.is_active === undefined
        ? true
        : (typeof payload.is_active === 'boolean'
          ? payload.is_active
          : String(payload.is_active).toLowerCase() === 'true'),
    reset_password_token: resetToken,
    reset_password_expires: expiryDate,
  });

  const frontendBaseUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendBaseUrl.replace(/\/+$/, '')}/reset-password?token=${resetToken}`;

  let emailSent = false;
  try {
    await sendResetPasswordLinkEmail({
      to: rider.email,
      resetLink,
      name: `${rider.first_name || ''} ${rider.last_name || ''}`.trim() || 'Rider',
      expiresMinutes: expiryMinutes,
    });
    emailSent = true;
  } catch (err) {
    // Email service not configured or failed — rider is still created; admin can share link manually
  }

  return {
    message: emailSent
      ? 'Rider created and invitation email sent successfully.'
      : 'Rider created. Invitation email could not be sent; share the reset link below with the rider.',
    email_sent: emailSent,
    reset_link: resetLink,
    temporary_password: emailSent ? undefined : randomPassword,
    rider: {
      id: rider.id,
      first_name: rider.first_name,
      last_name: rider.last_name,
      email: rider.email,
      mobile_number: rider.mobile_number,
      city: rider.city,
      state: rider.state,
      country: rider.country,
      pincode: rider.pincode,
      date_of_birth: rider.date_of_birth,
      gender: rider.gender,
      is_active: rider.is_active,
      created_at: rider.created_at,
    },
  };
};

export const getAllRiders = async ({ page, limit, search } = {}) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;
  const where = { role: 'rider' };
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
      { pincode: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { rows, count } = await User.findAndCountAll({
    where,
    attributes: [
      'id',
      'first_name',
      'last_name',
      'email',
      'mobile_number',
      'city',
      'state',
      'country',
      'pincode',
      'date_of_birth',
      'gender',
      'profile_picture_url',
      'is_active',
      'created_at',
    ],
    order: [['id', 'DESC']],
    offset,
    limit: pagination.limit,
  });

  const data = await Promise.all(
    rows.map(async (rider) => {
      const enrollment_count = await CourseEnrollment.count({
        where: { rider_id: rider.id, status: 'active' },
      });
      return {
        ...rider.toJSON(),
        enrollment_count,
      };
    })
  );

  const meta = buildPaginationMeta({
    page: pagination.page,
    limit: pagination.limit,
    totalItems: count,
  });

  return {
    data,
    pagination: {
      ...meta,
      totalRecords: meta.totalItems,
      currentPage: meta.page,
      nextPage: meta.hasNext ? meta.page + 1 : null,
    },
  };
};

export const getRiderStats = async (riderId) => {
  await ensureRiderExists(riderId);

  const [enrolledCourses, sessionsCreated, sessionsCancelled] = await Promise.all([
    CourseEnrollment.count({
      where: { rider_id: riderId, status: 'active' },
    }),
    CourseSession.count({
      where: { created_by_user_id: riderId },
    }),
    CourseSession.count({
      where: { status: 'cancelled', cancelled_by_user_id: riderId },
    }),
  ]);

  return {
    enrolled_courses: enrolledCourses,
    sessions_created: sessionsCreated,
    sessions_cancelled: sessionsCancelled,
  };
};

export const getRiderDetailsWithEnrollments = async (riderId) => {
  const rider = await ensureRiderExists(riderId);

  const enrollments = await CourseEnrollment.findAll({
    where: { rider_id: riderId },
    attributes: ['id', 'status', 'enrolled_at'],
    include: [
      {
        model: Course,
        as: 'course',
        attributes: [
          'id',
          'title',
          'course_type',
          'status',
          'is_active',
          'duration_days',
          'max_session_duration',
          'total_sessions',
          'max_enrollment',
          'start_date',
          'end_date',
          'start_time',
          'end_time',
        ],
        include: [
          {
            model: User,
            as: 'coach',
            attributes: ['id', 'first_name', 'last_name', 'email'],
          },
          {
            model: Discipline,
            as: 'discipline',
            attributes: ['id', 'name', 'difficulty_level'],
          },
        ],
      },
    ],
    order: [['id', 'DESC']],
  });

  const stats = await getRiderStats(riderId);

  return {
    rider,
    enrollments,
    stats,
  };
};

export const getRiderSessions = async (riderId, { page, limit }) => {
  await ensureRiderExists(riderId);
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const enrollments = await CourseEnrollment.findAll({
    where: { rider_id: riderId, status: 'active' },
    attributes: ['course_id'],
  });
  const enrolledCourseIds = enrollments.map((e) => e.course_id);

  const where = {
    [Op.or]: [
      { rider_id: riderId },
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
    include: [
      {
        model: Course,
        as: 'course',
        attributes: ['id', 'title', 'course_type', 'coach_id'],
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
    ],
    order: [['session_date', 'DESC'], ['start_time', 'DESC']],
    offset,
    limit: pagination.limit,
  });

  return {
    sessions,
    pagination: buildPaginationMeta({
      page: pagination.page,
      limit: pagination.limit,
      totalItems,
    }),
  };
};

export const updateRiderActiveStatus = async (riderId, is_active) => {
  if (is_active === undefined) {
    throw new Error('is_active is required.');
  }

  const rider = await User.findOne({
    where: { id: riderId, role: 'rider' },
  });

  if (!rider) {
    throw new Error('Rider not found.');
  }

  const normalized =
    typeof is_active === 'boolean' ? is_active : String(is_active).toLowerCase() === 'true';

  rider.is_active = normalized;
  await rider.save();

  return {
    message: `Rider ${normalized ? 'activated' : 'deactivated'} successfully.`,
    rider: {
      id: rider.id,
      first_name: rider.first_name,
      last_name: rider.last_name,
      email: rider.email,
      mobile_number: rider.mobile_number,
      is_active: rider.is_active,
    },
  };
};

/**
 * Get a preview of what will be deleted when a rider is removed.
 */
export const getRiderDeletionPreview = async (riderId) => {
  const rider = await User.findOne({ where: { id: riderId, role: 'rider' } });
  if (!rider) throw new Error('Rider not found.');

  const activeStatuses = ['pending_review', 'pending_payment', 'confirmed', 'in_progress', 'pending_horse_approval'];

  const [activeBookings, totalBookings, enrollments, payments, notifications] = await Promise.all([
    LessonBooking.count({ where: { rider_id: riderId, status: { [Op.in]: activeStatuses } } }),
    LessonBooking.count({ where: { rider_id: riderId } }),
    CourseEnrollment.count({ where: { rider_id: riderId } }),
    Payment.count({ where: { user_id: riderId } }),
    Notification.count({ where: { user_id: riderId } }),
  ]);

  return {
    rider: { id: rider.id, name: `${rider.first_name || ''} ${rider.last_name || ''}`.trim(), email: rider.email },
    activeBookings,
    totalBookings,
    enrollments,
    payments,
    notifications,
    canDelete: true,
  };
};

export const deleteRider = async (riderId) => {
  const rider = await User.findOne({ where: { id: riderId, role: 'rider' } });
  if (!rider) {
    throw new Error('Rider not found.');
  }

  const activeStatuses = ['pending_review', 'pending_payment', 'confirmed', 'in_progress', 'pending_horse_approval'];

  // Cancel all active bookings (same pattern as coach deletion)
  const [cancelledCount] = await LessonBooking.update(
    { status: 'cancelled', decline_reason: 'Rider account was deleted by admin.' },
    { where: { rider_id: riderId, status: { [Op.in]: activeStatuses } } }
  );

  // Nullify rider_id on historical bookings (keep records for coaches)
  await LessonBooking.update(
    { rider_id: null },
    { where: { rider_id: riderId } }
  );

  // Cascade delete rider-specific data
  await CourseEnrollment.destroy({ where: { rider_id: riderId } });
  await RiderPackageBalance.destroy({ where: { rider_id: riderId } });
  await RiderHorse.destroy({ where: { rider_id: riderId } });
  await SessionFeedback.destroy({ where: { rider_id: riderId } });
  await CoachReview.destroy({ where: { reviewer_user_id: riderId } });
  await CoachFavouriteRider.destroy({ where: { rider_id: riderId } });
  await Notification.destroy({ where: { user_id: riderId } });
  await Payment.destroy({ where: { user_id: riderId } });
  await Subscription.destroy({ where: { user_id: riderId } });

  // Nullify rider references in course sessions
  await CourseSession.update(
    { rider_id: null },
    { where: { rider_id: riderId } }
  );
  await CourseSession.update(
    { created_by_user_id: null },
    { where: { created_by_user_id: riderId } }
  );
  await CourseSession.update(
    { cancelled_by_user_id: null },
    { where: { cancelled_by_user_id: riderId } }
  );

  // Delete the rider user record
  await rider.destroy();

  return {
    message: 'Rider deleted successfully.',
    cancelledBookings: cancelledCount,
  };
};

export const updateRider = async (riderId, payload) => {
  const rider = await User.findOne({
    where: { id: riderId, role: 'rider' },
  });

  if (!rider) {
    throw new Error('Rider not found.');
  }

  if (payload.email !== undefined) {
    const email = String(payload.email || '').trim().toLowerCase();
    if (!email) {
      throw new Error('email is required.');
    }
    const existing = await User.findOne({
      where: {
        email,
        id: { [Op.ne]: rider.id },
      },
      attributes: ['id'],
    });
    if (existing) {
      throw new Error('Email already exists.');
    }
    rider.email = email;
  }

  if (payload.first_name !== undefined) {
    rider.first_name = payload.first_name || null;
  }
  if (payload.last_name !== undefined) {
    rider.last_name = payload.last_name || null;
  }
  if (payload.mobile_number !== undefined) {
    rider.mobile_number = payload.mobile_number || null;
  }
  if (payload.city !== undefined) {
    rider.city = payload.city || null;
  }
  if (payload.state !== undefined) {
    rider.state = payload.state || null;
  }
  if (payload.country !== undefined) {
    rider.country = payload.country || null;
  }
  if (payload.pincode !== undefined) {
    rider.pincode = payload.pincode || null;
  }
  if (payload.date_of_birth !== undefined) {
    rider.date_of_birth = payload.date_of_birth || null;
  }
  if (payload.gender !== undefined) {
    rider.gender = normalizeGender(payload.gender);
  }
  if (payload.is_active !== undefined) {
    rider.is_active =
      typeof payload.is_active === 'boolean'
        ? payload.is_active
        : String(payload.is_active).toLowerCase() === 'true';
  }

  await rider.save();

  return {
    message: 'Rider updated successfully.',
    rider: {
      id: rider.id,
      first_name: rider.first_name,
      last_name: rider.last_name,
      email: rider.email,
      mobile_number: rider.mobile_number,
      city: rider.city,
      state: rider.state,
      country: rider.country,
      pincode: rider.pincode,
      date_of_birth: rider.date_of_birth,
      gender: rider.gender,
      is_active: rider.is_active,
      profile_picture_url: rider.profile_picture_url,
      created_at: rider.created_at,
    },
  };
};
