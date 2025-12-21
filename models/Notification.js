const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User who will receive the notification
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Notification type: booking, payment, system, etc.
  type: { 
    type: String, 
    enum: ['booking', 'payment', 'system', 'admin', 'other'], 
    default: 'booking' 
  },
  
  // Notification title
  title: { 
    type: String, 
    required: true 
  },
  
  // Notification message/body
  message: { 
    type: String, 
    required: true 
  },
  
  // Additional data (for deep linking, etc.)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Related booking ID (if notification is about booking)
  bookingId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'BookingFlow' 
  },
  
  // Read status
  isRead: { 
    type: Boolean, 
    default: false 
  },
  
  // Read timestamp
  readAt: { 
    type: Date 
  },
  
  // Timestamps
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for faster queries
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);

