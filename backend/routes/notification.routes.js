import express from 'express';
import authMiddleware from '../middleware/auth.middleware.js';
import {
  validate,
  notificationIdParamValidation,
} from '../middleware/validation.middleware.js';
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  getUnreadCountController,
} from '../controllers/notification.controller.js';

const router = express.Router();

router.get('/', authMiddleware, getNotificationsController);
router.patch('/:id/read', authMiddleware, notificationIdParamValidation, validate, markAsReadController);
router.patch('/read-all', authMiddleware, markAllAsReadController);
router.get('/unread-count', authMiddleware, getUnreadCountController);

export default router;
