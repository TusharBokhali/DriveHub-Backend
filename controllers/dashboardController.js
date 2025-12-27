const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const BookingFlow = require('../models/BookingFlow');
const User = require('../models/User');

// Get dashboard data
exports.getDashboardData = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Total Vehicles - Exclude deleted vehicles, include only published
    const totalVehicles = await Vehicle.countDocuments({ 
      isDeleted: false,
      isPublished: true 
    });
    const vehiclesThisMonth = await Vehicle.countDocuments({
      isDeleted: false,
      isPublished: true,
      createdAt: { $gte: startOfMonth }
    });
    const vehiclesLastMonth = await Vehicle.countDocuments({
      isDeleted: false,
      isPublished: true,
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });
    const vehiclesChange = vehiclesThisMonth - vehiclesLastMonth;

    // Active Rentals - Combine both Booking and BookingFlow models
    // Booking model: confirmed or in_progress
    const activeBookings = await Booking.countDocuments({
      status: { $in: ['confirmed', 'in_progress'] }
    });
    // BookingFlow model: approved or ongoing
    const activeBookingFlows = await BookingFlow.countDocuments({
      bookingStatus: { $in: ['approved', 'ongoing'] }
    });
    const activeRentals = activeBookings + activeBookingFlows;
    
    const activeBookingsThisWeek = await Booking.countDocuments({
      status: { $in: ['confirmed', 'in_progress'] },
      createdAt: { $gte: startOfWeek }
    });
    const activeBookingFlowsThisWeek = await BookingFlow.countDocuments({
      bookingStatus: { $in: ['approved', 'ongoing'] },
      createdAt: { $gte: startOfWeek }
    });
    const activeRentalsThisWeek = activeBookingsThisWeek + activeBookingFlowsThisWeek;
    
    const activeBookingsLastWeek = await Booking.countDocuments({
      status: { $in: ['confirmed', 'in_progress'] },
      createdAt: { $gte: startOfLastWeek, $lt: startOfWeek }
    });
    const activeBookingFlowsLastWeek = await BookingFlow.countDocuments({
      bookingStatus: { $in: ['approved', 'ongoing'] },
      createdAt: { $gte: startOfLastWeek, $lt: startOfWeek }
    });
    const activeRentalsLastWeek = activeBookingsLastWeek + activeBookingFlowsLastWeek;
    
    const activeRentalsChange = activeRentalsLastWeek > 0 
      ? ((activeRentalsThisWeek - activeRentalsLastWeek) / activeRentalsLastWeek * 100).toFixed(0)
      : 0;

    // Total Sales (vehicles with vehicleType = 'sell' - exclude deleted, only published)
    const totalSales = await Vehicle.countDocuments({ 
      vehicleType: 'sell',
      isDeleted: false,
      isPublished: true
    });
    const salesThisMonth = await Vehicle.countDocuments({
      vehicleType: 'sell',
      isDeleted: false,
      isPublished: true,
      createdAt: { $gte: startOfMonth }
    });
    const salesLastMonth = await Vehicle.countDocuments({
      vehicleType: 'sell',
      isDeleted: false,
      isPublished: true,
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });
    const salesChange = salesThisMonth - salesLastMonth;

    // Pending Bookings - Combine both models
    const pendingBookingsOld = await Booking.countDocuments({ status: 'pending' });
    const pendingBookingsNew = await BookingFlow.countDocuments({ bookingStatus: 'pending' });
    const pendingBookings = pendingBookingsOld + pendingBookingsNew;
    
    // Total Users
    const totalUsers = await User.countDocuments();
    const usersThisMonth = await User.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const usersLastMonth = await User.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });
    const usersChange = usersThisMonth - usersLastMonth;

    // Monthly Revenue - Calculate from both Booking and BookingFlow models
    // Booking model: completed bookings with totalPrice
    const monthlyRevenueOld = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfMonth },
          totalPrice: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);
    const revenueOld = monthlyRevenueOld.length > 0 ? monthlyRevenueOld[0].total : 0;
    
    // BookingFlow model: completed bookings - calculate price from priceType
    const completedBookingFlows = await BookingFlow.find({
      bookingStatus: 'completed',
      createdAt: { $gte: startOfMonth },
      paymentStatus: 'paid'
    }).select('priceType');
    
    let revenueNew = 0;
    completedBookingFlows.forEach(booking => {
      if (booking.priceType && typeof booking.priceType === 'object') {
        // Extract price from priceType object
        const price = booking.priceType.price || booking.priceType.total || booking.priceType.amount || 0;
        revenueNew += Number(price) || 0;
      }
    });
    
    const currentMonthRevenue = revenueOld + revenueNew;

    // Last month revenue for comparison
    const lastMonthRevenueOld = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
          totalPrice: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);
    const previousRevenueOld = lastMonthRevenueOld.length > 0 ? lastMonthRevenueOld[0].total : 0;
    
    const completedBookingFlowsLastMonth = await BookingFlow.find({
      bookingStatus: 'completed',
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth },
      paymentStatus: 'paid'
    }).select('priceType');
    
    let previousRevenueNew = 0;
    completedBookingFlowsLastMonth.forEach(booking => {
      if (booking.priceType && typeof booking.priceType === 'object') {
        const price = booking.priceType.price || booking.priceType.total || booking.priceType.amount || 0;
        previousRevenueNew += Number(price) || 0;
      }
    });
    
    const previousMonthRevenue = previousRevenueOld + previousRevenueNew;
    const revenueChange = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
      : 0;

    // Helper function to get status color
    const getStatusColor = (status) => {
      const statusColors = {
        // BookingFlow statuses
        'pending': '#FFA500',      // Orange
        'approved': '#4CAF50',      // Green
        'rejected': '#F44336',     // Red
        'ongoing': '#2196F3',      // Blue
        'completed': '#28A745',    // Green (darker)
        'cancelled': '#DC3545',    // Red (darker)
        // Booking model statuses
        'confirmed': '#4CAF50',     // Green
        'in_progress': '#2196F3',  // Blue
      };
      return statusColors[status] || '#6C757D'; // Default gray
    };

    // Latest Bookings - Get from both models and combine with full details
    const latestBookingsOld = await Booking.find()
      .populate('renter', 'name email phone profileImage')
      .populate('vehicle', 'title year images category vehicleType price')
      .populate('owner', 'name email phone businessName')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const latestBookingsNew = await BookingFlow.find()
      .populate('user', 'name email phone profileImage')
      .populate('vehicleId', 'title year images category vehicleType price')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Combine and sort by createdAt, then take top 3
    const allBookings = [
      ...latestBookingsOld.map(b => ({ ...b.toObject(), source: 'booking' })),
      ...latestBookingsNew.map(b => ({ ...b.toObject(), source: 'bookingFlow' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

    // Format latest bookings with full details
    const formattedBookings = allBookings.map(booking => {
      // Handle both Booking and BookingFlow models
      const renter = booking.renter || booking.user;
      const vehicle = booking.vehicle || booking.vehicleId;
      const owner = booking.owner || null;
      const renterName = renter?.name || 'Unknown';
      const initials = renterName.split(' ').map(n => n[0]).join('').toUpperCase();
      const vehicleName = vehicle 
        ? `${vehicle.title} ${vehicle.year || ''}`.trim()
        : 'Unknown Vehicle';
      
      // Get date from appropriate field
      const bookingDate = new Date(booking.startAt || booking.startDate || booking.createdAt);
      const formattedDate = bookingDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const formattedTime = bookingDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      // Format amount with currency - handle both models
      let amount = 0;
      let priceDetails = null;
      if (booking.source === 'booking') {
        amount = booking.totalPrice || 0;
        priceDetails = {
          vehiclePrice: booking.vehiclePrice || 0,
          driverPrice: booking.driverPrice || 0,
          totalPrice: booking.totalPrice || 0
        };
      } else if (booking.source === 'bookingFlow') {
        if (booking.priceType && typeof booking.priceType === 'object') {
          amount = booking.priceType.price || booking.priceType.total || booking.priceType.amount || 0;
          priceDetails = booking.priceType;
        }
      }
      const formattedAmount = `₹${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

      // Get status from appropriate field
      const status = booking.status || booking.bookingStatus || 'pending';
      const statusColor = getStatusColor(status);

      // Extract vehicle image - handle both object and string formats
      let vehicleImage = null;
      if (vehicle?.images && vehicle.images.length > 0) {
        const firstImage = vehicle.images[0];
        if (typeof firstImage === 'string') {
          vehicleImage = firstImage;
        } else if (typeof firstImage === 'object' && firstImage.url) {
          vehicleImage = firstImage.url;
        }
      }

      // Get status change timestamps
      const statusHistory = {};
      if (booking.source === 'bookingFlow') {
        if (booking.approvedAt) statusHistory.approvedAt = booking.approvedAt;
        if (booking.rejectedAt) statusHistory.rejectedAt = booking.rejectedAt;
        if (booking.startedAt) statusHistory.startedAt = booking.startedAt;
        if (booking.completedAt) statusHistory.completedAt = booking.completedAt;
        if (booking.cancelledAt) statusHistory.cancelledAt = booking.cancelledAt;
        if (booking.paidAt) statusHistory.paidAt = booking.paidAt;
      } else if (booking.source === 'booking') {
        if (booking.ownerAcceptedAt) statusHistory.ownerAcceptedAt = booking.ownerAcceptedAt;
        if (booking.tripStartedAt) statusHistory.tripStartedAt = booking.tripStartedAt;
        if (booking.tripCompletedAt) statusHistory.tripCompletedAt = booking.tripCompletedAt;
      }
      statusHistory.createdAt = booking.createdAt;
      statusHistory.updatedAt = booking.updatedAt || booking.createdAt;

      // Get documents (only for BookingFlow)
      const documents = booking.source === 'bookingFlow' ? (booking.documentImages || []) : [];

      // Get cancellation reason (only for BookingFlow)
      const cancellationReason = booking.source === 'bookingFlow' ? (booking.cancellationReason || null) : null;

      // Build full booking details object
      const bookingDetails = {
        // Basic info
        id: booking._id,
        source: booking.source, // 'booking' or 'bookingFlow'
        
        // User/Renter info
        renter: {
          id: renter?._id || null,
          name: renterName,
          initials: initials,
          avatar: renter?.profileImage || null,
          email: renter?.email || null,
          phone: renter?.phone || null
        },
        
        // Owner info (if available)
        owner: owner ? {
          id: owner._id || null,
          name: owner.name || null,
          email: owner.email || null,
          phone: owner.phone || null,
          businessName: owner.businessName || null
        } : null,
        
        // Vehicle info
        vehicle: {
          id: vehicle?._id || null,
          name: vehicleName,
          title: vehicle?.title || null,
          year: vehicle?.year || null,
          category: vehicle?.category || null,
          vehicleType: vehicle?.vehicleType || null,
          price: vehicle?.price || null,
          image: vehicleImage
        },
        
        // Booking dates
        startDate: booking.startAt || booking.startDate || null,
        endDate: booking.endAt || booking.endDate || null,
        date: `${formattedDate} • ${formattedTime}`,
        
        // Pricing
        amount: formattedAmount,
        amountValue: amount,
        priceDetails: priceDetails,
        
        // Status
        status: status,
        statusColor: statusColor,
        paymentStatus: booking.paymentStatus || null,
        paymentMethod: booking.paymentMethod || null,
        
        // Documents (for BookingFlow)
        documents: documents,
        
        // Cancellation info
        cancellationReason: cancellationReason,
        
        // Status change history
        statusHistory: statusHistory,
        
        // Additional details
        driverIncluded: booking.driverIncluded || booking.driverRequired || false,
        driverInfo: booking.source === 'booking' ? {
          driverAssigned: booking.driverAssigned || false,
          driverName: booking.driverName || null,
          driverPhone: booking.driverPhone || null,
          driverLicense: booking.driverLicense || null
        } : null,
        
        // Trip details (for Booking model)
        tripDetails: booking.source === 'booking' ? {
          pickupLocation: booking.pickupLocation || null,
          destination: booking.destination || null,
          expectedKm: booking.expectedKm || null,
          actualKm: booking.actualKm || null,
          tripStarted: booking.tripStarted || false,
          tripCompleted: booking.tripCompleted || false
        } : null,
        
        // Description/Notes
        description: booking.description || null,
        adminNotes: booking.adminNotes || null,
        
        // Timestamps
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt || booking.createdAt
      };

      return bookingDetails;
    });

    // Format KPI Cards
    const kpiCards = {
      totalVehicles: {
        value: totalVehicles,
        label: 'Total Vehicles',
        trend: vehiclesChange > 0 ? `+${vehiclesChange} this month` : `${vehiclesChange} this month`,
        trendType: vehiclesChange >= 0 ? 'positive' : 'negative'
      },
      activeRentals: {
        value: activeRentals,
        label: 'Active Rentals',
        trend: activeRentalsChange > 0 ? `+${activeRentalsChange}% vs last week` : `${activeRentalsChange}% vs last week`,
        trendType: activeRentalsChange >= 0 ? 'positive' : 'negative'
      },
      totalSales: {
        value: totalSales,
        label: 'Total Sales',
        trend: salesChange > 0 ? `+${salesChange} this month` : `${salesChange} this month`,
        trendType: salesChange >= 0 ? 'positive' : 'negative'
      },
      totalUsers: {
        value: totalUsers,
        label: 'Total Users',
        trend: usersChange > 0 ? `+${usersChange} this month` : `${usersChange} this month`,
        trendType: usersChange >= 0 ? 'positive' : 'negative'
      },
      pendingBookings: {
        value: pendingBookings,
        label: 'Pending Bookings',
        alert: pendingBookings > 0 ? 'Needs attention' : null,
        trendType: pendingBookings > 0 ? 'negative' : 'positive'
      },
      monthlyRevenue: {
        value: currentMonthRevenue,
        formattedValue: `₹${currentMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        label: 'Monthly Revenue',
        trend: revenueChange > 0 ? `+${revenueChange}% from last month` : `${revenueChange}% from last month`,
        trendType: revenueChange >= 0 ? 'positive' : 'negative'
      }
    };

    res.json({
      success: true,
      data: {
        kpiCards,
        latestBookings: formattedBookings
      },
      message: 'Dashboard data retrieved successfully'
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error'
    });
  }
};

