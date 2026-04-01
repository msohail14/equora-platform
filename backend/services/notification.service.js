import { Notification, User } from '../models/index.js';
import { Op } from 'sequelize';
import { sendMail } from './mail.service.js';

// Types that trigger email notifications
const EMAIL_TYPES = ['booking_approved', 'booking_declined', 'payment_confirmed', 'lesson_booked', 'payment_reminder', 'general'];

// Types that trigger push notifications
const PUSH_TYPES = ['lesson_booked', 'booking_approved', 'booking_declined', 'horse_approved', 'horse_assigned', 'payment_confirmed', 'payment_reminder', 'session_reminder'];

// ── FCM Push ──────────────────────────────────────────────

import admin from 'firebase-admin';

const getMessaging = () => {
  try {
    const appCount = admin.apps.length;
    if (appCount > 0) {
      return admin.messaging();
    }
    console.warn('[push] Firebase not initialized — admin.apps.length =', appCount);
  } catch (e) {
    console.warn('[push] getMessaging() error:', e.message);
  }
  return null;
};

const sendPushNotification = async (fcmToken, title, body, data) => {
  if (!fcmToken) {
    console.log('[push] Skipped: no FCM token for user');
    return;
  }

  const messaging = getMessaging();
  if (!messaging) {
    console.warn('[push] Skipped: Firebase messaging not available');
    return;
  }

  const message = {
    token: fcmToken,
    notification: { title, body: body || title },
    data: data ? Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ) : undefined,
    android: { priority: 'high' },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
  };

  try {
    const messageId = await messaging.send(message);
    console.log(`[push] ✅ Sent "${title}" → token ${fcmToken.slice(0, 12)}... (messageId: ${messageId})`);
  } catch (e) {
    const errorCode = e?.errorInfo?.code || e?.code || '';
    console.error(`[push] ❌ Failed "${title}" → token ${fcmToken.slice(0, 12)}... | code: ${errorCode} | ${e.message}`);
    if (
      errorCode === 'messaging/registration-token-not-registered' ||
      errorCode === 'messaging/invalid-registration-token'
    ) {
      try {
        await User.update({ fcm_token: null }, { where: { fcm_token: fcmToken } });
        console.warn('[push] Cleared stale FCM token');
      } catch {
        // ignore
      }
    }
  }
};

// ── Email for Notifications ──────────────────────────────

const sendEmailForNotification = async (userId, title, body) => {
  if (!userId) return;
  try {
    const user = await User.findByPk(userId, { attributes: ['email', 'first_name'] });
    if (!user?.email) return;
    await sendMail({
      to: user.email,
      subject: title,
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #059669;">Equora</h2>
          <p>Hi ${user.first_name || 'there'},</p>
          <p>${body || title}</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">— The Equora Team</p>
        </div>
      `,
    });
  } catch {
    // Non-critical — don't fail notification if email fails
  }
};

// ── Pagination Helpers ───────────────────────────────────

const normalizePagination = ({ page, limit }) => {
  const parsedPage = Number(page);
  const parsedLimit = Number(limit);
  const safePage = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const safeLimit =
    Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 10;
  return { page: safePage, limit: safeLimit };
};

const buildPaginationMeta = ({ page, limit, totalItems }) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  return {
    page,
    limit,
    totalItems,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

// ── Core Functions ───────────────────────────────────────

export const createNotification = async ({ userId, adminId, type, title, body, data }) => {
  if (!userId && !adminId) {
    throw new Error('At least one of userId or adminId is required.');
  }
  if (!type || !title) {
    throw new Error('type and title are required.');
  }

  const notification = await Notification.create({
    user_id: userId || null,
    admin_id: adminId || null,
    type,
    title,
    body: body || null,
    data: data || null,
  });

  // Send email for important notification types (non-blocking)
  if (userId && EMAIL_TYPES.includes(type)) {
    sendEmailForNotification(userId, title, body || title).catch(() => {});
  }

  // Send push notification (non-blocking)
  if (userId && PUSH_TYPES.includes(type)) {
    try {
      const user = await User.findByPk(userId, { attributes: ['id', 'first_name', 'fcm_token'] });
      console.log(`[push] Notification type="${type}" for user ${user?.id} (${user?.first_name || '?'}) — fcm_token: ${user?.fcm_token ? user.fcm_token.slice(0, 12) + '...' : 'NULL'}`);
      if (user?.fcm_token) {
        sendPushNotification(
          user.fcm_token,
          title,
          body || title,
          { type, notification_id: String(notification.id), ...(data || {}) }
        ).catch((e) => console.error('[push] Unhandled push error:', e.message));
      }
    } catch (e) {
      console.error('[push] Error looking up user for push:', e.message);
    }
  } else if (userId) {
    console.log(`[push] Skipped push: type="${type}" not in PUSH_TYPES`);
  }

  return notification;
};

export const getUserNotifications = async ({ userId, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const { rows, count } = await Notification.findAndCountAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    offset,
    limit: pagination.limit,
  });

  const meta = buildPaginationMeta({
    page: pagination.page,
    limit: pagination.limit,
    totalItems: count,
  });

  return {
    data: rows,
    pagination: {
      ...meta,
      totalRecords: meta.totalItems,
      currentPage: meta.page,
      nextPage: meta.hasNext ? meta.page + 1 : null,
    },
  };
};

export const getAdminNotifications = async ({ adminId, page, limit }) => {
  const pagination = normalizePagination({ page, limit });
  const offset = (pagination.page - 1) * pagination.limit;

  const { rows, count } = await Notification.findAndCountAll({
    where: { admin_id: adminId },
    order: [['created_at', 'DESC']],
    offset,
    limit: pagination.limit,
  });

  const meta = buildPaginationMeta({
    page: pagination.page,
    limit: pagination.limit,
    totalItems: count,
  });

  return {
    data: rows,
    pagination: {
      ...meta,
      totalRecords: meta.totalItems,
      currentPage: meta.page,
      nextPage: meta.hasNext ? meta.page + 1 : null,
    },
  };
};

export const markAsRead = async ({ notificationId, userId }) => {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    throw new Error('Notification not found.');
  }

  if (notification.user_id !== userId && notification.admin_id !== userId) {
    throw new Error('Notification not found.');
  }

  notification.is_read = true;
  await notification.save();

  return notification;
};

export const markAllAsRead = async ({ userId }) => {
  await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } }
  );

  return { message: 'All notifications marked as read.' };
};

export const getUnreadCount = async ({ userId }) => {
  const count = await Notification.count({
    where: { user_id: userId, is_read: false },
  });

  return { count };
};
