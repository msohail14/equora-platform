import {
  createCoachWeeklyAvailabilityByAdmin,
  createCoach,
  deleteCoachWeeklyAvailabilityByAdmin,
  getCoachCourses,
  getCoachDetails,
  getCoachSessions,
  getCoachSummary,
  getCoachWeeklyAvailabilityByAdmin,
  getAllCoaches,
  getCoachById,
  updateCoachWeeklyAvailabilityByAdmin,
  updateCoach,
} from '../services/coach.service.js';
import { getCoachUpcomingAvailability } from '../services/auth.service.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('exists') ||
    error.message.includes('not found') ||
    error.message.toLowerCase().includes('overlap') ||
    error.message.includes('must be one of');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createCoachController = async (req, res) => {
  try {
    const data = await createCoach(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAllCoachesController = async (req, res) => {
  try {
    const include_inactive = String(req.query.include_inactive || 'false').toLowerCase() === 'true';
    const featured = String(req.query.featured || 'false').toLowerCase() === 'true';
    const data = await getAllCoaches({
      include_inactive,
      featured: featured || undefined,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachByIdController = async (req, res) => {
  try {
    const data = await getCoachById(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateCoachController = async (req, res) => {
  try {
    const data = await updateCoach(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachDetailsController = async (req, res) => {
  try {
    const data = await getCoachDetails(req.params.id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachSummaryController = async (req, res) => {
  try {
    const data = await getCoachSummary(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachCoursesController = async (req, res) => {
  try {
    const data = await getCoachCourses(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachSessionsController = async (req, res) => {
  try {
    const data = await getCoachSessions(req.params.id, {
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachUpcomingAvailabilityController = async (req, res) => {
  try {
    const data = await getCoachUpcomingAvailability({
      coachId: req.params.id,
      fromDate: req.query.from_date,
      days: req.query.days,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createCoachWeeklyAvailabilityByAdminController = async (req, res) => {
  try {
    const data = await createCoachWeeklyAvailabilityByAdmin(req.params.id, req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateCoachWeeklyAvailabilityByAdminController = async (req, res) => {
  try {
    const data = await updateCoachWeeklyAvailabilityByAdmin(
      req.params.id,
      req.params.availabilityId,
      req.body
    );
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachWeeklyAvailabilityByAdminController = async (req, res) => {
  try {
    const include_inactive = String(req.query.include_inactive || 'true').toLowerCase() === 'true';
    const data = await getCoachWeeklyAvailabilityByAdmin(req.params.id, { include_inactive });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteCoachWeeklyAvailabilityByAdminController = async (req, res) => {
  try {
    const data = await deleteCoachWeeklyAvailabilityByAdmin(req.params.id, req.params.availabilityId);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
