import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op, QueryTypes } from 'sequelize';
import Admin from '../models/admin.model.js';
import sequelize from '../config/database.js';
import { Arena, Course, CourseEnrollment, Discipline, Horse, Stable, User } from '../models/index.js';
import { sendResetPasswordLinkEmail, sendResetTokenEmail } from './mail.service.js';

const publicAdminFields = ['id', 'email', 'first_name', 'last_name', 'created_at'];

const getAdminJwtToken = (admin) =>
  jwt.sign(
    {
      id: admin.id,
      email: admin.email,
      type: 'admin',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

export const signupAdmin = async ({ email, password, first_name, last_name }) => {
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

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

  const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid email or password.');
  }

  const token = getAdminJwtToken(admin);
  const safeAdmin = await Admin.findByPk(admin.id, { attributes: publicAdminFields });

  return { admin: safeAdmin, token };
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

  const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
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

export const getAdminDashboardData = async () => {
  const [
    totalStables,
    activeStables,
    totalArenas,
    activeArenas,
    totalHorses,
    totalDisciplines,
    activeDisciplines,
    totalCoaches,
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
  ] = await Promise.all([
    Stable.count(),
    Stable.count({ where: { is_active: true } }),
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
  ]);

  return {
    stats: {
      total_stables: totalStables,
      active_stables: activeStables,
      total_arenas: totalArenas,
      active_arenas: activeArenas,
      total_horses: totalHorses,
      active_horses: activeHorses,
      total_disciplines: totalDisciplines,
      active_disciplines: activeDisciplines,
      total_coaches: totalCoaches,
      total_riders: totalRiders,
      active_riders: activeRiders,
      total_courses: totalCourses,
      active_courses: activeCourses,
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments,
    },
    enrollment_trends: {
      daily: dailyEnrollments,
      weekly: weeklyEnrollments,
      monthly: monthlyEnrollments,
    },
  };
};
