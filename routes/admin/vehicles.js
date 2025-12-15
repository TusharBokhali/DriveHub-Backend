const express = require('express');
const router = express.Router();
const { protect } = require('../../middlewares/auth');
const { requireRole } = require('../../middlewares/role');
const { validateVehicle, validatePublishVehicle, validateVehicleId } = require('../../middlewares/validation');
const upload = require('../../middlewares/upload');
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  publishVehicle
} = require('../../controllers/adminVehiclesController');

// All admin routes require authentication
// Note: Add requireRole('admin') if you have admin role in User model
router.use(protect);

// 🔹 1) GET ALL VEHICLES (ADMIN)
router.get('/', getAllVehicles);

// 🔹 2) GET SINGLE VEHICLE (ADMIN)
router.get('/:vehicleId', validateVehicleId, getVehicleById);

// 🔹 3) CREATE VEHICLE (ADMIN)
router.post('/', (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      console.error('=== MULTER UPLOAD ERROR ===');
      console.error('Error:', err);
      console.error('Error Code:', err.code);
      console.error('Error Field:', err.field);
      console.error('Error Message:', err.message);
      
      // Detailed error messages
      let errorMessage = 'File upload error';
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'File size too large. Maximum size is 10MB per file.';
      } else if (err.code === 'LIMIT_FILE_COUNT') {
        errorMessage = 'Too many files. Maximum 5 images allowed.';
      } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        errorMessage = 'Unexpected file field. Use "images" field for file uploads.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      return res.status(400).json({
        success: false,
        data: null,
        message: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { 
          error: err.code,
          details: err.message 
        })
      });
    }
    next();
  });
}, validateVehicle, createVehicle);

// 🔹 4) UPDATE VEHICLE (ADMIN EDIT)
router.put('/:vehicleId', validateVehicleId, (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        data: null,
        message: err.message || 'File upload error'
      });
    }
    next();
  });
}, updateVehicle);

// 🔹 5) DELETE VEHICLE (ADMIN) - SOFT DELETE
router.delete('/:vehicleId', validateVehicleId, deleteVehicle);

// 🔹 6) PUBLISH / UNPUBLISH VEHICLE
router.patch('/:vehicleId/publish', validateVehicleId, validatePublishVehicle, publishVehicle);

module.exports = router;

