const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  // Trip details
  startAt: Date,
  endAt: Date,
  expectedKm: Number, // for per_km type
  pickupLocation: String,
  destination: String,
  // Driver information
  driverRequired: { type:Boolean, default:false },
  driverAssigned: { type:Boolean, default:false },
  driverName: String,
  driverPhone: String,
  driverLicense: String,
  // Pricing
  vehiclePrice: Number,
  driverPrice: Number,
  totalPrice: Number,
  // Status and management
  status: { type:String, enum:['pending','confirmed','cancelled','completed','in_progress'], default:'pending' },
  ownerAccepted: { type:Boolean, default:false },
  ownerAcceptedAt: Date,
  // Payment information
  paymentMethod: { type:String, enum:['online','offline'], default:'offline' },
  paymentStatus: { type:String, enum:['pending','paid','failed'], default:'pending' },
  paymentId: String,
  // Trip tracking
  tripStarted: { type:Boolean, default:false },
  tripStartedAt: Date,
  tripCompleted: { type:Boolean, default:false },
  tripCompletedAt: Date,
  actualKm: Number,
  // Communication
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    message: String,
    timestamp: { type:Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
