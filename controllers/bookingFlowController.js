const BookingFlow = require('../models/BookingFlow');
const Vehicle = require('../models/Vehicle');
const { createAndSendNotification } = require('./notificationController');

/**
 * POST /api/booking-flow/bookings
 * Create a new booking with user details and document images
 */
exports.createBooking = async (req, res) => {
  try {
    const { phone, email, description, vehicleId, paymentMethod } = req.body;

    // Validation
    if (!phone || !email || !vehicleId || !paymentMethod) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing required fields: phone, email, vehicleId, paymentMethod'
      });
    }

    if (!['online', 'pay_to_driver'].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'paymentMethod must be either "online" or "pay_to_driver"'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Invalid email format'
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Vehicle not found'
      });
    }

    // Handle document images (from multipart/form-data)
    const documentImages = [];
    if (req.files && req.files.length > 0) {
      // req.files is an array from multer
      req.files.forEach(file => {
        // If using Cloudinary, file.path or file.secure_url will be the URL
        // If using local storage, file.path will be the relative path
        const imageUrl = file.secure_url || file.path || file.url || `/uploads/${file.filename}`;
        documentImages.push(imageUrl);
      });
    } else if (req.file) {
      // Handle single file upload (fallback)
      const imageUrl = req.file.secure_url || req.file.path || req.file.url || `/uploads/${req.file.filename}`;
      documentImages.push(imageUrl);
    }

    // Limit to 5 images
    if (documentImages.length > 5) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Maximum 5 document images allowed'
      });
    }

    // Create booking
    const booking = new BookingFlow({
      user: req.user._id,
      phone,
      email,
      description,
      vehicleId,
      paymentMethod,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
      documentImages
    });

    await booking.save();

    // Populate vehicle details for response
    await booking.populate('vehicleId', 'title category images price');

    // SECURITY: Send notification ONLY to user who created booking
    const bookingOwnerId = booking.user._id || booking.user;
    const bookingOwnerEmail = req.user.email;
    
    console.log(`📝 Booking created by user ${bookingOwnerEmail} (${bookingOwnerId}), Booking ID: ${booking._id}`);
    
    try {
      await createAndSendNotification(
        bookingOwnerId, // Only booking creator gets notification
        'booking',
        'Booking Created',
        'Your booking has been created and is pending admin approval.',
        {
          action: 'booking_created',
          status: 'pending',
          bookingId: booking._id.toString()
        },
        booking._id
      );
      console.log(`✅ Notification sent to booking creator: ${bookingOwnerEmail} (${bookingOwnerId})`);
    } catch (notifError) {
      console.error(`❌ Error sending notification to booking creator ${bookingOwnerEmail}:`, notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully. Waiting for admin approval.'
    });
  } catch (err) {
    console.error('Create booking error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while creating booking'
    });
  }
};

/**
 * GET /api/booking-flow/bookings
 * Get all bookings (admin) or user's own bookings
 */
exports.getBookings = async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin, only show their own bookings
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const bookings = await BookingFlow.find(query)
      .populate('user', 'name email phone')
      .populate('vehicleId', 'title category images price')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: bookings,
      message: `Found ${bookings.length} bookings`
    });
  } catch (err) {
    console.error('Get bookings error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while fetching bookings'
    });
  }
};

/**
 * GET /api/booking-flow/bookings/:id
 * Get booking by ID
 */
exports.getBookingById = async (req, res) => {
  try {
    const booking = await BookingFlow.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('vehicleId', 'title category images price owner');

    if (!booking) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Booking not found'
      });
    }

    // Check authorization: user can only see their own bookings unless admin
    if (req.user.role !== 'admin' && booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking found successfully'
    });
  } catch (err) {
    console.error('Get booking by ID error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while fetching booking'
    });
  }
};

/**
 * POST /api/booking-flow/bookings/:id/approve
 * Admin API to approve booking
 * SECURITY: Only admin can approve, notification goes to booking owner only
 */
exports.approveBooking = async (req, res) => {
  try {
    const adminId = req.user._id; // Admin who is approving
    const adminEmail = req.user.email;
    const adminRole = req.user.role;
    
    // SECURITY: Verify admin role
    if (adminRole !== 'admin') {
      console.error(`Security: Non-admin user ${adminEmail} (${adminId}) attempted to approve booking`);
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: Admin role required'
      });
    }
    
    const booking = await BookingFlow.findById(req.params.id)
      .populate('user', 'name email role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Booking cannot be approved. Current status: ${booking.bookingStatus}`
      });
    }

    // SECURITY: Get booking owner ID (user who created booking)
    const bookingOwnerId = booking.user._id || booking.user;
    const bookingOwnerEmail = booking.user.email || 'Unknown';
    
    console.log(`🔐 Admin ${adminEmail} (${adminId}) approving booking ${req.params.id} for user ${bookingOwnerEmail} (${bookingOwnerId})`);

    booking.bookingStatus = 'approved';
    booking.approvedAt = new Date();
    if (req.body.adminNotes) {
      booking.adminNotes = req.body.adminNotes;
    }

    await booking.save();

    await booking.populate('user', 'name email phone');
    await booking.populate('vehicleId', 'title category images price');

    // SECURITY: Send notification ONLY to booking owner (user who created booking)
    try {
      await createAndSendNotification(
        bookingOwnerId, // Only booking owner gets notification
        'booking',
        'Booking Approved',
        `Your booking for ${booking.vehicleId?.title || 'vehicle'} has been approved!`,
        {
          action: 'booking_approved',
          status: 'approved',
          vehicleTitle: booking.vehicleId?.title,
          approvedBy: adminEmail
        },
        booking._id
      );
      console.log(`✅ Notification sent to booking owner: ${bookingOwnerEmail} (${bookingOwnerId})`);
    } catch (notifError) {
      console.error(`❌ Error sending notification to booking owner ${bookingOwnerEmail}:`, notifError);
      // Don't fail the request if notification fails
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking approved successfully'
    });
  } catch (err) {
    console.error('Approve booking error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while approving booking'
    });
  }
};

/**
 * POST /api/booking-flow/bookings/:id/reject
 * Admin API to reject booking
 * SECURITY: Only admin can reject, notification goes to booking owner only
 */
exports.rejectBooking = async (req, res) => {
  try {
    const adminId = req.user._id; // Admin who is rejecting
    const adminEmail = req.user.email;
    const adminRole = req.user.role;
    
    // SECURITY: Verify admin role
    if (adminRole !== 'admin') {
      console.error(`Security: Non-admin user ${adminEmail} (${adminId}) attempted to reject booking`);
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: Admin role required'
      });
    }
    
    const booking = await BookingFlow.findById(req.params.id)
      .populate('user', 'name email role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Booking cannot be rejected. Current status: ${booking.bookingStatus}`
      });
    }

    // SECURITY: Get booking owner ID (user who created booking)
    const bookingOwnerId = booking.user._id || booking.user;
    const bookingOwnerEmail = booking.user.email || 'Unknown';
    
    console.log(`🔐 Admin ${adminEmail} (${adminId}) rejecting booking ${req.params.id} for user ${bookingOwnerEmail} (${bookingOwnerId})`);

    booking.bookingStatus = 'rejected';
    booking.rejectedAt = new Date();
    if (req.body.adminNotes) {
      booking.adminNotes = req.body.adminNotes;
    }

    await booking.save();

    await booking.populate('user', 'name email phone');
    await booking.populate('vehicleId', 'title category images price');

    // SECURITY: Send notification ONLY to booking owner (user who created booking)
    try {
      const rejectionReason = req.body.adminNotes || 'Please contact support for more information.';
      await createAndSendNotification(
        bookingOwnerId, // Only booking owner gets notification
        'booking',
        'Booking Rejected',
        `Your booking for ${booking.vehicleId?.title || 'vehicle'} has been rejected. ${rejectionReason}`,
        {
          action: 'booking_rejected',
          status: 'rejected',
          vehicleTitle: booking.vehicleId?.title,
          reason: rejectionReason,
          rejectedBy: adminEmail
        },
        booking._id
      );
      console.log(`✅ Notification sent to booking owner: ${bookingOwnerEmail} (${bookingOwnerId})`);
    } catch (notifError) {
      console.error(`❌ Error sending notification to booking owner ${bookingOwnerEmail}:`, notifError);
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking rejected successfully'
    });
  } catch (err) {
    console.error('Reject booking error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while rejecting booking'
    });
  }
};

/**
 * POST /api/booking-flow/bookings/:id/start
 * Admin API to mark booking as ongoing (trip started)
 * SECURITY: Only admin can start, notification goes to booking owner only
 */
exports.startBooking = async (req, res) => {
  try {
    const adminId = req.user._id; // Admin who is starting trip
    const adminEmail = req.user.email;
    const adminRole = req.user.role;
    
    // SECURITY: Verify admin role
    if (adminRole !== 'admin') {
      console.error(`Security: Non-admin user ${adminEmail} (${adminId}) attempted to start booking`);
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: Admin role required'
      });
    }
    
    const booking = await BookingFlow.findById(req.params.id)
      .populate('user', 'name email role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Booking cannot be started. Current status: ${booking.bookingStatus}. Booking must be approved first.`
      });
    }

    // SECURITY: Get booking owner ID (user who created booking)
    const bookingOwnerId = booking.user._id || booking.user;
    const bookingOwnerEmail = booking.user.email || 'Unknown';
    
    console.log(`🔐 Admin ${adminEmail} (${adminId}) starting booking ${req.params.id} for user ${bookingOwnerEmail} (${bookingOwnerId})`);

    booking.bookingStatus = 'ongoing';
    booking.startedAt = new Date();
    if (req.body.adminNotes) {
      booking.adminNotes = req.body.adminNotes;
    }

    await booking.save();

    await booking.populate('user', 'name email phone');
    await booking.populate('vehicleId', 'title category images price');

    // SECURITY: Send notification ONLY to booking owner (user who created booking)
    try {
      await createAndSendNotification(
        bookingOwnerId, // Only booking owner gets notification
        'booking',
        'Trip Started',
        `Your trip with ${booking.vehicleId?.title || 'vehicle'} has started! Have a safe journey.`,
        {
          action: 'trip_started',
          status: 'ongoing',
          vehicleTitle: booking.vehicleId?.title,
          startedBy: adminEmail
        },
        booking._id
      );
      console.log(`✅ Notification sent to booking owner: ${bookingOwnerEmail} (${bookingOwnerId})`);
    } catch (notifError) {
      console.error(`❌ Error sending notification to booking owner ${bookingOwnerEmail}:`, notifError);
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking marked as ongoing (trip started)'
    });
  } catch (err) {
    console.error('Start booking error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while starting booking'
    });
  }
};

/**
 * POST /api/booking-flow/bookings/:id/complete
 * Admin API to mark booking as completed and handle payment
 * SECURITY: Only admin can complete, notification goes to booking owner only
 */
exports.completeBooking = async (req, res) => {
  try {
    const adminId = req.user._id; // Admin who is completing
    const adminEmail = req.user.email;
    const adminRole = req.user.role;
    
    // SECURITY: Verify admin role
    if (adminRole !== 'admin') {
      console.error(`Security: Non-admin user ${adminEmail} (${adminId}) attempted to complete booking`);
      return res.status(403).json({
        success: false,
        data: null,
        message: 'Forbidden: Admin role required'
      });
    }
    
    const booking = await BookingFlow.findById(req.params.id)
      .populate('user', 'name email role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Booking not found'
      });
    }

    if (booking.bookingStatus !== 'ongoing') {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Booking cannot be completed. Current status: ${booking.bookingStatus}. Booking must be ongoing first.`
      });
    }

    // SECURITY: Get booking owner ID (user who created booking)
    const bookingOwnerId = booking.user._id || booking.user;
    const bookingOwnerEmail = booking.user.email || 'Unknown';
    
    console.log(`🔐 Admin ${adminEmail} (${adminId}) completing booking ${req.params.id} for user ${bookingOwnerEmail} (${bookingOwnerId})`);

    // Handle payment based on payment method
    if (booking.paymentMethod === 'online') {
      // For online payment, we expect payment confirmation
      // This is a placeholder - no actual Razorpay integration
      const { paymentConfirmed } = req.body;
      
      if (paymentConfirmed !== true) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Payment confirmation required for online payment method'
        });
      }

      // In a real scenario, you would verify the Razorpay payment here
      // For now, we just mark it as paid if paymentConfirmed is true
      booking.paymentStatus = 'paid';
      booking.paidAt = new Date();
    } else if (booking.paymentMethod === 'pay_to_driver') {
      // For pay_to_driver, admin confirms payment was received
      const { paymentConfirmed } = req.body;
      
      if (paymentConfirmed !== true) {
        return res.status(400).json({
          success: false,
          data: null,
          message: 'Payment confirmation required. Please confirm that payment was received from the driver.'
        });
      }

      booking.paymentStatus = 'paid';
      booking.paidAt = new Date();
    }

    // Mark booking as completed
    booking.bookingStatus = 'completed';
    booking.completedAt = new Date();
    
    if (req.body.adminNotes) {
      booking.adminNotes = req.body.adminNotes;
    }

    await booking.save();

    await booking.populate('user', 'name email phone');
    await booking.populate('vehicleId', 'title category images price');

    // SECURITY: Send notification ONLY to booking owner (user who created booking)
    try {
      await createAndSendNotification(
        bookingOwnerId, // Only booking owner gets notification
        'booking',
        'Trip Completed',
        `Your trip with ${booking.vehicleId?.title || 'vehicle'} has been completed successfully! Payment status: ${booking.paymentStatus}.`,
        {
          action: 'trip_completed',
          status: 'completed',
          paymentStatus: booking.paymentStatus,
          vehicleTitle: booking.vehicleId?.title,
          completedBy: adminEmail
        },
        booking._id
      );
      console.log(`✅ Notification sent to booking owner: ${bookingOwnerEmail} (${bookingOwnerId})`);
    } catch (notifError) {
      console.error(`❌ Error sending notification to booking owner ${bookingOwnerEmail}:`, notifError);
    }

    res.json({
      success: true,
      data: booking,
      message: 'Booking completed successfully and payment confirmed'
    });
  } catch (err) {
    console.error('Complete booking error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error while completing booking'
    });
  }
};

