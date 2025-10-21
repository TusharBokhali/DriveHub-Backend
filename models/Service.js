const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  vehicleCategory: { type:String, enum:['bike','car','auto','other'], required:true },
  serviceType: { type:String, enum:['maintenance','repair','cleaning','inspection','other'], required:true },
  title: { type:String, required:true },
  description: { type:String, required:true },
  // Contact information
  mobile: { type:String, required:true },
  email: { type:String, required:true },
  address: String,
  // Service details
  urgency: { type:String, enum:['low','medium','high','urgent'], default:'medium' },
  preferredDate: Date,
  preferredTime: String,
  // Payment
  paymentMethod: { type:String, enum:['online','offline'], required:true },
  estimatedPrice: Number,
  // Status
  status: { type:String, enum:['pending','accepted','in_progress','completed','cancelled'], default:'pending' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // client who accepted
  // Additional details
  images: [String], // service requirement images
  notes: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);
