import { Op } from 'sequelize';
import Discipline from '../models/discipline.model.js';
import Horse from '../models/horse.model.js';
import Stable from '../models/stable.model.js';
import { deleteFileIfExists, toAbsolutePathFromPublic } from '../utils/file.util.js';

const ensureDisciplineExists = async (disciplineId) => {
  const discipline = await Discipline.findByPk(disciplineId);
  if (!discipline) {
    throw new Error('Discipline not found.');
  }
};

const ensureStableOwnedByAdmin = async (adminId, stableId) => {
  const stable = await Stable.findOne({
    where: {
      id: stableId,
      admin_id: adminId,
    },
  });

  if (!stable) {
    throw new Error('Stable not found or access denied.');
  }

  return stable;
};

const getAdminStableIds = async (adminId) => {
  const stables = await Stable.findAll({
    attributes: ['id'],
    where: { admin_id: adminId },
  });
  return stables.map((stable) => stable.id);
};

const horseInclude = [
  {
    model: Stable,
    as: 'stable',
    attributes: ['id', 'name', 'admin_id'],
  },
  {
    model: Discipline,
    as: 'discipline',
    attributes: ['id', 'name', 'difficulty_level'],
  },
];

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

export const createHorse = async ({ adminId, payload }) => {
  const { name, breed, description, discipline_id, profile_picture_url, stable_id, status } = payload;

  if (!name || !discipline_id || !stable_id || !profile_picture_url) {
    throw new Error('name, discipline_id, stable_id, and profile_picture_url are required.');
  }

  await ensureStableOwnedByAdmin(adminId, stable_id);
  await ensureDisciplineExists(discipline_id);

  const horse = await Horse.create({
    name,
    breed: breed || null,
    description: description || null,
    discipline_id,
    profile_picture_url: profile_picture_url || null,
    stable_id,
    status: status || 'available',
  });

  return horse;
};

export const getAllHorses = async ({ adminId, stableId, search, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  let stableIds = null;
  if (adminId) {
    stableIds = await getAdminStableIds(adminId);
    if (stableIds.length === 0) {
      return {
        data: [],
        pagination: buildPaginationMeta({
          currentPage: pagination.page,
          limit: pagination.limit,
          totalRecords: 0,
        }),
      };
    }
  }

  const where = {};
  const keyword = String(search || '').trim();
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { breed: { [Op.like]: `%${keyword}%` } },
      { description: { [Op.like]: `%${keyword}%` } },
      { status: { [Op.like]: `%${keyword}%` } },
      { '$stable.name$': { [Op.like]: `%${keyword}%` } },
      { '$discipline.name$': { [Op.like]: `%${keyword}%` } },
    ];
  }

  if (stableId !== undefined) {
    const parsedStableId = Number(stableId);
    if (Number.isNaN(parsedStableId)) {
      throw new Error('stable_id must be a valid number.');
    }
    if (stableIds && !stableIds.includes(parsedStableId)) {
      throw new Error('Stable not found or access denied.');
    }
    where.stable_id = parsedStableId;
  } else if (stableIds) {
    where.stable_id = { [Op.in]: stableIds };
  }

  const { rows, count } = await Horse.findAndCountAll({
    where,
    include: horseInclude,
    order: [['id', 'DESC']],
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

export const getHorseById = async ({ adminId, horseId }) => {
  const horse = await Horse.findByPk(horseId, { include: horseInclude });
  if (!horse) {
    throw new Error('Horse not found.');
  }

  if (adminId) {
    await ensureStableOwnedByAdmin(adminId, horse.stable_id);
  }
  return horse;
};

export const updateHorse = async ({ adminId, horseId, payload }) => {
  const horse = await Horse.findByPk(horseId);
  if (!horse) {
    throw new Error('Horse not found.');
  }

  await ensureStableOwnedByAdmin(adminId, horse.stable_id);
  const previousPictureUrl = horse.profile_picture_url;

  if (payload.stable_id !== undefined) {
    await ensureStableOwnedByAdmin(adminId, payload.stable_id);
    horse.stable_id = payload.stable_id;
  }

  if (payload.discipline_id !== undefined) {
    await ensureDisciplineExists(payload.discipline_id);
    horse.discipline_id = payload.discipline_id;
  }

  horse.name = payload.name ?? horse.name;
  horse.breed = payload.breed ?? horse.breed;
  if (payload.description !== undefined) {
    horse.description = payload.description || null;
  }
  horse.profile_picture_url = payload.profile_picture_url ?? horse.profile_picture_url;
  horse.status = payload.status ?? horse.status;
  await horse.save();

  if (payload.profile_picture_url && previousPictureUrl && previousPictureUrl !== payload.profile_picture_url) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousPictureUrl));
    } catch (_error) {
      // Do not fail update if old file cleanup fails.
    }
  }

  return horse;
};

export const deleteHorse = async ({ adminId, horseId }) => {
  const horse = await Horse.findByPk(horseId);
  if (!horse) {
    throw new Error('Horse not found.');
  }

  await ensureStableOwnedByAdmin(adminId, horse.stable_id);
  const previousPictureUrl = horse.profile_picture_url;

  await horse.destroy();

  if (previousPictureUrl) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousPictureUrl));
    } catch (_error) {
      // Do not fail delete if file cleanup fails.
    }
  }

  return { message: 'Horse deleted successfully.' };
};
