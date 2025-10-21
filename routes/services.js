const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { requireRole } = require('../middlewares/role');
const multer = require('multer');
const path = require('path');
const { 
  createServiceRequest, getServiceRequests, getMyServiceRequests, 
  getServiceRequestById, acceptServiceRequest, updateServiceStatus, 
  getAssignedServiceRequests 
} = require('../controllers/serviceController');

// multer for service images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});
const upload = multer({ storage });

// Public routes - No authentication required
router.get('/', getServiceRequests);

// User routes - Authentication required
router.post('/', protect, upload.array('images', 5), createServiceRequest);

// Public routes - No authentication required
router.get('/my', getMyServiceRequests);
router.get('/assigned/me', getAssignedServiceRequests);

// Client routes - Only authenticated clients can access
router.post('/:id/accept', protect, requireRole('client'), acceptServiceRequest);

// Public routes - No authentication required (must come after specific routes)
router.get('/:id', getServiceRequestById);

// User routes - Authentication required
router.put('/:id/status', protect, updateServiceStatus);

module.exports = router;
