import {
  createDiscipline,
  deleteDiscipline,
  getAllDisciplines,
  getDisciplineById,
  updateDiscipline,
} from '../services/discipline.service.js';
import { deleteFileIfExists, toPublicUploadPath } from '../utils/file.util.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('exists') ||
    error.message.includes('not found') ||
    error.message.includes('cannot be deleted');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createDisciplineController = async (req, res) => {
  try {
    const icon_url = req.file ? toPublicUploadPath(req.file.path) : null;
    const data = await createDiscipline({
      ...req.body,
      icon_url,
    });
    return res.status(201).json(data);
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const getAllDisciplinesController = async (req, res) => {
  try {
    const include_inactive = String(req.query.include_inactive || 'false').toLowerCase() === 'true';
    const data = await getAllDisciplines({
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

export const getDisciplineByIdController = async (req, res) => {
  try {
    const data = await getDisciplineById(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateDisciplineController = async (req, res) => {
  try {
    const icon_url = req.file ? toPublicUploadPath(req.file.path) : undefined;
    const data = await updateDiscipline(req.params.id, {
      ...req.body,
      icon_url,
    });
    return res.status(200).json(data);
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const deleteDisciplineController = async (req, res) => {
  try {
    const data = await deleteDiscipline(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
