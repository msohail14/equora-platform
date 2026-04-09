import {
  changePassword,
  changeProfile,
  deleteAccount,
  forceChangePassword,
  forgotPassword,
  getMyProfile,
  loginUser,
  resendEmailOtp,
  resetPassword,
  signupUser,
  verifyEmailOtp,
} from '../services/user.service.js';
import User from '../models/user.model.js';
import { deleteFileIfExists, toPublicUploadPath } from '../utils/file.util.js';

const handleError = (res, error) => {
  const msg = error.message || '';
  const isValidationError =
    msg.includes('required') ||
    msg.includes('Invalid') ||
    msg.includes('expired') ||
    msg.includes('verified') ||
    msg.includes('incorrect') ||
    msg.includes('exists') ||
    msg.includes('Role must') ||
    msg.includes('must be one of') ||
    msg.includes('Password must') ||
    msg.includes('not found') ||
    msg.includes('deactivated');

  return res.status(isValidationError ? 400 : 500).json({
    message: msg || 'Internal server error.',
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

export const forceChangePasswordController = async (req, res) => {
  try {
    const data = await forceChangePassword({
      userId: req.user.id,
      new_password: req.body.new_password,
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

export const deleteAccountController = async (req, res) => {
  try {
    const data = await deleteAccount(req.user.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateFcmTokenController = async (req, res) => {
  try {
    const { fcm_token } = req.body;
    if (!fcm_token) {
      return res.status(400).json({ message: 'fcm_token is required.' });
    }
    await User.update({ fcm_token }, { where: { id: req.user.id } });
    console.log(`[fcm] Token registered for user ${req.user.id}: ${fcm_token.slice(0, 15)}...`);
    return res.status(200).json({ message: 'FCM token updated.' });
  } catch (error) {
    return handleError(res, error);
  }
};
