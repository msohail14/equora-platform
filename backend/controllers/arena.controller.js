import {
  createArena,
  deleteArena,
  getAllArenas,
  getArenaById,
  updateArena,
} from '../services/arena.service.js';
import { deleteFileIfExists, toPublicUploadPath } from '../utils/file.util.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('not found') ||
    error.message.includes('access denied') ||
    error.message.includes('must be');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createArenaController = async (req, res) => {
  try {
    const image_url = req.file ? toPublicUploadPath(req.file.path) : null;
    const data = await createArena({
      adminId: req.user.id,
      payload: { ...req.body, image_url },
    });
    return res.status(201).json(data);
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const getAllArenasController = async (req, res) => {
  try {
    const data = await getAllArenas({
      adminId: req.user.id,
      stableId: req.query.stable_id,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAllArenasGlobalController = async (req, res) => {
  try {
    const data = await getAllArenas({
      adminId: req.user.id,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getArenaByIdController = async (req, res) => {
  try {
    const data = await getArenaById({
      adminId: req.user.id,
      arenaId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateArenaController = async (req, res) => {
  try {
    const image_url = req.file ? toPublicUploadPath(req.file.path) : undefined;
    const data = await updateArena({
      adminId: req.user.id,
      arenaId: req.params.id,
      payload: { ...req.body, image_url },
    });
    return res.status(200).json(data);
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const deleteArenaController = async (req, res) => {
  try {
    const data = await deleteArena({
      adminId: req.user.id,
      arenaId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
