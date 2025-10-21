const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { validateBooking } = require('../middlewares/validation');
const { 
  createBooking, getUserBookings, getOwnerBookings, acceptBooking, 
  declineBooking, startTrip, completeTrip, getBookingById, getBookingList
} = require('../controllers/bookingsController');

// User routes
router.post('/', protect, validateBooking, createBooking);
router.get('/me', protect, getUserBookings);
router.get('/list', protect, getBookingList);
router.get('/:id', protect, getBookingById);

// Owner routes
router.get('/owner/requests', protect, requireRole('client'), getOwnerBookings);
router.post('/:id/accept', protect, requireRole('client'), acceptBooking);
router.post('/:id/decline', protect, requireRole('client'), declineBooking);

// Trip management
router.post('/:id/start', protect, startTrip);
router.post('/:id/complete', protect, completeTrip);

module.exports = router;
