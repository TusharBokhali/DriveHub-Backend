const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllRead,
  updatePushToken,
  removePushToken,
  updateFCMToken, // Legacy support
  removeFCMToken // Legacy support
} = require('../controllers/notificationController');

// All routes require authentication
router.use(protect);

// Push Token Management (supports both Expo and FCM)
router.post('/push-token', updatePushToken);
router.delete('/push-token', removePushToken);

// Legacy FCM Token Management (for backward compatibility)
router.post('/fcm-token', updateFCMToken);
router.delete('/fcm-token', removeFCMToken);

// Notification Management
router.get('/', getNotifications);
router.get('/:id', getNotificationById);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);
router.delete('/clear-all', clearAllRead);

module.exports = router;

