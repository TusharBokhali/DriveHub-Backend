const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validation');
const upload = require('../middlewares/upload');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists to avoid ENOENT errors during file save
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', protect, getProfile);

// Update profile with proper error handling for file uploads
router.put('/profile', protect, (req, res, next) => {
  upload.single('profileImage')(req, res, (err) => {
    if (err) {
      console.error('Profile image upload error:', err);
      let errorMessage = 'File upload failed';
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        errorMessage = 'Profile image is too large. Maximum size is 10MB.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      return res.status(400).json({
        success: false,
        data: null,
        message: errorMessage
      });
    }
    next();
  });
}, updateProfile);

module.exports = router;
