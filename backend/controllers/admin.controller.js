import {
  changeAdminPassword,
  changeAdminProfile,
  forgotAdminPassword,
  getAdminDashboardData,
  loginAdmin,
  resetAdminPassword,
  signupAdmin,
} from '../services/admin.service.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('Invalid') ||
    error.message.includes('incorrect') ||
    error.message.includes('exists');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const signupAdminController = async (req, res) => {
  try {
    const data = await signupAdmin(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const loginAdminController = async (req, res) => {
  try {
    const data = await loginAdmin(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const forgotAdminPasswordController = async (req, res) => {
  try {
    const data = await forgotAdminPassword(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const resetAdminPasswordController = async (req, res) => {
  try {
    const data = await resetAdminPassword(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const changeAdminPasswordController = async (req, res) => {
  try {
    const data = await changeAdminPassword({
      adminId: req.user.id,
      ...req.body,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const changeAdminProfileController = async (req, res) => {
  try {
    const data = await changeAdminProfile({
      adminId: req.user.id,
      ...req.body,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAdminDashboardController = async (_req, res) => {
  try {
    const data = await getAdminDashboardData();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
