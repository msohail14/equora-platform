import {
  submitStableRegistration,
  getStableRegistrations,
  approveStableRegistration,
  rejectStableRegistration,
} from '../services/stableRegistration.service.js';

const handleError = (res, error) => {
  const isValidation =
    error.message.includes('required') ||
    error.message.includes('already') ||
    error.message.includes('Only');
  return res.status(isValidation ? 400 : 500).json({ message: error.message });
};

export const submitRegistrationController = async (req, res) => {
  try {
    const data = await submitStableRegistration(req.body);
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getRegistrationsController = async (req, res) => {
  try {
    const data = await getStableRegistrations(req.query);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const approveRegistrationController = async (req, res) => {
  try {
    const data = await approveStableRegistration({
      registrationId: req.params.id,
      password: req.body.password,
      adminId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const rejectRegistrationController = async (req, res) => {
  try {
    const data = await rejectStableRegistration({
      registrationId: req.params.id,
      admin_notes: req.body.admin_notes,
      adminId: req.user.id,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
