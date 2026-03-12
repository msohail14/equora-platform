import {
  createStable,
  deleteStable,
  getAllStables,
  getStableById,
  updateStable,
} from '../services/stable.service.js';
import { deleteFileIfExists, toPublicUploadPath } from '../utils/file.util.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('not found') ||
    error.message.includes('valid number');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createStableController = async (req, res) => {
  try {
    const logo_url = req.file ? toPublicUploadPath(req.file.path) : null;
    const data = await createStable({
      adminId: req.user.id,
      payload: {
        ...req.body,
        logo_url,
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

export const getAllStablesController = async (req, res) => {
  try {
    const include_inactive = String(req.query.include_inactive || 'false').toLowerCase() === 'true';
    const data = await getAllStables({
      adminId: req.user.id,
      include_inactive,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getStableByIdController = async (req, res) => {
  try {
    const data = await getStableById({
      adminId: req.user.id,
      stableId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateStableController = async (req, res) => {
  try {
    const logo_url = req.file ? toPublicUploadPath(req.file.path) : undefined;
    const data = await updateStable({
      adminId: req.user.id,
      stableId: req.params.id,
      payload: {
        ...req.body,
        logo_url,
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

export const deleteStableController = async (req, res) => {
  try {
    const data = await deleteStable({
      adminId: req.user.id,
      stableId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
