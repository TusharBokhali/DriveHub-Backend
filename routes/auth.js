const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middlewares/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists to avoid ENOENT errors during file save
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch (_) {}
}

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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    // Accept images only
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'profileImage'));
    }
    cb(null, true);
  }
});

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);

module.exports = router;
