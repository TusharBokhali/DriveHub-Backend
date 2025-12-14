const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

// 🔹 1) GET ALL VEHICLES (ADMIN)
// GET /api/admin/vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const { category, vehicleType, rentType, minPrice, maxPrice, q, driverRequired, isPublished } = req.query;
    
    // Admin filter: Only exclude deleted vehicles
    let filter = { isDeleted: false };
    
    // Apply filters if provided
    if (category) filter.category = category;
    if (vehicleType) filter.vehicleType = vehicleType; // rent, sell, service
    if (rentType) filter.rentType = rentType;
    if (driverRequired !== undefined) filter.driverRequired = driverRequired === 'true';
    if (isPublished !== undefined) filter.isPublished = isPublished === 'true';
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
    if (q) filter.$or = [{ title: { $regex: q, $options:'i' } }, { description: { $regex: q, $options:'i' } }];
    
    // Admin sees all vehicles (published + unpublished, but not deleted)
    const vehicles = await Vehicle.find(filter)
      .populate('owner', 'name email phone businessName')
      .sort({ createdAt: -1 });
    
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error'
    });
  }
};

// 🔹 2) GET SINGLE VEHICLE (ADMIN)
// GET /api/admin/vehicles/:vehicleId
exports.getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ 
      _id: req.params.vehicleId,
      isDeleted: false 
    })
      .populate('owner', 'name email phone businessName');
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Vehicle not found'
      });
    }
    
    // Populate ratings.user separately to ensure proper population
    if (vehicle.ratings && vehicle.ratings.length > 0) {
      await Vehicle.populate(vehicle, {
        path: 'ratings.user',
        select: 'name profileImage email'
      });
    }
    
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
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Server error'
    });
  }
};

// 🔹 3) CREATE VEHICLE (ADMIN)
// POST /api/admin/vehicles

// ⚠️ Helper function to map frontend labels to backend enum values
const mapFuelType = (value) => {
  if (!value) return 'petrol';
  const normalized = value.toLowerCase().trim();
  const mapping = {
    'petrol': 'petrol',
    'diesel': 'diesel',
    'cng': 'cng',
    'electric': 'electric',
    'hybrid': 'hybrid',
    'lpg': 'cng', // Map LPG to CNG (similar fuel type)
  };
  return mapping[normalized] || 'petrol';
};

const mapTransmission = (value) => {
  if (!value) return 'manual';
  const normalized = value.toLowerCase().trim();
  const mapping = {
    'manual': 'manual',
    'automatic': 'automatic',
    'semi-auto': 'semi-automatic',
    'semi-automatic': 'semi-automatic',
    'semiautomatic': 'semi-automatic',
    'cvt': 'automatic', // CVT is a type of automatic transmission
  };
  return mapping[normalized] || 'manual';
};

const mapRentType = (value) => {
  if (!value) return 'daily';
  const normalized = value.toLowerCase().trim();
  const mapping = {
    'hourly': 'hourly',
    'daily': 'daily',
    'per_km': 'per_km',
    'per km': 'per_km',
    'perkm': 'per_km',
    'fixed': 'fixed',
    'weekly': 'fixed', // Map weekly to fixed (can be customized later)
    'monthly': 'fixed', // Map monthly to fixed (can be customized later)
  };
  return mapping[normalized] || 'daily';
};

exports.createVehicle = async (req, res) => {
  try {
    const {
      title, description, category, vehicleType, rentType, price, location,
      hourlyPrice, dailyPrice, perKmPrice, driverRequired, driverPrice, driverAvailable, driverLabel,
      serviceCategory, serviceDescription, mileage, seats, transmission, fuelType, year, features,
      currency, owner, isPublished
    } = req.body || {};
    
    // ⚠️ CRITICAL: Convert string values to proper types (form-data sends everything as strings)
    const numPrice = price ? Number(price) : null;
    const numHourlyPrice = hourlyPrice ? Number(hourlyPrice) : null;
    const numDailyPrice = dailyPrice ? Number(dailyPrice) : null;
    const numPerKmPrice = perKmPrice ? Number(perKmPrice) : null;
    const numDriverPrice = driverPrice ? Number(driverPrice) : null;
    const numMileage = mileage ? Number(mileage) : 0;
    const numSeats = seats ? Number(seats) : 4;
    const numYear = year ? Number(year) : new Date().getFullYear();
    
    // Convert boolean strings to actual booleans
    const boolDriverRequired = driverRequired === 'true' || driverRequired === true;
    const boolDriverAvailable = driverAvailable === 'true' || driverAvailable === true;
    const boolIsPublished = isPublished === 'true' || isPublished === true;
    
    // Handle multiple image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      console.log(`✅ Received ${req.files.length} image file(s)`);
      images = req.files.map((file, index) => {
        console.log(`Image ${index + 1}:`, {
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          fieldname: file.fieldname
        });
        
        return {
          url: `/uploads/${file.filename}`,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size
        };
      });
    } else {
      console.log('⚠️ No image files received in req.files');
      console.log('Request body keys:', Object.keys(req.body));
      console.log('Request files:', req.files);
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
    
    // Build pricing options array from individual prices
    const currencySymbol = currency || '₹';
    const pricingOptions = [];
    
    if (numHourlyPrice) {
      pricingOptions.push({
        label: 'per hour',
        price: numHourlyPrice,
        currency_symbol: currencySymbol
      });
    }
    if (numDailyPrice) {
      pricingOptions.push({
        label: 'per day',
        price: numDailyPrice,
        currency_symbol: currencySymbol
      });
    }
    if (numPerKmPrice) {
      pricingOptions.push({
        label: 'per km',
        price: numPerKmPrice,
        currency_symbol: currencySymbol
      });
    }
    
    // Driver pricing as separate object (not in pricingOptions array)
    let driverPricingObj = undefined;
    if (boolDriverAvailable && numDriverPrice && numDriverPrice > 0) {
      driverPricingObj = {
        label: driverLabel || 'with driver',
        price: numDriverPrice,
        currency_symbol: currencySymbol
      };
    }
    
    // Determine owner - use provided owner ID or default to admin user
    let ownerId = owner;
    if (!ownerId && req.user) {
      ownerId = req.user._id;
    }
    if (!ownerId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Owner is required'
      });
    }
    
    // Verify owner exists
    const ownerUser = await User.findById(ownerId);
    if (!ownerUser) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Owner not found'
      });
    }
    
    // Validate required fields
    if (!title) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Title is required'
      });
    }
    if (!vehicleType) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Vehicle type is required'
      });
    }
    
    // ⚠️ Validate enum values
    const validVehicleTypes = ['sell', 'rent', 'service'];
    if (!validVehicleTypes.includes(vehicleType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid vehicle type. Must be one of: ${validVehicleTypes.join(', ')}`
      });
    }
    
    const validCategories = ['bike', 'car', 'auto', 'other'];
    if (category && !validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }
    
    const validRentTypes = ['hourly', 'daily', 'per_km', 'fixed'];
    if (vehicleType.toLowerCase() === 'rent' && rentType && !validRentTypes.includes(rentType.toLowerCase())) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid rent type. Must be one of: ${validRentTypes.join(', ')}`
      });
    }
    
    if (!numPrice || isNaN(numPrice)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Valid price is required'
      });
    }
    if (vehicleType.toLowerCase() === 'rent' && !rentType) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Rent type is required when vehicle type is rent'
      });
    }
    
    // Validate year (1900 to current year + 1)
    const currentYear = new Date().getFullYear();
    if (numYear && (numYear < 1900 || numYear > currentYear + 1)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: `Invalid year. Must be between 1900 and ${currentYear + 1}`
      });
    }
    
    // Normalize enum values - map frontend labels to backend enum values
    const normalizedCategory = category ? category.toLowerCase() : 'other';
    const normalizedVehicleType = vehicleType.toLowerCase();
    const normalizedRentType = rentType ? mapRentType(rentType) : undefined;
    const normalizedTransmission = mapTransmission(transmission);
    const normalizedFuelType = mapFuelType(fuelType);
    
    const vehicle = new Vehicle({
      owner: ownerId,
      title, 
      description, 
      category: normalizedCategory, 
      vehicleType: normalizedVehicleType, 
      rentType: normalizedRentType, 
      price: numPrice, 
      location,
      hourlyPrice: numHourlyPrice, 
      dailyPrice: numDailyPrice, 
      perKmPrice: numPerKmPrice, 
      driverRequired: boolDriverRequired, 
      driverPrice: numDriverPrice, 
      driverAvailable: boolDriverAvailable, 
      driverLabel,
      serviceCategory, 
      serviceDescription, 
      images,
      currency: currencySymbol,
      pricingOptions: pricingOptions.length > 0 ? pricingOptions : undefined,
      driverPricing: driverPricingObj,
      mileage: numMileage,
      seats: numSeats,
      transmission: normalizedTransmission,
      fuelType: normalizedFuelType,
      year: numYear,
      features: parsedFeatures,
      isPublished: boolIsPublished
    });
    
    await vehicle.save();
    
    // Populate owner before sending response
    await vehicle.populate('owner', 'name email phone businessName');
    
    res.status(201).json({
      success: true,
      data: vehicle,
      message: 'Vehicle created successfully'
    });
  } catch (err) {
    // ⚠️ Better error logging
    console.error('=== CREATE VEHICLE ERROR ===');
    console.error('Error:', err);
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    
    // Check for Multer errors (file upload errors)
    if (err.name === 'MulterError') {
      console.error('Multer Error Code:', err.code);
      console.error('Multer Error Field:', err.field);
      console.error('Multer Error Message:', err.message);
      
      let errorMessage = 'File upload error';
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'File size too large. Maximum size is 10MB per file.';
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        errorMessage = 'Too many files. Maximum 5 images allowed.';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        errorMessage = 'Unexpected file field. Use "images" field for file uploads.';
      } else {
        errorMessage = `File upload error: ${err.message}`;
      }
      
      return res.status(400).json({
        success: false,
        data: null,
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          error: err.code,
          field: err.field 
        })
      });
    }
    
    // Check for validation errors
    if (err.errors) {
      console.error('Validation Errors:', err.errors);
      const validationErrors = Object.keys(err.errors).map(key => ({
        field: key,
        message: err.errors[key].message
      }));
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    // Check for MongoDB duplicate key errors
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Duplicate entry. This vehicle already exists.'
      });
    }
    
    // Return detailed error message in development, generic in production
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? err.message || 'Server error'
      : 'Server error';
    
    res.status(500).json({
      success: false,
      data: null,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { 
        error: err.message, 
        stack: err.stack,
        name: err.name 
      })
    });
  }
};

// 🔹 4) UPDATE VEHICLE (ADMIN EDIT)
// PUT /api/admin/vehicles/:vehicleId
exports.updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ 
      _id: req.params.vehicleId,
      isDeleted: false 
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Vehicle not found'
      });
    }
    
    const updates = req.body;
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }));
    }
    
    // Set default currency if not provided
    const currencySymbol = updates.currency || vehicle.currency || '₹';
    if (updates.currency === undefined || updates.currency === null || updates.currency === '') {
      updates.currency = currencySymbol;
    }
    
    // Build pricing options array if any pricing fields are updated
    const { hourlyPrice, dailyPrice, perKmPrice, driverAvailable, driverPrice, driverLabel } = updates;
    if (hourlyPrice !== undefined || dailyPrice !== undefined || perKmPrice !== undefined ||
        driverAvailable !== undefined || driverPrice !== undefined || driverLabel !== undefined) {
      const pricingOptions = [];
      
      const finalHourlyPrice = hourlyPrice !== undefined ? hourlyPrice : vehicle.hourlyPrice;
      const finalDailyPrice = dailyPrice !== undefined ? dailyPrice : vehicle.dailyPrice;
      const finalPerKmPrice = perKmPrice !== undefined ? perKmPrice : vehicle.perKmPrice;
      const finalDriverAvailable = driverAvailable !== undefined ? driverAvailable : vehicle.driverAvailable;
      const finalDriverPrice = driverPrice !== undefined ? driverPrice : vehicle.driverPrice;
      const finalDriverLabel = driverLabel !== undefined ? driverLabel : vehicle.driverLabel;
      
      if (finalHourlyPrice) {
        pricingOptions.push({
          label: 'per hour',
          price: finalHourlyPrice,
          currency_symbol: currencySymbol
        });
      }
      if (finalDailyPrice) {
        pricingOptions.push({
          label: 'per day',
          price: finalDailyPrice,
          currency_symbol: currencySymbol
        });
      }
      if (finalPerKmPrice) {
        pricingOptions.push({
          label: 'per km',
          price: finalPerKmPrice,
          currency_symbol: currencySymbol
        });
      }
      
      updates.pricingOptions = pricingOptions.length > 0 ? pricingOptions : [];
    }
    
    // Handle driver pricing separately (not in pricingOptions array)
    if (driverAvailable !== undefined || driverPrice !== undefined || driverLabel !== undefined) {
      const finalDriverAvailable = driverAvailable !== undefined ? driverAvailable : vehicle.driverAvailable;
      const finalDriverPrice = driverPrice !== undefined ? driverPrice : vehicle.driverPrice;
      const finalDriverLabel = driverLabel !== undefined ? driverLabel : vehicle.driverLabel;
      
      if (finalDriverAvailable && finalDriverPrice && finalDriverPrice > 0) {
        updates.driverPricing = {
          label: finalDriverLabel || 'with driver',
          price: finalDriverPrice,
          currency_symbol: currencySymbol
        };
      } else {
        updates.driverPricing = undefined;
      }
    }
    
    // Parse features if provided
    if (updates.features !== undefined) {
      try {
        updates.features = typeof updates.features === 'string' ? JSON.parse(updates.features) : updates.features;
      } catch (e) {
        // Keep existing features if parsing fails
        delete updates.features;
      }
    }
    
    // Don't allow updating isDeleted through this endpoint (use DELETE endpoint)
    delete updates.isDeleted;
    
    Object.assign(vehicle, updates);
    await vehicle.save();
    
    // Populate owner before sending response
    await vehicle.populate('owner', 'name email phone businessName');
    
    res.json({
      success: true,
      data: vehicle,
      message: 'Vehicle updated successfully'
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

// 🔹 5) DELETE VEHICLE (ADMIN) - SOFT DELETE
// DELETE /api/admin/vehicles/:vehicleId
exports.deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ 
      _id: req.params.vehicleId,
      isDeleted: false 
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Vehicle not found'
      });
    }
    
    // Soft delete: Mark as deleted
    vehicle.isDeleted = true;
    await vehicle.save();
    
    res.json({
      success: true,
      data: null,
      message: 'Vehicle deleted successfully'
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

// 🔹 6) PUBLISH / UNPUBLISH VEHICLE
// PATCH /api/admin/vehicles/:vehicleId/publish
exports.publishVehicle = async (req, res) => {
  try {
    const { isPublished } = req.body;
    
    if (typeof isPublished !== 'boolean') {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'isPublished must be a boolean (true or false)'
      });
    }
    
    const vehicle = await Vehicle.findOne({ 
      _id: req.params.vehicleId,
      isDeleted: false 
    });
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'Vehicle not found'
      });
    }
    
    vehicle.isPublished = isPublished;
    await vehicle.save();
    
    res.json({
      success: true,
      data: vehicle,
      message: `Vehicle ${isPublished ? 'published' : 'unpublished'} successfully`
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

