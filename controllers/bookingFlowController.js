const BookingFlow = require('../models/BookingFlow');
const Vehicle = require('../models/Vehicle');

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
 */
exports.approveBooking = async (req, res) => {
  try {
    const booking = await BookingFlow.findById(req.params.id);

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

    booking.bookingStatus = 'approved';
    booking.approvedAt = new Date();
    if (req.body.adminNotes) {
      booking.adminNotes = req.body.adminNotes;
    }

    await booking.save();

    await booking.populate('user', 'name email phone');
    await booking.populate('vehicleId', 'title category images price');

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
 */
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await BookingFlow.findById(req.params.id);

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

    booking.bookingStatus = 'rejected';
    booking.rejectedAt = new Date();
    if (req.body.adminNotes) {
      booking.adminNotes = req.body.adminNotes;
    }

    await booking.save();

    await booking.populate('user', 'name email phone');
    await booking.populate('vehicleId', 'title category images price');

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
 */
exports.startBooking = async (req, res) => {
  try {
    const booking = await BookingFlow.findById(req.params.id);

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

    booking.bookingStatus = 'ongoing';
    booking.startedAt = new Date();
    if (req.body.adminNotes) {
      booking.adminNotes = req.body.adminNotes;
    }

    await booking.save();

    await booking.populate('user', 'name email phone');
    await booking.populate('vehicleId', 'title category images price');

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
 */
exports.completeBooking = async (req, res) => {
  try {
    const booking = await BookingFlow.findById(req.params.id);

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

