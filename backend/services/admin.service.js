import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op, QueryTypes } from 'sequelize';
import Admin from '../models/admin.model.js';
import sequelize from '../config/database.js';
import { Arena, CoachPayout, Course, CourseEnrollment, CourseSession, Discipline, Horse, LessonBooking, Payment, PlatformSetting, Stable, User } from '../models/index.js';
import { sendResetPasswordLinkEmail, sendResetTokenEmail } from './mail.service.js';
import { validatePasswordStrength } from '../utils/validators.js';

const publicAdminFields = ['id', 'email', 'first_name', 'last_name', 'role', 'created_at'];

const normalizePagination = ({ page, limit } = {}) => {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  return { page: p, limit: l, offset: (p - 1) * l };
};

const buildPaginationMeta = ({ totalItems, page, limit }) => ({
  total_items: totalItems,
  current_page: page,
  per_page: limit,
  total_pages: Math.ceil(totalItems / limit),
});

const getAdminJwtToken = (admin) =>
  jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      type: 'admin',
      role: admin.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d', issuer: 'equora-api', audience: 'equora-mobile' }
  );

export const signupAdmin = async ({ email, password, first_name, last_name, invite_secret }) => {
  const requiredSecret = process.env.ADMIN_INVITE_SECRET;
  if (requiredSecret && invite_secret !== requiredSecret) {
    throw new Error('Invalid or missing invite secret.');
  }

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  validatePasswordStrength(password);

  const existingAdmin = await Admin.findOne({ where: { email } });
  if (existingAdmin) {
    throw new Error('Email already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await Admin.create({
    email,
    password_hash: hashedPassword,
    first_name: first_name || null,
    last_name: last_name || null,
  });

  const token = getAdminJwtToken(admin);
  const safeAdmin = await Admin.findByPk(admin.id, { attributes: publicAdminFields });

  return { admin: safeAdmin, token };
};

export const loginAdmin = async ({ email, password }) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    throw new Error('Invalid email or password.');
  }

  if (!admin.password_hash) {
    throw new Error('This account uses passwordless login. Please sign in with your phone or magic link.');
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  const token = getAdminJwtToken(admin);
  const safeAdmin = await Admin.findByPk(admin.id, { attributes: publicAdminFields });
  const adminData = safeAdmin.toJSON();

  if (adminData.role === 'stable_owner') {
    const stable = await Stable.findOne({ where: { admin_id: adminData.id }, attributes: ['id'] });
    if (stable) adminData.stable_id = stable.id;
  }

  return { admin: adminData, token };
};

export const forgotAdminPassword = async ({ email }) => {
  if (!email) {
    throw new Error('Email is required.');
  }

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    return {
      message: 'If the email exists, a reset token has been generated.',
    };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiryMinutes = Number(process.env.RESET_TOKEN_EXPIRES_MINUTES || 15);
  const expiryDate = new Date(Date.now() + expiryMinutes * 60 * 1000);

  admin.reset_password_token = resetToken;
  admin.reset_password_expires = expiryDate;
  await admin.save();

  const frontendBaseUrl = process.env.FRONTEND_URL_PROD || process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendBaseUrl.replace(/\/+$/, '')}/admin/reset-password?token=${resetToken}`;

  await sendResetTokenEmail({
    to: admin.email,
    resetToken,
    name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Admin',
    expiresMinutes: expiryMinutes,
  });

  await sendResetPasswordLinkEmail({
    to: admin.email,
    resetLink,
    name: `${admin.first_name || ''} ${admin.last_name || ''}`.trim() || 'Admin',
    expiresMinutes: expiryMinutes,
  });

  return {
    message: 'Password reset instructions sent to email successfully.',
  };
};

export const resetAdminPassword = async ({ token, new_password }) => {
  if (!token || !new_password) {
    throw new Error('Token and new_password are required.');
  }

  validatePasswordStrength(new_password);

  const admin = await Admin.findOne({
    where: {
      reset_password_token: token,
      reset_password_expires: {
        [Op.gt]: new Date(),
      },
    },
  });

  if (!admin) {
    throw new Error('Invalid or expired reset token.');
  }

  admin.password_hash = await bcrypt.hash(new_password, 10);
  admin.reset_password_token = null;
  admin.reset_password_expires = null;
  await admin.save();

  return { message: 'Password reset successfully.' };
};

export const changeAdminPassword = async ({ adminId, current_password, new_password }) => {
  if (!current_password || !new_password) {
    throw new Error('current_password and new_password are required.');
  }

  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    throw new Error('Admin not found.');
  }

  if (!admin.password_hash) {
    throw new Error('This account uses passwordless login. Set a password first in your profile settings.');
  }

  const isPasswordValid = await bcrypt.compare(current_password, admin.password_hash);
  if (!isPasswordValid) {
    throw new Error('Current password is incorrect.');
  }

  admin.password_hash = await bcrypt.hash(new_password, 10);
  await admin.save();

  return { message: 'Password changed successfully.' };
};

export const changeAdminProfile = async ({ adminId, first_name, last_name }) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) {
    throw new Error('Admin not found.');
  }

  admin.first_name = first_name ?? admin.first_name;
  admin.last_name = last_name ?? admin.last_name;
  await admin.save();

  const safeAdmin = await Admin.findByPk(admin.id, { attributes: publicAdminFields });
  return { message: 'Profile updated successfully.', admin: safeAdmin };
};

/**
 * Super admin: reset a stable owner's password.
 */
export const resetStableOwnerPassword = async (adminId, { password } = {}) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new Error('Admin account not found.');

  const temporaryPassword = password || crypto.randomBytes(12).toString('hex');
  admin.password_hash = await bcrypt.hash(temporaryPassword, 10);
  admin.auth_method = 'email_password';
  await admin.save();

  return {
    message: 'Password reset successfully.',
    temporary_password: temporaryPassword,
  };
};

/**
 * Super admin: update a stable owner's email and profile.
 */
export const updateStableOwnerProfile = async (adminId, { email, first_name, last_name, mobile_number }) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new Error('Admin account not found.');

  if (email && email !== admin.email) {
    const existing = await Admin.findOne({ where: { email, id: { [Op.ne]: adminId } } });
    if (existing) throw new Error('This email is already in use by another admin.');
    admin.email = email;
  }
  if (first_name !== undefined) admin.first_name = first_name;
  if (last_name !== undefined) admin.last_name = last_name;
  if (mobile_number !== undefined) admin.mobile_number = mobile_number;
  await admin.save();

  const safeAdmin = await Admin.findByPk(admin.id, { attributes: [...publicAdminFields, 'mobile_number'] });
  return { message: 'Profile updated.', admin: safeAdmin };
};

/**
 * Super admin: delete a stable owner account.
 */
export const deleteStableOwner = async (adminId) => {
  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new Error('Admin account not found.');
  if (admin.role === 'super_admin') throw new Error('Cannot delete a super admin.');

  // Unlink stables (set admin_id to null, keep stable data)
  await Stable.update({ admin_id: null }, { where: { admin_id: adminId } });

  await admin.destroy();
  return { message: 'Stable owner account deleted.' };
};

/**
 * Super admin: list all admin accounts (for management).
 */
export const listAdminAccounts = async ({ role, page, limit } = {}) => {
  const pagination = normalizePagination({ page, limit });
  const where = {};
  if (role) where.role = role;

  const { count, rows } = await Admin.findAndCountAll({
    where,
    attributes: [...publicAdminFields, 'mobile_number', 'is_email_verified', 'auth_method'],
    order: [['created_at', 'DESC']],
    limit: pagination.limit,
    offset: pagination.offset,
  });

  // Attach stable info for each stable_owner
  const adminsWithStables = await Promise.all(
    rows.map(async (admin) => {
      const data = admin.toJSON();
      if (data.role === 'stable_owner') {
        const stable = await Stable.findOne({ where: { admin_id: admin.id }, attributes: ['id', 'name'] });
        data.stable = stable ? { id: stable.id, name: stable.name } : null;
      }
      return data;
    })
  );

  return {
    data: adminsWithStables,
    pagination: {
      totalRecords: count,
      currentPage: pagination.page,
      totalPages: Math.ceil(count / pagination.limit),
    },
  };
};

const toNumber = (value) => Number(value || 0);

const toISODate = (date) => date.toISOString().slice(0, 10);

const getDailyBuckets = async () => {
  const days = 7;
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = await sequelize.query(
    `
      SELECT DATE(enrolled_at) AS bucket_date, COUNT(*) AS total_count
      FROM course_enrollments
      WHERE enrolled_at >= :startDate
      GROUP BY DATE(enrolled_at)
      ORDER BY bucket_date ASC
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { startDate: start },
    }
  );

  const rowMap = new Map(
    rows.map((row) => [
      row.bucket_date instanceof Date ? toISODate(row.bucket_date) : String(row.bucket_date),
      toNumber(row.total_count),
    ])
  );

  const result = [];
  for (let index = 0; index < days; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = toISODate(date);
    result.push({
      label: key,
      count: rowMap.get(key) || 0,
    });
  }
  return result;
};

const getWeeklyBuckets = async () => {
  const weeks = 12;
  const start = new Date();
  start.setDate(start.getDate() - 7 * (weeks - 1));
  start.setHours(0, 0, 0, 0);

  const rows = await sequelize.query(
    `
      SELECT
        YEARWEEK(enrolled_at, 1) AS year_week,
        DATE(DATE_SUB(enrolled_at, INTERVAL WEEKDAY(enrolled_at) DAY)) AS week_start,
        COUNT(*) AS total_count
      FROM course_enrollments
      WHERE enrolled_at >= :startDate
      GROUP BY YEARWEEK(enrolled_at, 1), DATE(DATE_SUB(enrolled_at, INTERVAL WEEKDAY(enrolled_at) DAY))
      ORDER BY year_week ASC
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { startDate: start },
    }
  );

  const rowMap = new Map(
    rows.map((row) => [
      row.week_start instanceof Date ? toISODate(row.week_start) : String(row.week_start),
      toNumber(row.total_count),
    ])
  );

  const today = new Date();
  const currentWeekday = (today.getDay() + 6) % 7;
  const thisWeekMonday = new Date(today);
  thisWeekMonday.setDate(today.getDate() - currentWeekday);
  thisWeekMonday.setHours(0, 0, 0, 0);

  const firstWeek = new Date(thisWeekMonday);
  firstWeek.setDate(thisWeekMonday.getDate() - 7 * (weeks - 1));

  const result = [];
  for (let index = 0; index < weeks; index += 1) {
    const weekStart = new Date(firstWeek);
    weekStart.setDate(firstWeek.getDate() + index * 7);
    const key = toISODate(weekStart);
    result.push({
      label: key,
      count: rowMap.get(key) || 0,
    });
  }
  return result;
};

const getMonthlyBuckets = async () => {
  const months = 12;
  const start = new Date();
  start.setMonth(start.getMonth() - (months - 1), 1);
  start.setHours(0, 0, 0, 0);

  const rows = await sequelize.query(
    `
      SELECT DATE_FORMAT(enrolled_at, '%Y-%m') AS month_key, COUNT(*) AS total_count
      FROM course_enrollments
      WHERE enrolled_at >= :startDate
      GROUP BY DATE_FORMAT(enrolled_at, '%Y-%m')
      ORDER BY month_key ASC
    `,
    {
      type: QueryTypes.SELECT,
      replacements: { startDate: start },
    }
  );

  const rowMap = new Map(rows.map((row) => [String(row.month_key), toNumber(row.total_count)]));

  const result = [];
  for (let index = 0; index < months; index += 1) {
    const date = new Date(start);
    date.setMonth(start.getMonth() + index, 1);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    result.push({
      label: monthKey,
      count: rowMap.get(monthKey) || 0,
    });
  }
  return result;
};

const getStableOwnerDashboardData = async (adminId) => {
  const stable = await Stable.findOne({ where: { admin_id: adminId } });
  if (!stable) {
    throw new Error('No stable linked to this account.');
  }

  const stableId = stable.id;

  const [
    totalArenas,
    totalHorses,
    activeHorses,
    totalCourses,
    activeCourses,
    totalEnrollments,
    activeEnrollments,
  ] = await Promise.all([
    Arena.count({ where: { stable_id: stableId } }),
    Horse.count({ where: { stable_id: stableId } }),
    Horse.count({ where: { stable_id: stableId, status: 'available' } }),
    Course.count({ where: { stable_id: stableId } }),
    Course.count({ where: { stable_id: stableId, is_active: true } }),
    CourseEnrollment.count({
      include: [{ model: Course, as: 'course', attributes: [], required: true, where: { stable_id: stableId } }],
    }),
    CourseEnrollment.count({
      where: { status: 'active' },
      include: [{ model: Course, as: 'course', attributes: [], required: true, where: { stable_id: stableId } }],
    }),
  ]);

  return {
    stable: { id: stable.id, name: stable.name },
    stats: {
      total_arenas: totalArenas,
      total_horses: totalHorses,
      active_horses: activeHorses,
      total_courses: totalCourses,
      active_courses: activeCourses,
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments,
    },
  };
};

export const getAdminDashboardData = async (user) => {
  if (user?.role === 'stable_owner') {
    return getStableOwnerDashboardData(user.id);
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalStables,
    activeStables,
    pendingStables,
    totalArenas,
    activeArenas,
    totalHorses,
    totalDisciplines,
    activeDisciplines,
    totalCoaches,
    activeCoaches,
    unverifiedCoaches,
    totalRiders,
    activeRiders,
    totalCourses,
    totalEnrollments,
    activeHorses,
    activeCourses,
    activeEnrollments,
    dailyEnrollments,
    weeklyEnrollments,
    monthlyEnrollments,
    totalRevenueRows,
    revenueMtdRows,
  ] = await Promise.all([
    Stable.count(),
    Stable.count({ where: { is_active: true } }),
    Stable.count({ where: { is_approved: false } }),
    Arena.count(),
    Arena.count({
      include: [
        {
          model: Stable,
          as: 'stable',
          attributes: [],
          required: true,
          where: { is_active: true },
        },
      ],
    }),
    Horse.count(),
    Discipline.count(),
    Discipline.count({ where: { is_active: true } }),
    User.count({ where: { role: 'coach' } }),
    User.count({ where: { role: 'coach', is_verified: true } }),
    User.count({ where: { role: 'coach', is_verified: false } }),
    User.count({ where: { role: 'rider' } }),
    User.count({ where: { role: 'rider', is_active: true } }),
    Course.count(),
    CourseEnrollment.count(),
    Horse.count({ where: { status: 'available' } }),
    Course.count({ where: { is_active: true } }),
    CourseEnrollment.count({ where: { status: 'active' } }),
    getDailyBuckets(),
    getWeeklyBuckets(),
    getMonthlyBuckets(),
    sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'`,
      { type: QueryTypes.SELECT }
    ),
    sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed' AND created_at >= :monthStart`,
      { type: QueryTypes.SELECT, replacements: { monthStart } }
    ),
  ]);

  const totalRevenue = Number(totalRevenueRows[0]?.total || 0);
  const revenue_mtd = Number(revenueMtdRows[0]?.total || 0);

  return {
    stats: {
      total_stables: totalStables,
      active_stables: activeStables,
      pending_stables: pendingStables,
      total_arenas: totalArenas,
      active_arenas: activeArenas,
      total_horses: totalHorses,
      active_horses: activeHorses,
      total_disciplines: totalDisciplines,
      active_disciplines: activeDisciplines,
      total_coaches: totalCoaches,
      active_coaches: activeCoaches,
      unverified_coaches: unverifiedCoaches,
      total_riders: totalRiders,
      active_riders: activeRiders,
      total_courses: totalCourses,
      active_courses: activeCourses,
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments,
      total_revenue: totalRevenue,
      revenue_mtd: revenue_mtd,
    },
    enrollment_trends: {
      daily: dailyEnrollments,
      weekly: weeklyEnrollments,
      monthly: monthlyEnrollments,
    },
  };
};

export const getAdminAnalytics = async ({ startDate, endDate }) => {
  if (!startDate || !endDate) {
    throw new Error('startDate and endDate are required.');
  }

  const [riderGrowth, bookingVolume, revenue, totalRevenueRows, totalBookings] = await Promise.all([
    sequelize.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM user WHERE role = 'rider' AND created_at BETWEEN :startDate AND :endDate
       GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC`,
      { type: QueryTypes.SELECT, replacements: { startDate, endDate } }
    ),
    sequelize.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM lesson_bookings WHERE created_at BETWEEN :startDate AND :endDate
       GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC`,
      { type: QueryTypes.SELECT, replacements: { startDate, endDate } }
    ),
    sequelize.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, SUM(amount) AS total
       FROM payments WHERE status = 'completed' AND created_at BETWEEN :startDate AND :endDate
       GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month ASC`,
      { type: QueryTypes.SELECT, replacements: { startDate, endDate } }
    ),
    sequelize.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'`,
      { type: QueryTypes.SELECT }
    ),
    LessonBooking.count(),
  ]);

  return {
    rider_growth: riderGrowth,
    booking_volume: bookingVolume,
    revenue,
    total_revenue: Number(totalRevenueRows[0]?.total || 0),
    total_bookings: totalBookings,
  };
};

export const getAdminPayments = async ({ status, provider, page, limit }) => {
  const { page: p, limit: l, offset } = normalizePagination({ page, limit });
  const where = {};
  if (status) where.status = status;
  if (provider) where.provider = provider;

  const { count, rows } = await Payment.findAndCountAll({
    where,
    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name', 'email'] }],
    order: [['created_at', 'DESC']],
    limit: l,
    offset,
  });

  return { data: rows, pagination: buildPaginationMeta({ totalItems: count, page: p, limit: l }) };
};

export const getAdminPayouts = async ({ status, page, limit }) => {
  const { page: p, limit: l, offset } = normalizePagination({ page, limit });
  const where = {};
  if (status) where.status = status;

  const { count, rows } = await CoachPayout.findAndCountAll({
    where,
    include: [
      { model: User, as: 'coach', attributes: ['first_name', 'last_name'] },
      { model: CourseSession, as: 'session' },
    ],
    order: [['created_at', 'DESC']],
    limit: l,
    offset,
  });

  return { data: rows, pagination: buildPaginationMeta({ totalItems: count, page: p, limit: l }) };
};

export const processAdminPayout = async ({ payoutId }) => {
  const payout = await CoachPayout.findByPk(payoutId);
  if (!payout) {
    throw new Error('Payout not found.');
  }
  if (payout.status !== 'pending') {
    throw new Error('Only pending payouts can be processed.');
  }

  payout.status = 'processing';
  payout.payout_date = new Date().toISOString().slice(0, 10);
  await payout.save();

  return payout;
};

export const approveStable = async ({ stableId }) => {
  const stable = await Stable.findByPk(stableId);
  if (!stable) {
    throw new Error('Stable not found.');
  }

  stable.is_approved = true;
  await stable.save();

  return stable;
};

export const verifyCoach = async ({ coachId }) => {
  const user = await User.findByPk(coachId);
  if (!user) {
    throw new Error('Coach not found.');
  }
  if (user.role !== 'coach') {
    throw new Error('User is not a coach.');
  }

  user.is_verified = true;
  await user.save();

  return user;
};

export const getAdminSettings = async () => {
  const settings = await PlatformSetting.findAll();
  const result = {};
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }
  return result;
};

export const updateAdminSettings = async ({ settings }) => {
  if (!settings || typeof settings !== 'object') {
    throw new Error('Settings object is required.');
  }

  for (const [key, value] of Object.entries(settings)) {
    const [record] = await PlatformSetting.findOrCreate({
      where: { key },
      defaults: { key, value },
    });
    if (record.value !== value) {
      record.value = value;
      await record.save();
    }
  }

  return getAdminSettings();
};

export const inviteStableOwner = async ({ stableId, email, firstName, lastName, password }, invitedByAdminId) => {
  const invitingAdmin = await Admin.findByPk(invitedByAdminId);
  if (!invitingAdmin || invitingAdmin.role !== 'super_admin') {
    throw new Error('Only super admins can invite stable owners.');
  }

  const stable = await Stable.findByPk(stableId);
  if (!stable) {
    throw new Error('Stable not found.');
  }

  const existingAdmin = await Admin.findOne({ where: { email } });
  if (existingAdmin) {
    throw new Error('Email already exists.');
  }

  const finalPassword = password || crypto.randomBytes(16).toString('hex');
  const hashedPassword = await bcrypt.hash(finalPassword, 10);

  const newAdmin = await Admin.create({
    email,
    password_hash: hashedPassword,
    first_name: firstName || null,
    last_name: lastName || null,
    role: 'stable_owner',
  });

  stable.admin_id = newAdmin.id;
  await stable.save();

  const safeAdmin = await Admin.findByPk(newAdmin.id, { attributes: publicAdminFields });
  return { admin: safeAdmin, stable_id: stable.id, temp_password: password ? undefined : finalPassword };
};

export const getAdminBookings = async ({ status, page, limit, date }) => {
  const { page: p, limit: l, offset } = normalizePagination({ page, limit });
  const where = {};
  if (status) where.status = status;
  if (date) where.booking_date = date;

  const { count, rows } = await LessonBooking.findAndCountAll({
    where,
    include: [
      { model: User, as: 'rider', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: User, as: 'coach', attributes: ['id', 'first_name', 'last_name', 'email'] },
      { model: Stable, as: 'stable', attributes: ['id', 'name'] },
      { model: Horse, as: 'horse', attributes: ['id', 'name'] },
    ],
    order: [['created_at', 'DESC']],
    limit: l,
    offset,
  });

  return { data: rows, pagination: buildPaginationMeta({ totalItems: count, page: p, limit: l }) };
};
