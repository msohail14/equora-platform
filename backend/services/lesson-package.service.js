import { Op } from 'sequelize';
import { LessonPackage, RiderPackageBalance, User, Payment } from '../models/index.js';

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

export const createPackage = async ({ coachId, payload }) => {
  const { title, lesson_count, price } = payload;

  if (!title) {
    throw new Error('title is required.');
  }
  if (!lesson_count) {
    throw new Error('lesson_count is required.');
  }
  if (!price) {
    throw new Error('price is required.');
  }

  const lessonPackage = await LessonPackage.create({
    coach_id: coachId,
    title,
    description: payload.description || null,
    lesson_count,
    price,
    validity_days: payload.validity_days || null,
    is_active: payload.is_active ?? true,
  });

  return lessonPackage;
};

export const getCoachPackages = async ({ coachId, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const { rows, count } = await LessonPackage.findAndCountAll({
    where: { coach_id: coachId, is_active: true },
    order: [['created_at', 'DESC']],
    offset,
    limit: pagination.limit,
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

export const getPackageById = async ({ packageId }) => {
  const lessonPackage = await LessonPackage.findByPk(packageId, {
    include: [
      {
        model: User,
        as: 'coach',
        attributes: ['id', 'first_name', 'last_name'],
      },
    ],
  });

  if (!lessonPackage) {
    throw new Error('Package not found.');
  }

  return lessonPackage;
};

export const updatePackage = async ({ coachId, packageId, payload }) => {
  const lessonPackage = await LessonPackage.findByPk(packageId);

  if (!lessonPackage) {
    throw new Error('Package not found.');
  }

  if (lessonPackage.coach_id !== coachId) {
    throw new Error('Access denied. You can only update your own packages.');
  }

  if (payload.title !== undefined) lessonPackage.title = payload.title;
  if (payload.description !== undefined) lessonPackage.description = payload.description;
  if (payload.lesson_count !== undefined) lessonPackage.lesson_count = payload.lesson_count;
  if (payload.price !== undefined) lessonPackage.price = payload.price;
  if (payload.validity_days !== undefined) lessonPackage.validity_days = payload.validity_days;
  if (payload.is_active !== undefined) lessonPackage.is_active = payload.is_active;

  await lessonPackage.save();

  return lessonPackage;
};

export const purchasePackage = async ({ riderId, packageId, paymentId }) => {
  const lessonPackage = await LessonPackage.findByPk(packageId);

  if (!lessonPackage) {
    throw new Error('Package not found.');
  }

  if (!lessonPackage.is_active) {
    throw new Error('Package is not active.');
  }

  let expiresAt = null;
  if (lessonPackage.validity_days) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + lessonPackage.validity_days);
  }

  const balance = await RiderPackageBalance.create({
    rider_id: riderId,
    package_id: packageId,
    remaining_lessons: lessonPackage.lesson_count,
    expires_at: expiresAt,
    payment_id: paymentId,
  });

  return balance;
};

export const deletePackage = async ({ coachId, packageId }) => {
  const pkg = await LessonPackage.findByPk(packageId);
  if (!pkg) {
    throw new Error('Package not found.');
  }
  if (pkg.coach_id !== coachId) {
    throw new Error('Access denied. You can only delete your own packages.');
  }

  await pkg.destroy();
  return { message: 'Lesson package deleted successfully.' };
};

export const getMyPackages = async ({ riderId, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const { rows, count } = await RiderPackageBalance.findAndCountAll({
    where: {
      rider_id: riderId,
      remaining_lessons: { [Op.gt]: 0 },
      expires_at: { [Op.gt]: new Date() },
    },
    include: [
      {
        model: LessonPackage,
        as: 'package',
        attributes: ['id', 'title', 'lesson_count', 'price'],
        include: [
          {
            model: User,
            as: 'coach',
            attributes: ['id', 'first_name', 'last_name'],
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
    offset,
    limit: pagination.limit,
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
