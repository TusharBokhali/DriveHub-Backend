const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { validateRequest } = require('../middlewares/validation');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { 
  createSlider, getSliders, getSliderById, updateSlider, 
  deleteSlider, getMySliders, toggleSliderStatus 
} = require('../controllers/sliderController');

// Multer configuration for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Validation rules for slider
const validateSlider = [
  body('title').notEmpty().withMessage('Title is required'),
  body('subtitle').notEmpty().withMessage('Subtitle is required'),
  body('type').optional().isIn(['latest', 'offer', 'featured', 'promotion']).withMessage('Invalid slider type'),
  body('order').optional().isNumeric().withMessage('Order must be a number'),
  body('startDate').optional().isISO8601().withMessage('Invalid start date format'),
  body('endDate').optional().isISO8601().withMessage('Invalid end date format'),
  validateRequest
];

// Public routes
router.get('/', getSliders);
router.get('/:id', getSliderById);

// Protected routes - require authentication
router.post('/', protect, requireRole('client'), upload.single('image'), validateSlider, createSlider);

// Public routes - No authentication required
router.get('/my/sliders', getMySliders);
router.put('/:id', protect, requireRole('client'), upload.single('image'), updateSlider);
router.delete('/:id', protect, requireRole('client'), deleteSlider);
router.patch('/:id/toggle', protect, requireRole('client'), toggleSliderStatus);

module.exports = router;
