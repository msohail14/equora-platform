import crypto from 'crypto';
import { Payment, Subscription, CoachPayout, LessonBooking, Notification } from '../models/index.js';
import { Op } from 'sequelize';

const generateTransactionId = () => `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

export const initiatePayment = async ({
  userId,
  amount,
  currency = 'SAR',
  provider,
  paymentType,
  relatedId,
  metadata,
}) => {
  if (!userId || !amount || !provider || !paymentType) {
    throw new Error('userId, amount, provider, and paymentType are required.');
  }

  if (!['tappay', 'hyperpay', 'manual'].includes(provider)) {
    throw new Error('provider must be tappay, hyperpay, or manual.');
  }

  if (!['subscription', 'session', 'course', 'tip'].includes(paymentType)) {
    throw new Error('paymentType must be subscription, session, course, or tip.');
  }

  const transactionId = generateTransactionId();

  const payment = await Payment.create({
    transaction_id: transactionId,
    user_id: userId,
    amount,
    currency,
    status: 'pending',
    provider,
    payment_type: paymentType,
    related_id: relatedId || null,
    metadata: metadata || null,
  });

  return {
    payment_id: payment.id,
    transaction_id: transactionId,
    status: payment.status,
    message: 'Payment initiated. Complete payment through the provider SDK.',
  };
};

export const handleWebhook = async ({ transactionId, providerReference, status }) => {
  if (!transactionId || !status) {
    throw new Error('transactionId and status are required.');
  }

  const allowedStatuses = ['completed', 'failed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${allowedStatuses.join(', ')}`);
  }

  const payment = await Payment.findOne({ where: { transaction_id: transactionId } });
  if (!payment) {
    throw new Error('Payment not found.');
  }

  // Prevent re-processing already finalized payments
  if (['completed', 'refunded', 'failed', 'cancelled'].includes(payment.status)) {
    throw new Error(`Payment already processed with status: ${payment.status}`);
  }

  payment.status = status;
  if (providerReference) payment.provider_reference = providerReference;
  await payment.save();

  if (status === 'completed') {
    if (payment.payment_type === 'subscription') {
      await createSubscriptionFromPayment(payment);
    }

    // Auto-confirm booking when session payment completes
    if (payment.payment_type === 'session' && payment.related_id) {
      await confirmBookingFromPayment(payment);
    }
  }

  return { message: 'Webhook processed successfully.', status: payment.status };
};

const createSubscriptionFromPayment = async (payment) => {
  const planType = payment.metadata?.plan_type || 'basic';
  const durationDays = planType === 'pro' ? 365 : planType === 'premium' ? 90 : 30;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);

  await Subscription.create({
    user_id: payment.user_id,
    plan_type: planType,
    status: 'active',
    start_date: startDate,
    end_date: endDate,
    auto_renew: true,
    payment_id: payment.id,
  });
};

const confirmBookingFromPayment = async (payment) => {
  const booking = await LessonBooking.findByPk(payment.related_id);
  if (!booking) return;
  if (!['pending_payment', 'pending_review'].includes(booking.status)) return;

  booking.status = 'confirmed';
  booking.payment_id = payment.id;
  await booking.save();

  // Notify rider
  await Notification.create({
    user_id: booking.rider_id,
    type: 'payment_confirmed',
    title: 'Payment Confirmed',
    body: `Your payment for the booking on ${booking.booking_date} has been confirmed.`,
    data: { booking_id: booking.id },
  });

  // Notify coach
  if (booking.coach_id) {
    await Notification.create({
      user_id: booking.coach_id,
      type: 'payment_confirmed',
      title: 'Session Payment Received',
      body: `Payment confirmed for the lesson on ${booking.booking_date}.`,
      data: { booking_id: booking.id },
    });
  }
};

export const getPaymentStatus = async (transactionId) => {
  const payment = await Payment.findOne({ where: { transaction_id: transactionId } });
  if (!payment) {
    throw new Error('Payment not found.');
  }
  return payment;
};

export const getUserPayments = async (userId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await Payment.findAndCountAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    payments: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};

export const getUserSubscription = async (userId) => {
  const subscription = await Subscription.findOne({
    where: {
      user_id: userId,
      status: 'active',
      end_date: { [Op.gte]: new Date() },
    },
    order: [['created_at', 'DESC']],
  });
  return subscription;
};

export const cancelSubscription = async (userId, subscriptionId) => {
  const subscription = await Subscription.findOne({
    where: { id: subscriptionId, user_id: userId },
  });
  if (!subscription) {
    throw new Error('Subscription not found.');
  }

  subscription.status = 'cancelled';
  subscription.auto_renew = false;
  await subscription.save();

  return { message: 'Subscription cancelled. Access continues until end date.' };
};

export const getCoachPayouts = async (coachId, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const { count, rows } = await CoachPayout.findAndCountAll({
    where: { coach_id: coachId },
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    payouts: rows,
    total: count,
    page,
    totalPages: Math.ceil(count / limit),
  };
};

export const markPaymentAsManual = async (paymentId) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new Error('Payment not found.');
  if (payment.status !== 'pending') throw new Error('Only pending payments can be marked as manual.');

  payment.status = 'completed';
  payment.provider = 'manual';
  payment.provider_reference = `MANUAL_${Date.now()}`;
  await payment.save();

  // Auto-confirm booking if linked
  if (payment.payment_type === 'session' && payment.related_id) {
    const booking = await LessonBooking.findByPk(payment.related_id);
    if (booking && ['pending_payment', 'pending_review'].includes(booking.status)) {
      booking.status = 'confirmed';
      booking.payment_id = payment.id;
      await booking.save();

      await Notification.create({
        user_id: booking.rider_id,
        type: 'payment_confirmed',
        title: 'Payment Confirmed',
        body: `Manual payment confirmed for your booking on ${booking.booking_date}.`,
        data: { booking_id: booking.id, payment_id: payment.id },
      });
    }
  }

  return payment;
};

export const refundPayment = async (paymentId) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment) throw new Error('Payment not found.');
  if (payment.status !== 'completed') throw new Error('Only completed payments can be refunded.');

  payment.status = 'refunded';
  await payment.save();

  if (payment.user_id) {
    await Notification.create({
      user_id: payment.user_id,
      type: 'payment_confirmed',
      title: 'Payment Refunded',
      body: `Your payment of ${payment.currency} ${payment.amount} has been refunded.`,
      data: { payment_id: payment.id },
    });
  }

  return payment;
};
