const { body, validationResult, query } = require('express-validator');
const { param } = require('express-validator');

// Validation middleware
exports.validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Debug logging to help identify issues
    console.log('Validation failed - Request body:', JSON.stringify(req.body));
    console.log('Validation errors:', JSON.stringify(errors.array(), null, 2));
    return res.status(400).json({ 
      success: false,
      data: null,
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  next();
};

// Auth validation rules
exports.validateRegister = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters long')
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('address')
    .optional()
    .isString()
    .withMessage('Address must be a string')
    .trim(),
  // Make phone completely optional
  body('phone')
    .optional()
    .isString()
    .withMessage('Phone must be a string')
    .trim(),
  // preferredLanguage should be optional (as per requirement) but validated if sent
  body('preferredLanguage')
    .optional()
    .isIn(['hindi', 'english', 'hinglish'])
    .withMessage('preferredLanguage must be one of: hindi, english, hinglish'),
  // Role validation
  body('role')
    .optional()
    .isIn(['user', 'client', 'admin'])
    .withMessage('Role must be either "user", "client", or "admin"'),
  // Business fields - optional but validated if sent
  body('businessName')
    .optional()
    .isString()
    .withMessage('businessName must be a string')
    .trim(),
  body('businessAddress')
    .optional()
    .isString()
    .withMessage('businessAddress must be a string')
    .trim(),
  body('businessPhone')
    .optional()
    .isString()
    .withMessage('businessPhone must be a string')
    .trim(),
  // Custom validation: if role is 'client', businessName is required
  body('businessName')
    .custom((value, { req }) => {
      if (req.body.role === 'client' && !value) {
        throw new Error('businessName is required when role is "client"');
      }
      return true;
    }),
  exports.validateRequest
];

exports.validateLogin = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  exports.validateRequest
];

// Vehicle validation rules
exports.validateVehicle = [
  body('title').notEmpty().withMessage('Title is required'),
  body('rentType').isIn(['hourly', 'daily', 'per_km', 'fixed']).withMessage('Invalid rent type'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('mileage').optional().isNumeric().withMessage('Mileage must be a number'),
  body('seats').optional().isInt({ min: 1, max: 50 }).withMessage('Seats must be between 1 and 50'),
  body('transmission').optional().isIn(['manual', 'automatic', 'semi-automatic']).withMessage('Invalid transmission type'),
  body('fuelType').optional().isIn(['petrol', 'diesel', 'electric', 'hybrid', 'cng']).withMessage('Invalid fuel type'),
  body('year').optional().isInt({ min: 1900, max: new Date().getFullYear() + 1 }).withMessage('Invalid year'),
  exports.validateRequest
];

// Booking validation rules
exports.validateBooking = [
  body('vehicleId').isMongoId().withMessage('Valid vehicle ID is required'),
  body('startAt').isISO8601().withMessage('Valid start date is required'),
  body('endAt').isISO8601().withMessage('Valid end date is required'),
  exports.validateRequest
];

// Booking Flow validation rules
exports.validateBookingFlow = [
  body('phone')
    .notEmpty()
    .withMessage('Phone is required')
    .isString()
    .withMessage('Phone must be a string')
    .trim(),
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('vehicleId')
    .notEmpty()
    .withMessage('Vehicle ID is required')
    .isMongoId()
    .withMessage('Valid vehicle ID is required'),
  body('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['online', 'pay_to_driver'])
    .withMessage('Payment method must be either "online" or "pay_to_driver"'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim(),
  exports.validateRequest
];

// Favorite Categories validation rules
const allowedCategories = ['bike','car','auto','other'];

// No token required flows for favorites: validate userId where needed
exports.normalizeUserIdToQuery = (req, res, next) => {
  if (!req.query) req.query = {};

  // If not present, try from body (supports userId and userid)
  if (!req.query.userId && req && req.body && typeof req.body === 'object') {
    if (req.body.userId) req.query.userId = req.body.userId;
    else if (req.body.userid) req.query.userId = req.body.userid;
  }

  // If not present, alias from query `userid`
  if (!req.query.userId && req.query.userid) {
    req.query.userId = req.query.userid;
  }

  // If still not present, and user is authenticated, use token user id (optional)
  if (!req.query.userId && req.user && req.user._id) {
    req.query.userId = req.user._id.toString();
  }
  next();
};

// Normalize userId in body: supports `userid` alias and optional token user
exports.normalizeUserIdInBody = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object') {
    return next();
  }
  if (!req.body.userId) {
    if (req.body.userid) req.body.userId = req.body.userid;
    else if (req.user && req.user._id) req.body.userId = req.user._id.toString();
  }
  next();
};

exports.validateFavoriteCategoryBody = [
  body('categoryId')
    .notEmpty().withMessage('categoryId is required')
    .isString().withMessage('categoryId must be a string')
    .isIn(allowedCategories).withMessage(`categoryId must be one of: ${allowedCategories.join(', ')}`),
  exports.validateRequest
];

exports.validateFavoriteCategoryParam = [
  (req, res, next) => {
    const { categoryId } = req.params || {};
    if(!categoryId) {
      return res.status(400).json({ success:false, data:null, message:'categoryId is required' });
    }
    if(typeof categoryId !== 'string' || !allowedCategories.includes(categoryId)) {
      return res.status(400).json({ success:false, data:null, message:`categoryId must be one of: ${allowedCategories.join(', ')}` });
    }
    next();
  }
];

exports.validateFavoriteCategoryGet = [
  exports.validateRequest
];

// Item favorites (by ObjectId)
exports.validateFavoriteItemBody = [
  body('itemId')
    .notEmpty().withMessage('itemId is required')
    .isMongoId().withMessage('itemId must be a valid ObjectId'),
  exports.validateRequest
];

// New: Car favorites unified validators
exports.validateFavoriteAddBody = [
  body('carId')
    .notEmpty().withMessage('carId is required')
    .isMongoId().withMessage('carId must be a valid ObjectId'),
  exports.validateRequest
];

exports.validateFavoriteCarParam = [
  param('carId')
    .notEmpty().withMessage('carId is required')
    .isMongoId().withMessage('carId must be a valid ObjectId'),
  exports.validateRequest
];

// Admin vehicle publish validation
exports.validatePublishVehicle = [
  body('isPublished')
    .notEmpty().withMessage('isPublished is required')
    .isBoolean().withMessage('isPublished must be a boolean (true or false)'),
  exports.validateRequest
];

// Vehicle ID parameter validation
exports.validateVehicleId = [
  param('vehicleId')
    .notEmpty().withMessage('Vehicle ID is required')
    .isMongoId().withMessage('Invalid vehicle ID format'),
  exports.validateRequest
];