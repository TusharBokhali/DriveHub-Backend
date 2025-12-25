const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { validateBookingFlow } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const {
  createBooking,
  getBookings,
  getBookingById,
  approveBooking,
  rejectBooking,
  startBooking,
  completeBooking
} = require('../controllers/bookingFlowController');

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'Not authenticated'
    });
  }
  // Check if user has admin role (you may need to add 'admin' to User model role enum)
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Forbidden: Admin role required'
    });
  }
  next();
};

// User routes - Create booking with document uploads
router.post('/bookings', protect, (req, res, next) => {
  // Allow 0 to 5 document images (documents are optional)
  upload.array('documents', 5)(req, res, (err) => {
    if (err) {
      console.error('❌ Upload error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);
      
      let errorMessage = 'File upload error';
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'File size too large. Maximum size is 10MB per file.';
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        errorMessage = 'Too many files. Maximum 5 document images allowed.';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        errorMessage = 'Unexpected file field. Only "documents" field is allowed for file uploads.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      return res.status(400).json({
        success: false,
        data: null,
        message: errorMessage
      });
    }
    
    // Log successful file upload
    if (req.files && req.files.length > 0) {
      console.log(`✅ Files uploaded successfully: ${req.files.length} document(s)`);
    } else {
      console.log('ℹ️ No files uploaded (documents are optional)');
    }
    
    next();
  });
}, validateBookingFlow, createBooking);

// User routes - Get own bookings
router.get('/bookings', protect, getBookings);

// User routes - Get booking by ID
router.get('/bookings/:id', protect, getBookingById);

// Admin routes - Approve booking
router.post('/bookings/:id/approve', protect, requireAdmin, approveBooking);

// Admin routes - Reject booking
router.post('/bookings/:id/reject', protect, requireAdmin, rejectBooking);

// Admin routes - Start booking (mark as ongoing)
router.post('/bookings/:id/start', protect, requireAdmin, startBooking);

// Admin routes - Complete booking and handle payment
router.post('/bookings/:id/complete', protect, requireAdmin, completeBooking);

module.exports = router;

