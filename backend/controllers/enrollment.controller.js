import {
  createEnrollment,
  createEnrollmentsByAdmin,
  getAllEnrollments,
  getCourseEnrollments,
  getMyEnrollments,
  updateEnrollmentStatus,
} from '../services/enrollment.service.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('Invalid') ||
    error.message.includes('not found') ||
    error.message.includes('already') ||
    error.message.includes('Access denied') ||
    error.message.includes('inactive') ||
    error.message.includes('array');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const createEnrollmentController = async (req, res) => {
  try {
    const data = await createEnrollment({
      user: req.user,
      course_id: req.body.course_id,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getMyEnrollmentsController = async (req, res) => {
  try {
    const data = await getMyEnrollments({ user: req.user });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const createEnrollmentsByAdminController = async (req, res) => {
  try {
    const data = await createEnrollmentsByAdmin({
      user: req.user,
      course_id: req.body.course_id,
      rider_ids: req.body.rider_ids,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCourseEnrollmentsController = async (req, res) => {
  try {
    const data = await getCourseEnrollments({
      user: req.user,
      courseId: req.params.courseId,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAllEnrollmentsController = async (req, res) => {
  try {
    const data = await getAllEnrollments({ user: req.user });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateEnrollmentStatusController = async (req, res) => {
  try {
    const data = await updateEnrollmentStatus({
      user: req.user,
      enrollmentId: req.params.id,
      status: req.body.status,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
