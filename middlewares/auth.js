const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Set default JWT secret if not provided
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_jwt_secret_key_here_make_it_long_and_random_12345';

exports.protect = async (req,res,next) => {
  try {
    const header = req.headers.authorization;
    
    // Check if authorization header exists
    if(!header) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        message: 'Authorization header missing' 
      });
    }

    // Check if header starts with 'Bearer '
    if(!header.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        message: 'Invalid authorization format. Use: Bearer <token>' 
      });
    }

    // Extract token
    const token = header.split(' ')[1];
    
    // Check if token exists
    if(!token) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        message: 'Token not provided' 
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      console.log('JWT Error:', jwtError.message);
      return res.status(401).json({ 
        success: false, 
        data: null, 
        message: 'Token invalid or expired' 
      });
    }

    // Check if user exists
    const user = await User.findById(decoded.id).select('-password');
    if(!user) {
      return res.status(401).json({ 
        success: false, 
        data: null, 
        message: 'User not found' 
      });
    }

    // Add user to request object
    req.user = user;
    next();
    
  } catch(error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Authentication error' 
    });
  }
};
