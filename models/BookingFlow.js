const mongoose = require('mongoose');

const bookingFlowSchema = new mongoose.Schema({
  // User details
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  description: { type: String },
  
  // Vehicle selection
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  
  // Booking dates
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  
  // Driver information
  driverIncluded: { type: Boolean, default: false },
  
  // Price type (object)
  priceType: { type: mongoose.Schema.Types.Mixed },
  
  // Payment method
  paymentMethod: { 
    type: String, 
    enum: ['online', 'pay_to_driver'], 
    required: true 
  },
  
  // Booking status
  bookingStatus: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected', 'ongoing', 'completed'], 
    default: 'pending' 
  },
  
  // Payment status
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid'], 
    default: 'unpaid' 
  },
  
  // Document images (Aadhaar, PAN, RC, Light Bill - up to 4-5 images)
  documentImages: [{
    type: String, // URLs or file paths
  }],
  
  // Admin notes (optional)
  adminNotes: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  approvedAt: Date,
  rejectedAt: Date,
  startedAt: Date,
  completedAt: Date,
  paidAt: Date
});

// Update the updatedAt field before saving
bookingFlowSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('BookingFlow', bookingFlowSchema);

