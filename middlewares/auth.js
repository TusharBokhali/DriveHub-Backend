const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Default JWT secret if not in .env
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_jwt_secret_key_here_make_it_long_and_random_12345';

// 🔹 Middleware 1: Token Verification
exports.protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Authorization header missing',
      });
    }

    if (!header.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Invalid authorization format. Use: Bearer <token>',
      });
    }

    const token = header.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Token not provided',
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      console.log('JWT Error:', jwtError.message);
      return res.status(401).json({
        success: false,
        data: null,
        message: 'Token invalid or expired',
      });
    }

    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        message: 'User not found',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Authentication error',
    });
  }
};

// 🔹 Middleware 2: Role Check (Client only)
exports.verifyClient = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      data: null,
      message: 'User not authenticated',
    });
  }

  if (req.user.role !== 'client') {
    return res.status(403).json({
      success: false,
      data: null,
      message: 'Forbidden: client role required',
    });
  }

  next();
};
