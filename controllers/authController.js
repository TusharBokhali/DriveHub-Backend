const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Set default JWT secret if not provided
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_jwt_secret_key_here_make_it_long_and_random_12345';

const createToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

exports.register = async (req,res) => {
  try {
    const { name, email, password, address } = req.body || {};
    if(!name || !email || !password) return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'All fields required' 
    });

    let user = await User.findOne({ email });
    if(user) return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Email already registered' 
    });

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashed, role: 'user' });
    if (address) {
      user.address = address;
    }
    await user.save();

    const token = createToken(user);
    res.status(201).json({ 
      success: true, 
      data: { 
        token, 
        user: { id:user._id, name:user.name, email:user.email, role:user.role, address:user.address } 
      }, 
      message: 'User registered successfully' 
    });
  } catch(err) {
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

exports.login = async (req,res) => {
  try {
    const { email, password } = req.body || {};
    
    // Check if email and password are provided
    if(!email || !password) return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Email and password are required' 
    });

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'Please provide a valid email address' 
      });
    }

    // Check if password meets minimum requirements
    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'Password must be at least 6 characters long' 
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if(!user) return res.status(401).json({ 
      success: false, 
      data: null, 
      message: 'No account found with this email address' 
    });

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch) return res.status(401).json({ 
      success: false, 
      data: null, 
      message: 'Incorrect password. Please try again' 
    });

    // Generate token and return success response
    const token = createToken(user);
    res.json({ 
      success: true, 
      data: { 
        token, 
        user: { 
          id:user._id, 
          name:user.name, 
          email:user.email, 
          role:user.role,
          phone:user.phone,
          address:user.address,
          profileImage:user.profileImage || null,
          businessName:user.businessName,
          businessAddress:user.businessAddress,
          businessPhone:user.businessPhone,
          preferredLanguage:user.preferredLanguage
        } 
      }, 
      message: 'Login successful' 
    });
  } catch(err){
    console.error('Login error:', err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error occurred during login' 
    });
  }
};

// Get user profile
exports.getProfile = async (req,res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ 
      success: true, 
      data: user, 
      message: 'Profile retrieved successfully' 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};

// Update user profile
exports.updateProfile = async (req,res) => {
  try {
    const { name, email, phone, address, businessName, businessAddress, businessPhone, preferredLanguage } = req.body;
    const user = await User.findById(req.user._id);
    
    if(!user) return res.status(404).json({ 
      success: false, 
      data: null, 
      message: 'User not found' 
    });

    // Check if email is being updated and if it's already taken
    if(email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if(existingUser) {
        return res.status(400).json({ 
          success: false, 
          data: null, 
          message: 'Email already exists. Please use a different email.' 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          data: null, 
          message: 'Please provide a valid email address' 
        });
      }
    }

    // Update fields
    if(name) user.name = name;
    if(email) user.email = email;
    if(phone) user.phone = phone;
    if(address) user.address = address;
    if(businessName) user.businessName = businessName;
    if(businessAddress) user.businessAddress = businessAddress;
    if(businessPhone) user.businessPhone = businessPhone;
    if(preferredLanguage) user.preferredLanguage = preferredLanguage;
    
    // Handle profile image upload
    if(req.file) {
      user.profileImage = `/uploads/${req.file.filename}`;
    }

    await user.save();
    
    // Generate new token for updated user
    const token = createToken(user);
    
    res.json({ 
      success: true, 
      data: { 
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || null,
          address: user.address || null,
          profileImage: user.profileImage || null,
          businessName: user.businessName || null,
          businessAddress: user.businessAddress || null,
          businessPhone: user.businessPhone || null,
          preferredLanguage: user.preferredLanguage || null
        }
      }, 
      message: 'Profile updated successfully' 
    });
  } catch(err){
    console.error(err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error' 
    });
  }
};
