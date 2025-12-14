const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

function calcPrice(vehicle, { startAt, endAt, expectedKm }) {
  if(vehicle.rentType === 'hourly'){
    const msDiff = new Date(endAt) - new Date(startAt);
    const hours = Math.ceil(msDiff / (1000*60*60));
    return hours * vehicle.price;
  }
  if(vehicle.rentType === 'daily'){
    const msDiff = new Date(endAt) - new Date(startAt);
    const days = Math.ceil(msDiff / (1000*60*60*24));
    return days * vehicle.price;
  }
  if(vehicle.rentType === 'per_km'){
    return (expectedKm || 0) * vehicle.price;
  }
  // fixed
  return vehicle.price;
}

exports.createBooking = async (req,res) => {
  try {
    const { 
      vehicleId, startAt, endAt, expectedKm, pickupLocation, destination,
      driverRequired, paymentMethod
    } = req.body || {};
    
    const vehicle = await Vehicle.findOne({ 
      _id: vehicleId,
      isPublished: true,
      isDeleted: false
    });
    if(!vehicle) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Vehicle not found' 
    });

    if(vehicle.vehicleType !== 'rent') return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'This vehicle is not available for rent' 
    });

    const vehiclePrice = calcPrice(vehicle, { startAt, endAt, expectedKm });
    const driverPrice = driverRequired && vehicle.driverAvailable ? vehicle.driverPrice : 0;
    const totalPrice = vehiclePrice + driverPrice;

    // check overlapping bookings (basic)
    const conflict = await Booking.findOne({
      vehicle: vehicleId,
      status: { $in: ['pending','confirmed','in_progress'] },
      $or: [
        { startAt: { $lt: new Date(endAt), $gte: new Date(startAt) } },
        { endAt: { $lte: new Date(endAt), $gt: new Date(startAt) } },
      ]
    });
    if(conflict) return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Vehicle not available for selected time' 
    });

    const booking = new Booking({
      vehicle: vehicleId,
      renter: req.user._id,
      owner: vehicle.owner,
      startAt, endAt, expectedKm, pickupLocation, destination,
      driverRequired, vehiclePrice, driverPrice, totalPrice,
      paymentMethod, status: 'pending'
    });
    await booking.save();
    res.status(201).json({ 
      success: true, 
      data: booking, 
      message: 'Booking created successfully' 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

exports.getUserBookings = async (req,res) => {
  try {
    const bookings = await Booking.find({ renter: req.user._id })
      .populate('vehicle', 'title category images price rentType driverAvailable driverPrice')
      .populate('owner', 'name email phone businessName')
      .sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      data: bookings, 
      message: `Found ${bookings.length} bookings` 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get detailed booking list with pagination and filtering
exports.getBookingList = async (req,res) => {
  try {
    console.log('getBookingList called with user:', req.user);
    
    const { 
      page = 1, 
      limit = 10, 
      status, 
      startDate, 
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;
    
    const userId = req.user._id;
    const userRole = req.user.role;
    
    console.log('User ID:', userId, 'User Role:', userRole);
    
    // Build query based on user role
    let query = {};
    if (userRole === 'client') {
      query.owner = userId;
    } else {
      query.renter = userId;
    }
    
    // Add status filter
    if (status) {
      query.status = status;
    }
    
    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.createdAt.$lte = new Date(endDate);
      }
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    // Execute query with pagination
    const bookings = await Booking.find(query)
      .populate('vehicle', 'title category images price rentType driverAvailable driverPrice owner')
      .populate('renter', 'name email phone profileImage')
      .populate('owner', 'name email phone businessName businessPhone profileImage')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    // Get total count for pagination
    const totalBookings = await Booking.countDocuments(query);
    const totalPages = Math.ceil(totalBookings / parseInt(limit));
    
    res.json({ 
      success: true, 
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalBookings,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }, 
      message: `Found ${bookings.length} bookings` 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

exports.getOwnerBookings = async (req,res) => {
  try {
    const bookings = await Booking.find({ owner: req.user._id })
      .populate('vehicle', 'title category images')
      .populate('renter', 'name email phone')
      .sort({ createdAt: -1 });
    res.json({ 
      success: true, 
      data: bookings, 
      message: `Found ${bookings.length} bookings` 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Accept booking (for vehicle owners)
exports.acceptBooking = async (req,res) => {
  try {
    const { driverName, driverPhone, driverLicense } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if(!booking) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Booking not found' 
    });

    if(booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        message: 'Not authorized to accept this booking' 
      });
    }

    if(booking.status !== 'pending') return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Booking is not available for acceptance' 
    });

    booking.status = 'confirmed';
    booking.ownerAccepted = true;
    booking.ownerAcceptedAt = new Date();
    
    if(booking.driverRequired && driverName) {
      booking.driverAssigned = true;
      booking.driverName = driverName;
      booking.driverPhone = driverPhone;
      booking.driverLicense = driverLicense;
    }
    
    await booking.save();
    
    res.json({ 
      success: true, 
      data: booking, 
      message: 'Booking accepted successfully' 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Decline booking (for vehicle owners)
exports.declineBooking = async (req,res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if(!booking) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Booking not found' 
    });

    if(booking.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        message: 'Not authorized to decline this booking' 
      });
    }

    if(booking.status !== 'pending') return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Booking is not available for decline' 
    });

    booking.status = 'cancelled';
    await booking.save();
    
    res.json({ 
      success: true, 
      data: booking, 
      message: 'Booking declined successfully' 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Start trip
exports.startTrip = async (req,res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if(!booking) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Booking not found' 
    });

    if(booking.status !== 'confirmed') return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Trip can only be started for confirmed bookings' 
    });

    booking.status = 'in_progress';
    booking.tripStarted = true;
    booking.tripStartedAt = new Date();
    await booking.save();
    
    res.json({ 
      success: true, 
      data: booking, 
      message: 'Trip started successfully' 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Complete trip
exports.completeTrip = async (req,res) => {
  try {
    const { actualKm } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if(!booking) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Booking not found' 
    });

    if(booking.status !== 'in_progress') return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Trip can only be completed for in-progress bookings' 
    });

    booking.status = 'completed';
    booking.tripCompleted = true;
    booking.tripCompletedAt = new Date();
    booking.actualKm = actualKm;
    await booking.save();
    
    res.json({ 
      success: true, 
      data: booking, 
      message: 'Trip completed successfully' 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get booking by ID with full details
exports.getBookingById = async (req,res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('vehicle', 'title category images owner')
      .populate('renter', 'name email phone')
      .populate('owner', 'name email phone businessName');
      
    if(!booking) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Booking not found' 
    });
    
    res.json({ 
      success: true, 
      data: booking, 
      message: 'Booking found successfully' 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};
