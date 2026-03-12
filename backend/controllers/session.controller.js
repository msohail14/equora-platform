import {
  cancelCourseSession,
  createCourseSession,
  getCourseSessions,
  getMySessions,
  updateCourseSession,
} from '../services/session.service.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('Invalid') ||
    error.message.includes('not found') ||
    error.message.includes('only') ||
    error.message.includes('outside') ||
    error.message.includes('limit') ||
    error.message.includes('already') ||
    error.message.includes('Access denied') ||
    error.message.includes('inactive');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createSessionController = async (req, res) => {
  try {
    const data = await createCourseSession({
      user: req.user,
      payload: req.body,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMySessionsController = async (req, res) => {
  try {
    const data = await getMySessions({
      user: req.user,
      pagination: {
        page: req.query.page,
        limit: req.query.limit,
      },
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCourseSessionsController = async (req, res) => {
  try {
    const data = await getCourseSessions({
      user: req.user,
      courseId: req.params.courseId,
      pagination: {
        page: req.query.page,
        limit: req.query.limit,
      },
      filters: {
        status: req.query.status,
        rider_id: req.query.rider_id ? Number(req.query.rider_id) : undefined,
      },
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateSessionController = async (req, res) => {
  try {
    const data = await updateCourseSession({
      user: req.user,
      sessionId: req.params.id,
      payload: req.body,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelSessionController = async (req, res) => {
  try {
    const data = await cancelCourseSession({
      user: req.user,
      sessionId: req.params.id,
      cancelReason: req.body.cancel_reason,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
