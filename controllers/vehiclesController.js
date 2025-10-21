const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

exports.createVehicle = async (req,res) => {
  try {
    const { 
      title, description, category, vehicleType, rentType, price, location,
      hourlyPrice, dailyPrice, perKmPrice, driverRequired, driverPrice, driverAvailable,
      serviceCategory, serviceDescription, mileage, seats, transmission, fuelType, year, features
    } = req.body || {};
    
    // Handle multiple image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
    }
    
    // Parse features if it's a string
    let parsedFeatures = [];
    if (features) {
      try {
        parsedFeatures = typeof features === 'string' ? JSON.parse(features) : features;
      } catch (e) {
        parsedFeatures = [];
      }
    }
    
    const vehicle = new Vehicle({
      owner: req.user._id,
      title, description, category, vehicleType, rentType, price, location,
      hourlyPrice, dailyPrice, perKmPrice, driverRequired, driverPrice, driverAvailable,
      serviceCategory, serviceDescription, images,
      mileage: mileage || 0,
      seats: seats || 4,
      transmission: transmission || 'manual',
      fuelType: fuelType || 'petrol',
      year: year || new Date().getFullYear(),
      features: parsedFeatures
    });
    
    await vehicle.save();
    res.status(201).json({ 
      success: true, 
      data: vehicle, 
      message: 'Vehicle created successfully' 
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

exports.getVehicles = async (req,res) => {
  try {
    const { category, vehicleType, rentType, minPrice, maxPrice, q, driverRequired } = req.query;
    let filter = {};
    if(category) filter.category = category;
    if(vehicleType) filter.vehicleType = vehicleType;
    if(rentType) filter.rentType = rentType;
    if(driverRequired !== undefined) filter.driverRequired = driverRequired === 'true';
    if(minPrice || maxPrice) filter.price = {};
    if(minPrice) filter.price.$gte = Number(minPrice);
    if(maxPrice) filter.price.$lte = Number(maxPrice);
    if(q) filter.$or = [{ title: { $regex: q, $options:'i' } }, { description: { $regex: q, $options:'i' } }];

    const vehicles = await Vehicle.find(filter).populate('owner', 'name email phone').sort({ createdAt: -1 });
    
    // Add title to owner data based on vehicleType
    const vehiclesWithOwnerTitle = vehicles.map(vehicle => {
      const vehicleObj = vehicle.toObject();
      if (vehicleObj.owner) {
        vehicleObj.owner.title = vehicleObj.vehicleType === 'sell' ? 'Vehicle for Sale' : 
                                vehicleObj.vehicleType === 'rent' ? 'Vehicle for Rent' : 
                                vehicleObj.vehicleType === 'service' ? 'Vehicle Service' : 'Vehicle Owner';
      }
      return vehicleObj;
    });
    res.json({ 
      success: true, 
      data: vehiclesWithOwnerTitle, 
      message: `Found ${vehiclesWithOwnerTitle.length} vehicles` 
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

exports.getVehicleById = async (req,res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('owner','name email phone businessName')
      .populate('ratings.user', 'name');
    if(!vehicle) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Vehicle not found' 
    });
    
    // Add title to owner data based on vehicleType
    const vehicleObj = vehicle.toObject();
    if (vehicleObj.owner) {
      vehicleObj.owner.title = vehicleObj.vehicleType === 'sell' ? 'Vehicle for Sale' : 
                              vehicleObj.vehicleType === 'rent' ? 'Vehicle for Rent' : 
                              vehicleObj.vehicleType === 'service' ? 'Vehicle Service' : 'Vehicle Owner';
    }
    
    res.json({ 
      success: true, 
      data: vehicleObj, 
      message: 'Vehicle found successfully' 
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

// Rate a vehicle
exports.rateVehicle = async (req,res) => {
  try {
    const { rating, review } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);
    
    if(!vehicle) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Vehicle not found' 
    });

    // Check if user already rated this vehicle
    const existingRating = vehicle.ratings.find(r => r.user.toString() === req.user._id.toString());
    if(existingRating) {
      existingRating.rating = rating;
      existingRating.review = review;
    } else {
      vehicle.ratings.push({
        user: req.user._id,
        rating,
        review
      });
    }

    vehicle.calculateAverageRating();
    await vehicle.save();

    res.json({ 
      success: true, 
      data: vehicle, 
      message: 'Rating submitted successfully' 
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

// Update vehicle (only owner)
exports.updateVehicle = async (req,res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if(!vehicle) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Vehicle not found' 
    });

    if(vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        message: 'Not authorized to update this vehicle' 
      });
    }

    const updates = req.body;
    if(req.files && req.files.length > 0) {
      updates.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
    }

    Object.assign(vehicle, updates);
    await vehicle.save();

    res.json({ 
      success: true, 
      data: vehicle, 
      message: 'Vehicle updated successfully' 
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

// Delete vehicle (only owner)
exports.deleteVehicle = async (req,res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if(!vehicle) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'Vehicle not found' 
    });

    if(vehicle.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        success: false, 
        data: null, 
        message: 'Not authorized to delete this vehicle' 
      });
    }

    await Vehicle.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      data: null, 
      message: 'Vehicle deleted successfully' 
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

// Get vehicles by owner
exports.getMyVehicles = async (req,res) => {
  try {
    // Get all vehicles since this is now a public endpoint
    const vehicles = await Vehicle.find({}).populate('owner', 'name email phone').sort({ createdAt: -1 });
    
    // Add title to owner data based on vehicleType
    const vehiclesWithOwnerTitle = vehicles.map(vehicle => {
      const vehicleObj = vehicle.toObject();
      if (vehicleObj.owner) {
        vehicleObj.owner.title = vehicleObj.vehicleType === 'sell' ? 'Vehicle for Sale' : 
                                vehicleObj.vehicleType === 'rent' ? 'Vehicle for Rent' : 
                                vehicleObj.vehicleType === 'service' ? 'Vehicle Service' : 'Vehicle Owner';
      }
      return vehicleObj;
    });
    
    res.json({ 
      success: true, 
      data: vehiclesWithOwnerTitle, 
      message: `Found ${vehiclesWithOwnerTitle.length} vehicles` 
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

// Set favorite category for current user (toggle add/remove)
exports.setFavoriteCategory = async (req,res) => {
  try {
    const { categoryId } = req.body;
    const userId = req.user && req.user._id;
    if(!categoryId) return res.status(400).json({ success:false, data:null, message:'categoryId is required' });

    const user = await User.findById(userId);
    if(!user) return res.status(404).json({ success:false, data:null, message:'User not found' });

    const exists = user.favoriteCategories.includes(categoryId);
    if(exists) {
      user.favoriteCategories = user.favoriteCategories.filter(c => c !== categoryId);
    } else {
      user.favoriteCategories.push(categoryId);
    }
    await user.save();

    res.json({ success:true, data:{ favoriteCategories: user.favoriteCategories, added: !exists }, message: exists ? 'Removed from favorites' : 'Added to favorites' });
  } catch(err){
    console.error(err);
    res.status(500).json({ success:false, data:null, message:'Server error' });
  }
};

// Get my favorite categories and vehicles under them
exports.getMyFavoriteCategories = async (req,res) => {
  try {
    const userId = req.user && req.user._id;
    const user = await User.findById(userId).select('favoriteCategories');
    if(!user) return res.status(404).json({ success:false, data:null, message:'User not found' });

    const categories = user.favoriteCategories || [];
    // Also return vehicles grouped by category
    const vehicles = await Vehicle.find({ category: { $in: categories } }).sort({ createdAt: -1 });

    const grouped = categories.map(cat => ({
      category: cat,
      vehicles: vehicles.filter(v => v.category === cat)
    }));

    res.json({ success:true, data:{ categories, grouped }, message:`Found ${categories.length} favorite categories` });
  } catch(err){
    console.error(err);
    res.status(500).json({ success:false, data:null, message:'Server error' });
  }
};

// Remove a favorite category explicitly
exports.removeFavoriteCategory = async (req,res) => {
  try {
    const { categoryId } = req.params;
    const userId = req.user && req.user._id;
    if(!categoryId) return res.status(400).json({ success:false, data:null, message:'categoryId is required' });

    const user = await User.findById(userId);
    if(!user) return res.status(404).json({ success:false, data:null, message:'User not found' });

    const before = user.favoriteCategories.length;
    user.favoriteCategories = user.favoriteCategories.filter(c => c !== categoryId);
    const removed = user.favoriteCategories.length < before;
    await user.save();

    res.json({ success:true, data:{ favoriteCategories: user.favoriteCategories, removed }, message: removed ? 'Removed from favorites' : 'Category not in favorites' });
  } catch(err){
    console.error(err);
    res.status(500).json({ success:false, data:null, message:'Server error' });
  }
};

// Favorites (car) - clean routes: GET, POST, DELETE
exports.getMyFavoriteCars = async (req,res) => {
  try {
    const userId = req.user && req.user._id;
    if(!userId) {
      return res.status(401).json({ success:false, data:null, message:'Unauthorized' });
    }

    const user = await User.findById(userId).select('favoriteItems');
    if(!user) return res.status(404).json({ success:false, data:null, message:'User not found' });

    const favoriteIds = Array.isArray(user.favoriteItems) ? user.favoriteItems : [];
    if (favoriteIds.length === 0) {
      return res.json({ success:true, data:{ cars: [], ids: [] }, message:'Found 0 favorite cars' });
    }

    const cars = await Vehicle.find({ _id: { $in: favoriteIds } })
      .populate('owner', 'name email phone businessName businessAddress businessPhone')
      .populate('ratings.user', 'name')
      .sort({ createdAt: -1 });

    return res.json({ success:true, data:{ cars, ids: favoriteIds }, message:`Found ${cars.length} favorite cars` });
  } catch(err){
    console.error(err);
    return res.status(500).json({ success:false, data:null, message:'Server error' });
  }
};

exports.addFavoriteCar = async (req,res) => {
  try {
    const userId = req.user && req.user._id;
    if(!userId) {
      return res.status(401).json({ success:false, data:null, message:'Unauthorized' });
    }

    const { carId } = req.body || {};
    if(!carId) {
      return res.status(400).json({ success:false, data:null, message:'carId is required in request body' });
    }

    const car = await Vehicle.findById(carId).select('_id');
    if(!car) return res.status(404).json({ success:false, data:null, message:'Car not found' });

    const user = await User.findById(userId).select('favoriteItems');
    if(!user) return res.status(404).json({ success:false, data:null, message:'User not found' });

    const favoriteItems = Array.isArray(user.favoriteItems) ? user.favoriteItems : [];
    const exists = favoriteItems.some(id => id.toString() === carId.toString());
    if(exists) return res.status(200).json({ success:true, data:{ ids: favoriteItems }, message:'Car already in favorites' });

    user.favoriteItems.push(carId);
    await user.save();

    return res.status(201).json({ success:true, data:{ ids: user.favoriteItems }, message:'Car added to favorites' });
  } catch(err){
    console.error(err);
    return res.status(500).json({ success:false, data:null, message:'Server error' });
  }
};

exports.removeFavoriteCar = async (req,res) => {
  try {
    const userId = req.user && req.user._id;
    const { carId } = req.params;

    const user = await User.findById(userId).select('favoriteItems');
    if(!user) return res.status(404).json({ success:false, data:null, message:'User not found' });

    const before = user.favoriteItems.length;
    user.favoriteItems = user.favoriteItems.filter(id => id.toString() !== carId.toString());
    const removed = user.favoriteItems.length < before;
    await user.save();

    if(!removed) return res.status(404).json({ success:false, data:{ ids: user.favoriteItems }, message:'Car not in favorites' });
    return res.json({ success:true, data:{ ids: user.favoriteItems }, message:'Car removed from favorites' });
  } catch(err){
    console.error(err);
    return res.status(500).json({ success:false, data:null, message:'Server error' });
  }
};
