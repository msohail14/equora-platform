import {
  createCoachReview,
  deleteCoachReview,
  getCoachReviews,
  updateCoachReview,
} from '../services/coach-review.service.js';

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

export const createCoachReviewController = async (req, res) => {
  try {
    const data = await createCoachReview({ user: req.user, payload: req.body });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateCoachReviewController = async (req, res) => {
  try {
    const data = await updateCoachReview({
      user: req.user,
      reviewId: req.params.id,
      payload: req.body,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteCoachReviewController = async (req, res) => {
  try {
    const data = await deleteCoachReview({
      user: req.user,
      reviewId: req.params.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachReviewsController = async (req, res) => {
  try {
    const data = await getCoachReviews({
      coachId: req.params.coachId,
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
