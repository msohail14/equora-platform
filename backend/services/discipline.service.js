import { Op } from 'sequelize';
import Discipline from '../models/discipline.model.js';
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

export const createDiscipline = async ({ name, icon_url, description, difficulty_level, is_active }) => {
  if (!name) {
    throw new Error('name is required.');
  }

  const existing = await Discipline.findOne({ where: { name } });
  if (existing) {
    throw new Error('Discipline already exists.');
  }

  const discipline = await Discipline.create({
    name,
    icon_url: icon_url || null,
    description: description || null,
    difficulty_level: difficulty_level || null,
    is_active: is_active ?? true,
  });

  return discipline;
};

export const getAllDisciplines = async ({ include_inactive, search, page, limit } = {}) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;
  const where = {};
  if (!include_inactive) {
    where.is_active = true;
  }
  const keyword = String(search || '').trim();
  if (keyword) {
    where[Op.or] = [
      { name: { [Op.like]: `%${keyword}%` } },
      { description: { [Op.like]: `%${keyword}%` } },
      { difficulty_level: { [Op.like]: `%${keyword}%` } },
    ];
  }

  const { rows, count } = await Discipline.findAndCountAll({
    where,
    order: [['id', 'DESC']],
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

export const getDisciplineById = async (disciplineId) => {
  const discipline = await Discipline.findByPk(disciplineId);
  if (!discipline) {
    throw new Error('Discipline not found.');
  }
  return discipline;
};

export const updateDiscipline = async (disciplineId, payload) => {
  const discipline = await Discipline.findByPk(disciplineId);
  if (!discipline) {
    throw new Error('Discipline not found.');
  }

  if (payload.name && payload.name !== discipline.name) {
    const existing = await Discipline.findOne({ where: { name: payload.name } });
    if (existing) {
      throw new Error('Discipline already exists.');
    }
  }

  const previousIconUrl = discipline.icon_url;

  discipline.name = payload.name ?? discipline.name;
  discipline.icon_url = payload.icon_url ?? discipline.icon_url;
  discipline.description = payload.description ?? discipline.description;
  discipline.difficulty_level = payload.difficulty_level ?? discipline.difficulty_level;
  discipline.is_active = payload.is_active ?? discipline.is_active;
  await discipline.save();

  if (payload.icon_url && previousIconUrl && previousIconUrl !== payload.icon_url) {
    try {
      await deleteFileIfExists(toAbsolutePathFromPublic(previousIconUrl));
    } catch (_error) {
      // Do not fail update if old file cleanup fails.
    }
  }

  return discipline;
};

export const deleteDiscipline = async (disciplineId) => {
  const discipline = await Discipline.findByPk(disciplineId);
  if (!discipline) {
    throw new Error('Discipline not found.');
  }

  if (!discipline.is_active) {
    throw new Error('Discipline is already deactivated.');
  }

  // Soft delete - deactivate instead of removing
  discipline.is_active = false;
  await discipline.save();

  return { message: 'Discipline deactivated successfully.' };
};
