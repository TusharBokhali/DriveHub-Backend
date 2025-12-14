const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
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

    // Total Vehicles
    const totalVehicles = await Vehicle.countDocuments();
    const vehiclesThisMonth = await Vehicle.countDocuments({
      createdAt: { $gte: startOfMonth }
    });
    const vehiclesLastMonth = await Vehicle.countDocuments({
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });
    const vehiclesChange = vehiclesThisMonth - vehiclesLastMonth;

    // Active Rentals (confirmed or in_progress bookings)
    const activeRentals = await Booking.countDocuments({
      status: { $in: ['confirmed', 'in_progress'] }
    });
    const activeRentalsThisWeek = await Booking.countDocuments({
      status: { $in: ['confirmed', 'in_progress'] },
      createdAt: { $gte: startOfWeek }
    });
    const activeRentalsLastWeek = await Booking.countDocuments({
      status: { $in: ['confirmed', 'in_progress'] },
      createdAt: { $gte: startOfLastWeek, $lt: startOfWeek }
    });
    const activeRentalsChange = activeRentalsLastWeek > 0 
      ? ((activeRentalsThisWeek - activeRentalsLastWeek) / activeRentalsLastWeek * 100).toFixed(0)
      : 0;

    // Total Sales (vehicles with vehicleType = 'sell' and completed bookings)
    const totalSales = await Vehicle.countDocuments({ vehicleType: 'sell' });
    const salesThisMonth = await Vehicle.countDocuments({
      vehicleType: 'sell',
      createdAt: { $gte: startOfMonth }
    });
    const salesLastMonth = await Vehicle.countDocuments({
      vehicleType: 'sell',
      createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
    });
    const salesChange = salesThisMonth - salesLastMonth;

    // Pending Bookings
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });

    // Monthly Revenue (sum of totalPrice from completed bookings this month)
    const monthlyRevenue = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);
    const currentMonthRevenue = monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0;

    // Last month revenue for comparison
    const lastMonthRevenue = await Booking.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: startOfLastMonth, $lt: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalPrice' }
        }
      }
    ]);
    const previousMonthRevenue = lastMonthRevenue.length > 0 ? lastMonthRevenue[0].total : 0;
    const revenueChange = previousMonthRevenue > 0 
      ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue * 100).toFixed(1)
      : 0;

    // Latest Bookings (last 3 bookings with populated data)
    const latestBookings = await Booking.find()
      .populate('renter', 'name email profileImage')
      .populate('vehicle', 'title year')
      .sort({ createdAt: -1 })
      .limit(3)
      .select('renter vehicle startAt totalPrice status createdAt');

    // Format latest bookings
    const formattedBookings = latestBookings.map(booking => {
      const renterName = booking.renter?.name || 'Unknown';
      const initials = renterName.split(' ').map(n => n[0]).join('').toUpperCase();
      const vehicleName = booking.vehicle 
        ? `${booking.vehicle.title} ${booking.vehicle.year || ''}`.trim()
        : 'Unknown Vehicle';
      
      const bookingDate = new Date(booking.startAt || booking.createdAt);
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

      // Format amount with currency
      const amount = booking.totalPrice || 0;
      const formattedAmount = `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

      return {
        id: booking._id,
        renter: {
          name: renterName,
          initials: initials,
          avatar: booking.renter?.profileImage || null
        },
        vehicle: vehicleName,
        date: `${formattedDate} • ${formattedTime}`,
        amount: formattedAmount,
        amountValue: amount,
        status: booking.status
      };
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
      pendingBookings: {
        value: pendingBookings,
        label: 'Pending Bookings',
        alert: pendingBookings > 0 ? 'Needs attention' : null,
        trendType: pendingBookings > 0 ? 'negative' : 'positive'
      },
      monthlyRevenue: {
        value: currentMonthRevenue,
        formattedValue: `$${currentMonthRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
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

