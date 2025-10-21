const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: {type:String, required:true},
  description: String,
  category: {type:String, enum:['bike','car','auto','other'], default:'other'},
  images: [String], // urls / paths
  vehicleType: { type:String, enum:['sell','rent','service'], required:true }, // sell, rent, or service
  rentType: { type:String, enum:['hourly','daily','per_km','fixed'], required: function() { return this.vehicleType === 'rent'; } },
  price: { type:Number, required:true }, // base price (interpretation depends on rentType)
  priceUnit: String, // e.g., 'INR' or per 'hour' etc.
  // Multiple pricing options for rent
  hourlyPrice: { type:Number, required: function() { return this.vehicleType === 'rent' && this.rentType === 'hourly'; } },
  dailyPrice: { type:Number, required: function() { return this.vehicleType === 'rent' && this.rentType === 'daily'; } },
  perKmPrice: { type:Number, required: function() { return this.vehicleType === 'rent' && this.rentType === 'per_km'; } },
  // Driver options
  driverRequired: { type:Boolean, default:false },
  driverPrice: { type:Number, default:0 }, // additional price for driver
  driverAvailable: { type:Boolean, default:false },
  // Ratings and reviews
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type:Number, min:1, max:5, required:true },
    review: String,
    createdAt: { type:Date, default: Date.now }
  }],
  averageRating: { type:Number, default:0 },
  totalRatings: { type:Number, default:0 },
  // Location and availability
  location: String,
  isAvailable: {type:Boolean, default:true},
  // Vehicle specifications
  mileage: { type: Number, default: 0 }, // km driven
  seats: { type: Number, default: 4 }, // number of seats
  transmission: { type: String, enum: ['manual', 'automatic', 'semi-automatic'], default: 'manual' },
  fuelType: { type: String, enum: ['petrol', 'diesel', 'electric', 'hybrid', 'cng'], default: 'petrol' },
  year: { type: Number, default: new Date().getFullYear() },
  // Features array
  features: [{
    name: { type: String, required: true },
    icon: { type: String }, // icon name or URL
    available: { type: Boolean, default: true }
  }],
  // Service specific fields
  serviceCategory: { type:String, enum:['maintenance','repair','cleaning','inspection','other'], required: function() { return this.vehicleType === 'service'; } },
  serviceDescription: { type:String, required: function() { return this.vehicleType === 'service'; } },
  createdAt: {type:Date, default: Date.now}
});

// Calculate average rating
vehicleSchema.methods.calculateAverageRating = function() {
  if (this.ratings.length === 0) {
    this.averageRating = 0;
    this.totalRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, rating) => acc + rating.rating, 0);
    this.averageRating = sum / this.ratings.length;
    this.totalRatings = this.ratings.length;
  }
  return this.averageRating;
};

module.exports = mongoose.model('Vehicle', vehicleSchema);
