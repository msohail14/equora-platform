import {
  sendMail,
  sendOtpEmail,
  sendResetPasswordLinkEmail,
  sendResetTokenEmail,
} from '../services/mail.service.js';

const handleError = (res, error) =>
  res.status(400).json({
    message: error.message || 'Unable to send mail.',
  });

export const sendCustomMailController = async (req, res) => {
  try {
    const result = await sendMail(req.body);
    return res.status(200).json({ message: 'Mail sent successfully.', result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const sendOtpMailController = async (req, res) => {
  try {
    const result = await sendOtpEmail(req.body);
    return res.status(200).json({ message: 'OTP mail sent successfully.', result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const sendResetTokenMailController = async (req, res) => {
  try {
    const result = await sendResetTokenEmail(req.body);
    return res.status(200).json({ message: 'Reset token mail sent successfully.', result });
  } catch (error) {
    return handleError(res, error);
  }
};

export const sendResetLinkMailController = async (req, res) => {
  try {
    const result = await sendResetPasswordLinkEmail(req.body);
    return res.status(200).json({ message: 'Reset link mail sent successfully.', result });
  } catch (error) {
    return handleError(res, error);
  }
};
