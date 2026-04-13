import {
  approveStable,
  changeAdminPassword,
  changeAdminProfile,
  deleteStableOwner,
  forgotAdminPassword,
  getAdminAnalytics,
  getAdminBookings,
  adminModifyBooking,
  getAdminDashboardData,
  getAdminPayments,
  getAdminPayouts,
  getAdminSettings,
  inviteStableOwner,
  listAdminAccounts,
  loginAdmin,
  processAdminPayout,
  resetAdminPassword,
  resetStableOwnerPassword,
  signupAdmin,
  updateAdminSettings,
  updateStableOwnerProfile,
  verifyCoach,
} from '../services/admin.service.js';
import { markPaymentAsManual, refundPayment } from '../services/payment.service.js';

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

export const getAdminDashboardController = async (req, res) => {
  try {
    const data = await getAdminDashboardData(req.user);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAdminAnalyticsController = async (req, res) => {
  try {
    const data = await getAdminAnalytics(req.query);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAdminPaymentsController = async (req, res) => {
  try {
    const data = await getAdminPayments({ ...req.query, adminUser: req.user });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAdminPayoutsController = async (req, res) => {
  try {
    const data = await getAdminPayouts(req.query);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const processAdminPayoutController = async (req, res) => {
  try {
    const data = await processAdminPayout({ payoutId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const approveStableController = async (req, res) => {
  try {
    const data = await approveStable({ stableId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const verifyCoachController = async (req, res) => {
  try {
    const data = await verifyCoach({ coachId: req.params.id });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAdminSettingsController = async (_req, res) => {
  try {
    const data = await getAdminSettings();
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateAdminSettingsController = async (req, res) => {
  try {
    const data = await updateAdminSettings({ settings: req.body });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getAdminBookingsController = async (req, res) => {
  try {
    const data = await getAdminBookings({ ...req.query, adminUser: req.user });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const adminModifyBookingController = async (req, res) => {
  try {
    const data = await adminModifyBooking({
      bookingId: Number(req.params.id),
      coachId: req.body.coach_id,
      arenaId: req.body.arena_id,
      horseId: req.body.horse_id,
      durationMinutes: req.body.duration_minutes ? Number(req.body.duration_minutes) : undefined,
      notes: req.body.notes,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const inviteStableOwnerController = async (req, res) => {
  try {
    const data = await inviteStableOwner(
      { stableId: req.params.id, ...req.body },
      req.user.id
    );
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const markManualPaymentController = async (req, res) => {
  try {
    const data = await markPaymentAsManual(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const refundPaymentController = async (req, res) => {
  try {
    const data = await refundPayment(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const resetStableOwnerPasswordController = async (req, res) => {
  try {
    const data = await resetStableOwnerPassword(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const updateStableOwnerProfileController = async (req, res) => {
  try {
    const data = await updateStableOwnerProfile(req.params.id, req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const deleteStableOwnerController = async (req, res) => {
  try {
    const data = await deleteStableOwner(req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const listAdminAccountsController = async (req, res) => {
  try {
    const data = await listAdminAccounts(req.query);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
