const Slider = require('../models/Slider');

// Create a new slider
exports.createSlider = async (req, res) => {
  try {
    const { 
      title, subtitle, description, buttonText, buttonLink, 
      type, isActive, order, startDate, endDate 
    } = req.body;
    
    // Handle image upload (supports both local disk and Cloudinary)
    const image = req.file
      ? (req.file.path || `/uploads/${req.file.filename}`)
      : null;
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'Image is required' 
      });
    }
    
    const slider = new Slider({
      title,
      subtitle,
      description,
      image,
      buttonText: buttonText || 'Explore Now',
      buttonLink,
      type: type || 'featured',
      isActive: isActive !== undefined ? isActive : true,
      order: order || 0,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      createdBy: req.user._id
    });
    
    await slider.save();
    
    res.status(201).json({ 
      success: true, 
      data: slider, 
      message: 'Slider created successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get all sliders (public)
exports.getSliders = async (req, res) => {
  try {
    const { type, isActive } = req.query;
    let filter = {};
    
    // Filter by type if provided
    if (type) {
      filter.type = type;
    }
    
    // Filter by active status if provided, otherwise show only active ones
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    } else {
      filter.isActive = true; // Default to show only active sliders
    }
    
    // Check for time-based filtering (show only current offers)
    const now = new Date();
    filter.$or = [
      { startDate: { $exists: false } }, // No start date
      { startDate: { $lte: now } } // Start date has passed
    ];
    
    filter.$and = [
      {
        $or: [
          { endDate: { $exists: false } }, // No end date
          { endDate: { $gte: now } } // End date hasn't passed
        ]
      }
    ];
    
    const sliders = await Slider.find(filter)
      .populate('createdBy', 'name email')
      .sort({ order: 1, createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: sliders, 
      message: `Found ${sliders.length} sliders` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get slider by ID
exports.getSliderById = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!slider) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        message: 'Slider not found' 
      });
    }
    
    res.json({ 
      success: true, 
      data: slider, 
      message: 'Slider found successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Update slider
exports.updateSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    
    if (!slider) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        message: 'Slider not found' 
      });
    }
    
    // Check if user is authorized to update (admin or creator)
    if (req.user.role !== 'admin' && slider.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        message: 'Not authorized to update this slider' 
      });
    }
    
    const updates = req.body;
    
    // Handle image update (supports both local disk and Cloudinary)
    if (req.file) {
      updates.image = req.file.path || `/uploads/${req.file.filename}`;
    }
    
    // Convert date strings to Date objects
    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }
    
    Object.assign(slider, updates);
    await slider.save();
    
    res.json({ 
      success: true, 
      data: slider, 
      message: 'Slider updated successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Delete slider
exports.deleteSlider = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    
    if (!slider) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        message: 'Slider not found' 
      });
    }
    
    // Check if user is authorized to delete (admin or creator)
    if (req.user.role !== 'admin' && slider.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        message: 'Not authorized to delete this slider' 
      });
    }
    
    await Slider.findByIdAndDelete(req.params.id);
    
    res.json({ 
      success: true, 
      data: null, 
      message: 'Slider deleted successfully' 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Get sliders by creator
exports.getMySliders = async (req, res) => {
  try {
    // Get all sliders since this is now a public endpoint
    const sliders = await Slider.find({})
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ 
      success: true, 
      data: sliders, 
      message: `Found ${sliders.length} sliders` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Toggle slider active status
exports.toggleSliderStatus = async (req, res) => {
  try {
    const slider = await Slider.findById(req.params.id);
    
    if (!slider) {
      return res.status(404).json({ 
        success: false, 
        data: null, 
        message: 'Slider not found' 
      });
    }
    
    // Check if user is authorized (admin or creator)
    if (req.user.role !== 'admin' && slider.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        message: 'Not authorized to update this slider' 
      });
    }
    
    slider.isActive = !slider.isActive;
    await slider.save();
    
    res.json({ 
      success: true, 
      data: slider, 
      message: `Slider ${slider.isActive ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};
