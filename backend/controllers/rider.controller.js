import {
  adminResetUserPassword,
  createRiderByAdmin,
  getAllRiders,
  getRiderDetailsWithEnrollments,
  getRiderSessions,
  getRiderStats,
  updateRider,
  updateRiderActiveStatus,
} from '../services/rider.service.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('not found') ||
    error.message.includes('required') ||
    error.message.includes('exists') ||
    error.message.includes('must be one of');
  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const getAllRidersController = async (req, res) => {
  try {
    const data = await getAllRiders({
      page: req.query.page,
      limit: req.query.limit,
      search: req.query.search,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createRiderController = async (req, res) => {
  try {
    const data = await createRiderByAdmin(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getRiderDetailsController = async (req, res) => {
  try {
    const data = await getRiderDetailsWithEnrollments(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getRiderStatsController = async (req, res) => {
  try {
    const data = await getRiderStats(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getRiderSessionsController = async (req, res) => {
  try {
    const data = await getRiderSessions(req.params.id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateRiderStatusController = async (req, res) => {
  try {
    const data = await updateRiderActiveStatus(req.params.id, req.body.is_active);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateRiderController = async (req, res) => {
  try {
    const data = await updateRider(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const resetRiderPasswordController = async (req, res) => {
  try {
    const options = { method: req.body?.method };
    const data = await adminResetUserPassword(req.params.id, options);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
