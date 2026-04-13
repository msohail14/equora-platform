import {
  createHorse,
  deleteHorse,
  getAllHorses,
  getHorseById,
  updateHorse,
} from '../services/horse.service.js';
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

export const createHorseController = async (req, res) => {
  try {
    const profile_picture_url = req.file ? toPublicUploadPath(req.file.path) : null;
    const data = await createHorse({
      adminId: req.user.id,
      payload: {
        ...req.body,
        profile_picture_url,
      },
    });
    return res.status(201).json(data);
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const getAllHorsesController = async (req, res) => {
  try {
    const data = await getAllHorses({
      adminId: req.user.id,
      adminRole: req.user.role,
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

export const getAllHorsesGlobalController = async (req, res) => {
  try {
    const featured = String(req.query.featured || 'false').toLowerCase() === 'true';
    const data = await getAllHorses({
      adminId: req.user?.id ?? null,
      adminRole: req.user?.role,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
      featured: featured || undefined,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getHorseByIdController = async (req, res) => {
  try {
    const data = await getHorseById({
      adminId: req.user?.id ?? null,
      adminRole: req.user?.role,
      horseId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateHorseController = async (req, res) => {
  try {
    const profile_picture_url = req.file ? toPublicUploadPath(req.file.path) : undefined;
    const data = await updateHorse({
      adminId: req.user.id,
      adminRole: req.user.role,
      horseId: req.params.id,
      payload: {
        ...req.body,
        profile_picture_url,
      },
    });
    return res.status(200).json(data);
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const deleteHorseController = async (req, res) => {
  try {
    const data = await deleteHorse({
      adminId: req.user.id,
      adminRole: req.user.role,
      horseId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
