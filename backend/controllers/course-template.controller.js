import {
  createTemplate,
  getMyTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '../services/course-template.service.js';
import { deleteFileIfExists } from '../utils/file.util.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('not found') ||
    error.message.includes('already') ||
    error.message.includes('allowed') ||
    error.message.includes('must');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const uploadLayoutController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Layout image is required.' });
    }
    const layoutUrl = `/upload/course-layouts/${req.file.filename}`;
    return res.status(200).json({ layout_url: layoutUrl });
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const createTemplateController = async (req, res) => {
  try {
    const data = await createTemplate({ coachId: req.user.id, payload: req.body });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMyTemplatesController = async (req, res) => {
  try {
    const data = await getMyTemplates({
      coachId: req.user.id,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getTemplateByIdController = async (req, res) => {
  try {
    const data = await getTemplateById({ coachId: req.user.id, templateId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateTemplateController = async (req, res) => {
  try {
    const data = await updateTemplate({
      coachId: req.user.id,
      templateId: req.params.id,
      payload: req.body,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteTemplateController = async (req, res) => {
  try {
    const data = await deleteTemplate({ coachId: req.user.id, templateId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
