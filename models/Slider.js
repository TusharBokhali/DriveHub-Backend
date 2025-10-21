const mongoose = require('mongoose');

const sliderSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true,
    trim: true
  },
  subtitle: { 
    type: String, 
    required: true,
    trim: true
  },
  description: { 
    type: String,
    trim: true
  },
  image: { 
    type: String, 
    required: true 
  }, // single image for slider
  buttonText: { 
    type: String, 
    default: 'Explore Now',
    trim: true
  },
  buttonLink: { 
    type: String,
    trim: true
  },
  type: { 
    type: String, 
    enum: ['latest', 'offer', 'featured', 'promotion'], 
    default: 'featured',
    required: true
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  order: { 
    type: Number, 
    default: 0 
  }, // for ordering sliders
  startDate: { 
    type: Date 
  }, // for time-based offers
  endDate: { 
    type: Date 
  }, // for time-based offers
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
sliderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
sliderSchema.index({ type: 1, isActive: 1, order: 1 });

module.exports = mongoose.model('Slider', sliderSchema);
