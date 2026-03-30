import {
  initiatePayment,
  handleWebhook,
  getPaymentStatus,
  getUserPayments,
  getUserSubscription,
  cancelSubscription,
  getCoachPayouts,
} from '../services/payment.service.js';

const handleError = (res, error) => {
  const isValidation =
    error.message.includes('required') ||
    error.message.includes('must be') ||
    error.message.includes('not found');

  return res.status(isValidation ? 400 : 500).json({
    message: error.message || 'Internal server error.',
  });
};

export const initiatePaymentController = async (req, res) => {
  try {
    const data = await initiatePayment({
      userId: req.user.id,
      ...req.body,
    });
    return res.status(201).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const webhookController = async (req, res) => {
  // Tap signature verification — REQUIRED in production
  if (process.env.TAP_WEBHOOK_SECRET) {
    const signature = req.headers['x-tap-signature'] || req.headers['x-webhook-signature'];
    if (!signature) {
      return res.status(401).json({ message: 'Missing webhook signature.' });
    }
    const crypto = await import('crypto');
    const expected = crypto.default
      .createHmac('sha256', process.env.TAP_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (signature !== expected) {
      return res.status(401).json({ message: 'Invalid webhook signature.' });
    }
  } else if (process.env.NODE_ENV === 'production') {
    console.error('[SECURITY] TAP_WEBHOOK_SECRET not configured — rejecting webhook in production');
    return res.status(503).json({ message: 'Payment webhook not configured.' });
  } else {
    console.warn('[WARN] TAP_WEBHOOK_SECRET not set — accepting webhook without verification (dev only)');
  }

  try {
    const data = await handleWebhook(req.body);
    return res.status(200).json(data);
  } catch (error) {
    if (error.message.includes('already processed')) {
      return res.status(409).json({ message: error.message });
    }
    return handleError(res, error);
  }
};

export const getPaymentStatusController = async (req, res) => {
  try {
    const data = await getPaymentStatus(req.params.transactionId);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUserPaymentsController = async (req, res) => {
  try {
    const data = await getUserPayments(req.user.id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getUserSubscriptionController = async (req, res) => {
  try {
    const data = await getUserSubscription(req.user.id);
    return res.status(200).json({ subscription: data });
  } catch (error) {
    return handleError(res, error);
  }
};

export const cancelSubscriptionController = async (req, res) => {
  try {
    const data = await cancelSubscription(req.user.id, req.params.id);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

export const getCoachPayoutsController = async (req, res) => {
  try {
    const data = await getCoachPayouts(req.user.id, {
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 20,
    });
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};
