import { Op } from 'sequelize';
import Arena from '../models/arena.model.js';
import Discipline from '../models/discipline.model.js';
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

const arenaInclude = [
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

export const createArena = async ({ adminId, payload }) => {
  const { stable_id, name, description, image_url, capacity, discipline_id } = payload;

  if (!stable_id || !name || !discipline_id || !image_url) {
    throw new Error('stable_id, name, discipline_id, and image_url are required.');
  }

  await ensureStableOwnedByAdmin(adminId, stable_id);
  await ensureDisciplineExists(discipline_id);

  const parsedCapacity = capacity === undefined ? 1 : Number(capacity);
  if (Number.isNaN(parsedCapacity) || parsedCapacity < 1) {
    throw new Error('capacity must be a number greater than or equal to 1.');
  }

  const arena = await Arena.create({
    stable_id,
    name,
    description: description || null,
    image_url: image_url || null,
    capacity: parsedCapacity,
    discipline_id,
  });

  return arena;
};

export const getAllArenas = async ({ adminId, stableId, search, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;
  const stableIds = await getAdminStableIds(adminId);
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

  const where = {};
  const keyword = String(search || '').trim();
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { description: { [Op.like]: `%${keyword}%` } },
      { '$stable.name$': { [Op.like]: `%${keyword}%` } },
      { '$discipline.name$': { [Op.like]: `%${keyword}%` } },
    ];
  }

  if (stableId !== undefined) {
    const parsedStableId = Number(stableId);
    if (Number.isNaN(parsedStableId)) {
      throw new Error('stable_id must be a valid number.');
    }
    if (!stableIds.includes(parsedStableId)) {
      throw new Error('Stable not found or access denied.');
    }
    where.stable_id = parsedStableId;
  } else {
    where.stable_id = { [Op.in]: stableIds };
  }

  const { rows, count } = await Arena.findAndCountAll({
    where,
    include: arenaInclude,
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

export const getArenaById = async ({ adminId, arenaId }) => {
  const arena = await Arena.findByPk(arenaId);
  if (!arena) {
    throw new Error('Arena not found.');
  }

  await ensureStableOwnedByAdmin(adminId, arena.stable_id);
  return arena;
};

export const updateArena = async ({ adminId, arenaId, payload }) => {
  const arena = await Arena.findByPk(arenaId);
  if (!arena) {
    throw new Error('Arena not found.');
  }

  await ensureStableOwnedByAdmin(adminId, arena.stable_id);

  const previousImageUrl = arena.image_url;

  if (payload.stable_id !== undefined) {
    await ensureStableOwnedByAdmin(adminId, payload.stable_id);
    arena.stable_id = payload.stable_id;
  }

  if (payload.discipline_id !== undefined) {
    await ensureDisciplineExists(payload.discipline_id);
    arena.discipline_id = payload.discipline_id;
  }

  if (payload.name !== undefined) {
    arena.name = payload.name;
  }

  if (payload.description !== undefined) {
    arena.description = payload.description || null;
  }

  if (payload.image_url !== undefined) {
    arena.image_url = payload.image_url;
  }

  if (payload.capacity !== undefined) {
    const parsedCapacity = Number(payload.capacity);
    if (Number.isNaN(parsedCapacity) || parsedCapacity < 1) {
      throw new Error('capacity must be a number greater than or equal to 1.');
    }
    arena.capacity = parsedCapacity;
  }

  await arena.save();

  if (payload.image_url && previousImageUrl && previousImageUrl !== payload.image_url) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousImageUrl));
    } catch (_error) {
      // Do not fail update if old file cleanup fails.
    }
  }

  return arena;
};

export const deleteArena = async ({ adminId, arenaId }) => {
  const arena = await Arena.findByPk(arenaId);
  if (!arena) {
    throw new Error('Arena not found.');
  }

  await ensureStableOwnedByAdmin(adminId, arena.stable_id);
  const previousImageUrl = arena.image_url;
  await arena.destroy();

  if (previousImageUrl) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousImageUrl));
    } catch (_error) {
      // Do not fail delete if image cleanup fails.
    }
  }

  return { message: 'Arena deleted successfully.' };
};
