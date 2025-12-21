const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendNotification, sendMulticastNotification, isInitialized: isFCMInitialized } = require('../utils/fcmService');
const { sendExpoNotification, sendMulticastExpoNotification, isExpoPushToken } = require('../utils/expoPushService');

/**
 * Create and send notification to user
 * @param {string} userId - User ID
 * @param {string} type - Notification type
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {object} data - Additional data
 * @param {string} bookingId - Related booking ID (optional)
 * @returns {Promise<object>} - Created notification
 */
exports.createAndSendNotification = async (userId, type, title, message, data = {}, bookingId = null) => {
  try {
    // SECURITY: Verify user exists before creating notification
    const targetUser = await User.findById(userId).select('_id name email role pushTokens');
    if (!targetUser) {
      console.error(`Security: Attempted to send notification to non-existent user: ${userId}`);
      throw new Error(`User ${userId} not found`);
    }
    
    // Create notification in database - linked to specific user
    const notification = new Notification({
      user: userId,
      type: type,
      title: title,
      message: message,
      data: data,
      bookingId: bookingId
    });
    
    await notification.save();
    console.log(`📧 Notification created for user ${targetUser.email} (ID: ${userId}), Type: ${type}`);
    
    // Get user push tokens (supports both Expo and FCM)
    if (targetUser.pushTokens && targetUser.pushTokens.length > 0) {
      // Separate Expo and FCM tokens
      const expoTokens = targetUser.pushTokens.filter(token => isExpoPushToken(token));
      const fcmTokens = targetUser.pushTokens.filter(token => !isExpoPushToken(token));
      
      const notificationData = {
        notificationId: notification._id.toString(),
        type: type,
        ...data
      };
      
      if (bookingId) {
        notificationData.bookingId = bookingId.toString();
      }
      
      let expoResult = { success: false, invalidTokens: [] };
      let fcmResult = { success: false, invalidTokens: [] };
      
      // Send Expo notifications
      if (expoTokens.length > 0) {
        console.log(`📤 Sending Expo notification to ${expoTokens.length} token(s) for user ${targetUser.email}`);
        expoResult = await sendMulticastExpoNotification(
          expoTokens,
          title,
          message,
          notificationData
        );
        console.log(`📊 Expo notifications sent to user ${userId}: ${expoResult.successCount} successful, ${expoResult.failureCount} failed`);
        if (expoResult.errors && expoResult.errors.length > 0) {
          console.error(`❌ Expo notification errors:`, expoResult.errors);
        }
      }
      
      // Send FCM notifications (if Firebase is configured)
      if (fcmTokens.length > 0 && isFCMInitialized()) {
        fcmResult = await sendMulticastNotification(
          fcmTokens,
          title,
          message,
          notificationData
        );
        console.log(`FCM notifications sent to user ${userId}: ${fcmResult.successCount} successful, ${fcmResult.failureCount} failed`);
      } else if (fcmTokens.length > 0) {
        console.log(`FCM tokens found but Firebase not configured, skipping FCM notifications`);
      }
      
      // Remove invalid tokens
      const allInvalidTokens = [
        ...(expoResult.invalidTokens || []),
        ...(fcmResult.invalidTokens || [])
      ];
      
      if (allInvalidTokens.length > 0) {
        targetUser.pushTokens = targetUser.pushTokens.filter(token => !allInvalidTokens.includes(token));
        await targetUser.save();
        console.log(`Removed ${allInvalidTokens.length} invalid push tokens for user ${userId}`);
      }
      
      const totalSuccess = (expoResult.successCount || 0) + (fcmResult.successCount || 0);
      const totalFailed = (expoResult.failureCount || 0) + (fcmResult.failureCount || 0);
      console.log(`✅ Total notifications sent to user ${targetUser.email} (ID: ${userId}): ${totalSuccess} successful, ${totalFailed} failed`);
    } else {
      console.log(`⚠️ User ${targetUser.email} (ID: ${userId}) has no push tokens, notification saved but not sent`);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * GET /api/notifications
 * Get user's notifications
 */
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const userId = req.user._id;
    
    // Build query
    let query = { user: userId };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications
    const notifications = await Notification.find(query)
      .populate('bookingId', 'vehicleId bookingStatus paymentStatus')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get unread count
    const unreadCount = await Notification.countDocuments({ 
      user: userId, 
      isRead: false 
    });
    
    // Get total count
    const totalCount = await Notification.countDocuments({ user: userId });
    
    res.json({
      success: true,
      data: {
        notifications: notifications,
        unreadCount: unreadCount,
        totalCount: totalCount,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          hasNextPage: skip + notifications.length < totalCount,
          hasPrevPage: parseInt(page) > 1
        }
      },
      message: `Found ${notifications.length} notifications`
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while fetching notifications'
    });
  }
};

/**
 * GET /api/notifications/:id
 * Get notification by ID
 */
exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('bookingId', 'vehicleId bookingStatus paymentStatus')
      .populate('user', 'name email');
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Notification not found'
      });
    }
    
    // Check authorization
    if (notification.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Not authorized to view this notification'
      });
    }
    
    res.json({
      success: true,
      data: notification,
      message: 'Notification found successfully'
    });
  } catch (err) {
    console.error('Get notification by ID error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while fetching notification'
    });
  }
};

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Notification not found'
      });
    }
    
    // Check authorization
    if (notification.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Not authorized to update this notification'
      });
    }
    
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
    
    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (err) {
    console.error('Mark as read error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while updating notification'
    });
  }
};

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Notification.updateMany(
      { user: userId, isRead: false },
      { 
        $set: { 
          isRead: true, 
          readAt: new Date() 
        } 
      }
    );
    
    res.json({
      success: true,
      data: {
        updatedCount: result.modifiedCount
      },
      message: `Marked ${result.modifiedCount} notifications as read`
    });
  } catch (err) {
    console.error('Mark all as read error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while updating notifications'
    });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Notification not found'
      });
    }
    
    // Check authorization
    if (notification.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Not authorized to delete this notification'
      });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      data: null,
      message: 'Notification deleted successfully'
    });
  } catch (err) {
    console.error('Delete notification error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while deleting notification'
    });
  }
};

/**
 * DELETE /api/notifications/clear-all
 * Delete all read notifications
 */
exports.clearAllRead = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const result = await Notification.deleteMany({
      user: userId,
      isRead: true
    });
    
    res.json({
      success: true,
      data: {
        deletedCount: result.deletedCount
      },
      message: `Deleted ${result.deletedCount} read notifications`
    });
  } catch (err) {
    console.error('Clear all read error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while deleting notifications'
    });
  }
};

/**
 * POST /api/notifications/push-token
 * Update user's push token (supports both Expo and FCM)
 * SECURITY: Token automatically linked to authenticated user (req.user)
 */
exports.updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user._id; // From JWT token - secure
    const userRole = req.user.role; // User or Admin
    const userEmail = req.user.email;
    
    // Validate push token
    if (!pushToken || typeof pushToken !== 'string' || pushToken.trim().length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Valid push token is required'
      });
    }
    
    // Find user by authenticated ID (double verification)
    const user = await User.findById(userId);
    if (!user) {
      console.error(`Security: User ${userId} not found but token was valid`);
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found'
      });
    }
    
    // Verify user ID matches (extra security check)
    if (user._id.toString() !== userId.toString()) {
      console.error(`Security: User ID mismatch - Token: ${userId}, DB: ${user._id}`);
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Unauthorized access'
      });
    }
    
    // Initialize pushTokens array if not exists
    if (!user.pushTokens || !Array.isArray(user.pushTokens)) {
      user.pushTokens = [];
    }
    
    // Detect token type
    const isExpo = isExpoPushToken(pushToken);
    const tokenType = isExpo ? 'Expo' : 'FCM';
    
    // Add token if not already present (support multiple devices)
    const tokenExists = user.pushTokens.includes(pushToken);
    if (!tokenExists) {
      user.pushTokens.push(pushToken);
      await user.save();
      console.log(`✅ ${tokenType} push token added for ${userRole} user: ${userEmail} (ID: ${userId})`);
    } else {
      console.log(`ℹ️ ${tokenType} push token already exists for ${userRole} user: ${userEmail} (ID: ${userId})`);
    }
    
    res.json({
      success: true,
      data: {
        pushTokens: user.pushTokens,
        tokenType: tokenType,
        totalTokens: user.pushTokens.length,
        userRole: userRole,
        userId: userId.toString()
      },
      message: `${tokenType} push token updated successfully for ${userRole}`
    });
  } catch (err) {
    console.error('Update push token error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while updating push token'
    });
  }
};

/**
 * POST /api/notifications/fcm-token (Legacy - for backward compatibility)
 * Update user's FCM token
 */
exports.updateFCMToken = exports.updatePushToken;

/**
 * DELETE /api/notifications/push-token
 * Remove user's push token (for logout)
 */
exports.removePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user._id;
    
    if (!pushToken) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Push token is required'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found'
      });
    }
    
    // Remove token
    if (user.pushTokens && Array.isArray(user.pushTokens)) {
      const beforeCount = user.pushTokens.length;
      user.pushTokens = user.pushTokens.filter(token => token !== pushToken);
      await user.save();
      
      const tokenType = isExpoPushToken(pushToken) ? 'Expo' : 'FCM';
      console.log(`${tokenType} push token removed for user ${userId}`);
      
      res.json({
        success: true,
        data: {
          pushTokens: user.pushTokens,
          removed: beforeCount > user.pushTokens.length
        },
        message: `${tokenType} push token removed successfully`
      });
    } else {
      res.json({
        success: true,
        data: {
          pushTokens: [],
          removed: false
        },
        message: 'No tokens to remove'
      });
    }
  } catch (err) {
    console.error('Remove push token error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while removing push token'
    });
  }
};

/**
 * DELETE /api/notifications/fcm-token (Legacy - for backward compatibility)
 * Remove user's FCM token (for logout)
 */
exports.removeFCMToken = exports.removePushToken;

