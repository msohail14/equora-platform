import {
  createFeedback,
  getSessionFeedback,
  getRiderPerformance,
} from '../services/session-feedback.service.js';

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

export const createFeedbackController = async (req, res) => {
  try {
    const data = await createFeedback({
      sessionId: req.params.id,
      coachId: req.user.id,
      riderId: req.body.riderId || req.body.rider_id,
      feedbackText: req.body.feedbackText || req.body.feedback_text || req.body.performance_notes,
      performanceRating: req.body.performanceRating || req.body.performance_rating || req.body.rating,
      areasToImprove: req.body.areasToImprove || req.body.areas_to_improve,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getSessionFeedbackController = async (req, res) => {
  try {
    const data = await getSessionFeedback({ sessionId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getRiderPerformanceController = async (req, res) => {
  try {
    const data = await getRiderPerformance({
      riderId: req.params.id,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
