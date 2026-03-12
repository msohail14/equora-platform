import {
  changePassword,
  changeProfile,
  forgotPassword,
  getMyProfile,
  loginUser,
  resendEmailOtp,
  resetPassword,
  signupUser,
  verifyEmailOtp,
} from '../services/user.service.js';
import { deleteFileIfExists, toPublicUploadPath } from '../utils/file.util.js';

const handleError = (res, error) => {
  const isValidationError =
    error.message.includes('required') ||
    error.message.includes('Invalid') ||
    error.message.includes('expired') ||
    error.message.includes('verified') ||
    error.message.includes('incorrect') ||
    error.message.includes('exists') ||
    error.message.includes('Role must') ||
    error.message.includes('must be one of');

  return res.status(isValidationError ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const signup = async (req, res) => {
  try {
    const profile_picture_url = req.file ? toPublicUploadPath(req.file.path) : null;
    const data = await signupUser({
      ...req.body,
      profile_picture_url,
    });
    return res.status(201).json(data);
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const data = await loginUser(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const verifyEmailOtpController = async (req, res) => {
  try {
    const data = await verifyEmailOtp(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const resendEmailOtpController = async (req, res) => {
  try {
    const data = await resendEmailOtp(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const forgotPasswordController = async (req, res) => {
  try {
    const data = await forgotPassword(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const resetPasswordController = async (req, res) => {
  try {
    const data = await resetPassword(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const changePasswordController = async (req, res) => {
  try {
    const data = await changePassword({
      userId: req.user.id,
      ...req.body,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const changeProfileController = async (req, res) => {
  try {
    const profile_picture_url = req.file ? toPublicUploadPath(req.file.path) : undefined;
    const data = await changeProfile({
      userId: req.user.id,
      ...req.body,
      profile_picture_url,
    });
    return res.status(200).json(data);
  } catch (error) {
    if (req.file) {
      await deleteFileIfExists(req.file.path);
    }
    return handleError(res, error);
  }
};

export const getMyProfileController = async (req, res) => {
  try {
    const data = await getMyProfile(req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
