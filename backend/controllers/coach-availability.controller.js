import {
  createAvailabilityException,
  createWeeklyAvailability,
  deleteAvailabilityException,
  deleteWeeklyAvailability,
  getAvailabilityExceptions,
  getWeeklyAvailability,
  updateAvailabilityException,
  updateWeeklyAvailability,
} from '../services/coach-availability.service.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('must be') ||
    error.message.includes('not found') ||
    error.message.includes('cannot') ||
    error.message.toLowerCase().includes('overlap');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createWeeklyAvailabilityController = async (req, res) => {
  try {
    const data = await createWeeklyAvailability(req.user.id, req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getWeeklyAvailabilityController = async (req, res) => {
  try {
    const include_inactive = String(req.query.include_inactive || 'false').toLowerCase() === 'true';
    const data = await getWeeklyAvailability(req.user.id, { include_inactive });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateWeeklyAvailabilityController = async (req, res) => {
  try {
    const data = await updateWeeklyAvailability(req.user.id, req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteWeeklyAvailabilityController = async (req, res) => {
  try {
    const data = await deleteWeeklyAvailability(req.user.id, req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createAvailabilityExceptionController = async (req, res) => {
  try {
    const data = await createAvailabilityException(req.user.id, req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAvailabilityExceptionsController = async (req, res) => {
  try {
    const data = await getAvailabilityExceptions(req.user.id, {
      from_date: req.query.from_date,
      to_date: req.query.to_date,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateAvailabilityExceptionController = async (req, res) => {
  try {
    const data = await updateAvailabilityException(req.user.id, req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteAvailabilityExceptionController = async (req, res) => {
  try {
    const data = await deleteAvailabilityException(req.user.id, req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
