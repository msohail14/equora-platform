import { body, param, query, validationResult } from 'express-validator';

// ─── Shared validation error handler ────────────────────────────────────────

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Reusable helpers ───────────────────────────────────────────────────────

const timePattern = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

const isTime = (field) =>
  field.matches(timePattern).withMessage('Must be in HH:MM or HH:MM:SS format');

// ─── Auth / User routes ─────────────────────────────────────────────────────

export const signupValidation = [
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required'),
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required'),
  body('role')
    .isIn(['rider', 'coach']).withMessage('Role must be one of: rider, coach'),
  body('mobile_number')
    .optional({ values: 'falsy' })
    .isMobilePhone('any').withMessage('Must be a valid mobile number'),
  body('coach_type')
    .optional({ values: 'falsy' })
    .isIn(['freelancer', 'stable_employed', 'independent']).withMessage('coach_type must be one of: freelancer, stable_employed, independent'),
];

export const loginValidation = [
  body('email')
    .isEmail().withMessage('Must be a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const verifyEmailOtpValidation = [
  body('email')
    .isEmail().withMessage('Must be a valid email address'),
  body('otp')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits')
    .isNumeric().withMessage('OTP must be numeric'),
];

export const resendEmailOtpValidation = [
  body('email')
    .isEmail().withMessage('Must be a valid email address'),
];

export const forgotPasswordValidation = [
  body('email')
    .isEmail().withMessage('Must be a valid email address'),
];

export const resetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token is required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export const changePasswordValidation = [
  body('current_password')
    .notEmpty().withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export const updateFcmTokenValidation = [
  body('fcm_token')
    .notEmpty().withMessage('fcm_token is required')
    .isString().withMessage('fcm_token must be a string'),
];

// ─── Booking routes ─────────────────────────────────────────────────────────

export const createBookingValidation = [
  body('stable_id')
    .optional()
    .toInt()
    .isInt({ min: 1 }).withMessage('stable_id must be a positive integer'),
  body('stableId')
    .optional()
    .toInt()
    .isInt({ min: 1 }).withMessage('stableId must be a positive integer'),
  body('booking_date')
    .optional()
    .isISO8601().withMessage('booking_date must be a valid ISO 8601 date'),
  body('bookingDate')
    .optional()
    .isISO8601().withMessage('bookingDate must be a valid ISO 8601 date'),
  body('date')
    .optional()
    .isISO8601().withMessage('date must be a valid ISO 8601 date'),
  body('start_time')
    .optional()
    .matches(timePattern).withMessage('start_time must be in HH:MM or HH:MM:SS format'),
  body('startTime')
    .optional()
    .matches(timePattern).withMessage('startTime must be in HH:MM or HH:MM:SS format'),
  body('time')
    .optional()
    .matches(timePattern).withMessage('time must be in HH:MM or HH:MM:SS format'),
  body('duration_minutes')
    .optional()
    .toInt()
    .isInt({ min: 15, max: 480 }).withMessage('duration_minutes must be between 15 and 480'),
  body('durationMinutes')
    .optional()
    .toInt()
    .isInt({ min: 15, max: 480 }).withMessage('durationMinutes must be between 15 and 480'),
  body('coach_id')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 1 }).withMessage('coach_id must be a positive integer'),
  body('coachId')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 1 }).withMessage('coachId must be a positive integer'),
  body('arena_id')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 1 }).withMessage('arena_id must be a positive integer'),
  body('arenaId')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 1 }).withMessage('arenaId must be a positive integer'),
  body('horse_id')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 1 }).withMessage('horse_id must be a positive integer'),
  body('horseId')
    .optional({ values: 'falsy' })
    .toInt()
    .isInt({ min: 1 }).withMessage('horseId must be a positive integer'),
  body('lesson_type')
    .optional()
    .isIn(['private', 'group', 'semi-private']).withMessage('lesson_type must be one of: private, group, semi-private'),
  body('lessonType')
    .optional()
    .isIn(['private', 'group', 'semi-private']).withMessage('lessonType must be one of: private, group, semi-private'),
  body('booking_type')
    .optional()
    .isIn(['lesson', 'trail', 'exercise', 'other']).withMessage('Invalid booking_type'),
  body('bookingType')
    .optional()
    .isIn(['lesson', 'trail', 'exercise', 'other']).withMessage('Invalid bookingType'),
];

export const createSeriesBookingValidation = [
  body('stableId')
    .optional()
    .toInt()
    .isInt({ min: 1 }).withMessage('stableId must be a positive integer'),
  body('stable_id')
    .optional()
    .toInt()
    .isInt({ min: 1 }).withMessage('stable_id must be a positive integer'),
  body('dates')
    .isArray({ min: 1, max: 52 }).withMessage('dates must be an array with 1-52 entries'),
  body('dates.*')
    .isISO8601().withMessage('Each date must be a valid ISO 8601 date'),
  body('startTime')
    .optional()
    .matches(timePattern).withMessage('startTime must be in HH:MM or HH:MM:SS format'),
  body('start_time')
    .optional()
    .matches(timePattern).withMessage('start_time must be in HH:MM or HH:MM:SS format'),
];

export const bookingIdParamValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Booking id must be a positive integer'),
];

export const riderModifyBookingValidation = [
  body('booking_date')
    .optional()
    .isISO8601().withMessage('booking_date must be a valid ISO 8601 date'),
  body('start_time')
    .optional()
    .matches(timePattern).withMessage('start_time must be in HH:MM or HH:MM:SS format'),
  body('end_time')
    .optional()
    .matches(timePattern).withMessage('end_time must be in HH:MM or HH:MM:SS format'),
];

export const stableIdParamValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Stable id must be a positive integer'),
];

export const stableCoachesQueryValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Stable id must be a positive integer'),
  query('date')
    .optional()
    .isISO8601().withMessage('date must be a valid ISO 8601 date'),
  query('start_time')
    .optional()
    .matches(timePattern).withMessage('start_time must be in HH:MM or HH:MM:SS format'),
];

// ─── Admin routes ───────────────────────────────────────────────────────────

export const adminSignupValidation = [
  body('email')
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('first_name')
    .trim()
    .notEmpty().withMessage('First name is required'),
  body('last_name')
    .trim()
    .notEmpty().withMessage('Last name is required'),
];

export const adminLoginValidation = [
  body('email')
    .isEmail().withMessage('Must be a valid email address'),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

export const adminForgotPasswordValidation = [
  body('email')
    .isEmail().withMessage('Must be a valid email address'),
];

export const adminResetPasswordValidation = [
  body('token')
    .notEmpty().withMessage('Token is required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export const adminChangePasswordValidation = [
  body('current_password')
    .notEmpty().withMessage('Current password is required'),
  body('new_password')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
];

export const adminIdParamValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('ID must be a positive integer'),
];

export const adminCoachIdParamValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Stable ID must be a positive integer'),
  param('coachId')
    .toInt()
    .isInt({ min: 1 }).withMessage('Coach ID must be a positive integer'),
];

// ─── Payment routes ─────────────────────────────────────────────────────────

export const initiatePaymentValidation = [
  body('amount')
    .isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
  body('provider')
    .notEmpty().withMessage('Payment provider is required'),
  body('paymentType')
    .notEmpty().withMessage('Payment type is required'),
  body('relatedId')
    .optional()
    .toInt()
    .isInt({ min: 1 }).withMessage('relatedId must be a positive integer'),
];

export const paymentIdParamValidation = [
  param('transactionId')
    .notEmpty().withMessage('Transaction ID is required'),
];

export const subscriptionIdParamValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Subscription ID must be a positive integer'),
];

// ─── Invitation routes ──────────────────────────────────────────────────────

export const createInvitationValidation = [
  body('stableId')
    .toInt()
    .isInt({ min: 1 }).withMessage('stableId must be a positive integer'),
  body('email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Must be a valid email address'),
  body('phone')
    .optional({ values: 'falsy' })
    .isString().withMessage('Phone must be a string'),
];

export const createRiderInvitationValidation = [
  body('email')
    .optional({ values: 'falsy' })
    .isEmail().withMessage('Must be a valid email address'),
  body('phone')
    .optional({ values: 'falsy' })
    .isString().withMessage('Phone must be a string'),
];

export const verifyInviteCodeValidation = [
  param('code')
    .isLength({ min: 5, max: 20 }).withMessage('Invite code must be between 5 and 20 characters')
    .isAlphanumeric().withMessage('Invite code must be alphanumeric'),
];

export const acceptRiderInvitationValidation = [
  body('invite_code')
    .notEmpty().withMessage('invite_code is required')
    .isString().withMessage('invite_code must be a string'),
];

export const acceptInvitationParamValidation = [
  param('token')
    .notEmpty().withMessage('Token is required'),
];

export const cancelInvitationValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Invitation ID must be a positive integer'),
];

export const stableInvitationsParamValidation = [
  param('stableId')
    .toInt()
    .isInt({ min: 1 }).withMessage('Stable ID must be a positive integer'),
];

// ─── Course routes ──────────────────────────────────────────────────────────

export const createCourseValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
  body('discipline_id')
    .optional()
    .toInt()
    .isInt({ min: 1 }).withMessage('discipline_id must be a positive integer'),
];

export const updateCourseValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Course id must be a positive integer'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Title must be at most 200 characters'),
];

export const courseIdParamValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Course id must be a positive integer'),
];

// ─── Session routes ─────────────────────────────────────────────────────────

export const createSessionValidation = [
  body('course_id')
    .toInt()
    .isInt({ min: 1 }).withMessage('course_id must be a positive integer'),
  body('session_date')
    .isISO8601().withMessage('session_date must be a valid ISO 8601 date'),
  body('start_time')
    .notEmpty().withMessage('start_time is required')
    .matches(timePattern).withMessage('start_time must be in HH:MM or HH:MM:SS format'),
  body('end_time')
    .notEmpty().withMessage('end_time is required')
    .matches(timePattern).withMessage('end_time must be in HH:MM or HH:MM:SS format'),
  body('rider_id')
    .optional()
    .toInt()
    .isInt({ min: 1 }).withMessage('rider_id must be a positive integer'),
];

export const updateSessionValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Session id must be a positive integer'),
];

export const cancelSessionValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Session id must be a positive integer'),
  body('cancel_reason')
    .optional()
    .trim()
    .isString().withMessage('cancel_reason must be a string'),
];

export const courseSessionsParamValidation = [
  param('courseId')
    .toInt()
    .isInt({ min: 1 }).withMessage('courseId must be a positive integer'),
];

// ─── Rider Horse routes ─────────────────────────────────────────────────────

export const addRiderHorseValidation = [
  body('horse_id')
    .toInt()
    .isInt({ min: 1 }).withMessage('horse_id must be a positive integer'),
  body('stable_id')
    .optional()
    .toInt()
    .isInt({ min: 1 }).withMessage('stable_id must be a positive integer'),
];

export const removeRiderHorseValidation = [
  param('horseId')
    .toInt()
    .isInt({ min: 1 }).withMessage('horseId must be a positive integer'),
];

// ─── Notification routes ────────────────────────────────────────────────────

export const notificationIdParamValidation = [
  param('id')
    .toInt()
    .isInt({ min: 1 }).withMessage('Notification id must be a positive integer'),
];
