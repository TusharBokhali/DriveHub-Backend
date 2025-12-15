const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const { validateRequest } = require('../middlewares/validation');
const { body } = require('express-validator');
const upload = require('../middlewares/upload');
const { 
  createSlider, getSliders, getSliderById, updateSlider, 
  deleteSlider, getMySliders, toggleSliderStatus 
} = require('../controllers/sliderController');

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
