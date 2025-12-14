const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { validateVehicle, validateFavoriteCategoryBody, validateFavoriteCategoryParam } = require('../middlewares/validation');
const multer = require('multer');
const path = require('path');
const { 
  createVehicle, getVehicles, getVehicleById, rateVehicle, 
  updateVehicle, deleteVehicle, getMyVehicles, setFavoriteCategory, getMyFavoriteCategories, removeFavoriteCategory, getMyFavoriteCars, addFavoriteCar, removeFavoriteCar 
} = require('../controllers/vehiclesController');

// multer local storage with enhanced configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept all image types
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Maximum 5 files
  }
});

// Public routes - No authentication required
router.get('/', getVehicles);
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    data: { message: "This is a public test endpoint" }, 
    message: 'Test endpoint working' 
  });
});

// DISABLED: Vehicle creation moved to /api/admin/vehicles
// router.post('/', protect, requireRole('client'), ...);
router.post('/', (req, res) => {
  res.status(403).json({
    success: false,
    data: null,
    message: 'Vehicle creation is disabled. Please use /api/admin/vehicles'
  });
});

// Public routes - No authentication required
router.get('/my/vehicles', getMyVehicles);

// Favorite categories (protected; use logged-in user's id)
router.post('/favorites/category', protect, validateFavoriteCategoryBody, setFavoriteCategory);
router.get('/favorites/categories', protect, getMyFavoriteCategories);
router.delete('/favorites/category/:categoryId', protect, require('../middlewares/validation').validateFavoriteCategoryParam, removeFavoriteCategory);

// Favorite cars (protected; only token and item id validations)
router.get('/favorites', protect, getMyFavoriteCars);
router.post('/favorites', protect, addFavoriteCar);
router.delete('/favorites/:carId', protect, removeFavoriteCar);

router.get('/:id', getVehicleById);

// DISABLED: Vehicle update moved to /api/admin/vehicles
// router.put('/:id', protect, requireRole('client'), ...);
router.put('/:id', (req, res) => {
  res.status(403).json({
    success: false,
    data: null,
    message: 'Vehicle update is disabled. Please use /api/admin/vehicles/:id'
  });
});

// DISABLED: Vehicle delete moved to /api/admin/vehicles
// router.delete('/:id', protect, requireRole('client'), deleteVehicle);
router.delete('/:id', (req, res) => {
  res.status(403).json({
    success: false,
    data: null,
    message: 'Vehicle deletion is disabled. Please use /api/admin/vehicles/:id'
  });
});
router.post('/:id/rate', protect, rateVehicle);

module.exports = router;
