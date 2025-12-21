const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { createAndSendNotification } = require('./notificationController');

// Set default JWT secret if not provided
const JWT_SECRET = process.env.JWT_SECRET || 'your_default_jwt_secret_key_here_make_it_long_and_random_12345';

const createToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
};

// Helper function to validate and normalize profile image URL
const validateProfileImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  
  // Cloudinary URLs are permanent and safe
  if (imageUrl.startsWith('https://res.cloudinary.com')) {
    return imageUrl;
  }
  
  // HTTP Cloudinary URLs - convert to HTTPS for security
  if (imageUrl.startsWith('http://res.cloudinary.com')) {
    return imageUrl.replace('http://', 'https://');
  }
  
  // Local storage paths - verify file exists
  if (imageUrl.startsWith('/uploads/')) {
    const filename = imageUrl.replace('/uploads/', '');
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    if (fs.existsSync(filePath)) {
      return imageUrl;
    }
    // File doesn't exist - return null (don't break frontend)
    console.warn('Profile image file not found:', filePath);
    return null;
  }
  
  // Other URLs (external) - allow but log
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  return null;
};

// Helper function to get profile image URL
const getProfileImageUrl = (profileImage) => {
  if (!profileImage) return null;
  
  // If it's already a full URL (Cloudinary), return as is
  if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) {
    return profileImage;
  }
  
  // If it's a local path, ensure it starts with /uploads/
  if (profileImage.startsWith('/uploads/')) {
    // Check if file exists
    const filePath = path.join(__dirname, '..', profileImage);
    if (fs.existsSync(filePath)) {
      return profileImage;
    }
    // File doesn't exist, return null
    return null;
  }
  
  // If it's just a filename, prepend /uploads/
  if (!profileImage.startsWith('/')) {
    const filePath = path.join(__dirname, '..', 'uploads', profileImage);
    if (fs.existsSync(filePath)) {
      return `/uploads/${profileImage}`;
    }
    return null;
  }
  
  return profileImage;
};

exports.register = async (req,res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      address, 
      phone, 
      role, 
      preferredLanguage,
      businessName,
      businessAddress,
      businessPhone
    } = req.body || {};

    // Basic safety check – detailed checks are already done in validateRegister
    if(!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'All fields required' 
      });
    }

    // Only allow known roles, default to 'user'
    const finalRole = (role === 'client' || role === 'user') ? role : 'user';

    // If role is 'client', businessName is required
    if (finalRole === 'client' && !businessName) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'businessName is required for client role' 
      });
    }

    let user = await User.findOne({ email });
    if(user) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: 'Email already registered' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashed,
      role: finalRole,
      address: address || undefined,
      phone: phone || undefined,
      preferredLanguage: preferredLanguage || undefined,
      // Business fields (required for client role)
      businessName: businessName || undefined,
      businessAddress: businessAddress || undefined,
      businessPhone: businessPhone || undefined
    });

    await user.save();

    const token = createToken(user);
    
    // Send welcome notification after successful registration
    try {
      const welcomeMessage = user.role === 'admin'
        ? `Welcome to DriveHub, ${user.name}! Your admin account has been created successfully.`
        : user.role === 'client'
        ? `Welcome to DriveHub, ${user.name}! Start listing your vehicles and grow your business.`
        : `Welcome to DriveHub, ${user.name}! Your account has been created. Explore our vehicles and book your ride.`;
      
      await createAndSendNotification(
        user._id,
        'system',
        'Welcome to DriveHub! 🎉',
        welcomeMessage,
        {
          action: 'user_registered',
          registrationTime: new Date().toISOString(),
          userRole: user.role
        },
        null
      );
      console.log(`✅ Welcome notification sent to new user ${user.email} (${user._id})`);
    } catch (notifError) {
      console.error(`❌ Error sending welcome notification to new user ${user.email}:`, notifError);
      // Don't fail registration if notification fails
    }
    
    res.status(201).json({ 
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
          preferredLanguage: user.preferredLanguage || null,
          businessName: user.businessName || null,
          businessAddress: user.businessAddress || null,
          businessPhone: user.businessPhone || null
        } 
      }, 
      message: 'User registered successfully' 
    });
  } catch(err) {
    console.error('Register error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      code: err.code
    });
    
    // More detailed error response
    let errorMessage = 'Server error';
    if (err.name === 'ValidationError') {
      errorMessage = 'Validation error: ' + Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.code === 11000) {
      errorMessage = 'Email already registered';
    }
    
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
    if (!user._id) {
      console.error('Login error: User ID is missing');
      return res.status(500).json({ 
        success: false, 
        data: null, 
        message: 'User data is invalid' 
      });
    }

    const token = createToken(user);
    
    // Send welcome notification after successful login
    try {
      const welcomeMessage = user.role === 'admin' 
        ? `Welcome back, ${user.name}! You're logged in as Admin.`
        : user.role === 'client'
        ? `Welcome back, ${user.name}! Manage your vehicles and bookings.`
        : `Welcome back, ${user.name}! Explore our vehicles and book your ride.`;
      
      await createAndSendNotification(
        user._id,
        'system',
        'Welcome Back! 👋',
        welcomeMessage,
        {
          action: 'user_login',
          loginTime: new Date().toISOString(),
          userRole: user.role
        },
        null
      );
      console.log(`✅ Welcome notification sent to user ${user.email} (${user._id})`);
    } catch (notifError) {
      console.error(`❌ Error sending welcome notification to user ${user.email}:`, notifError);
      // Don't fail login if notification fails
    }
    
    res.json({ 
      success: true, 
      data: { 
        token, 
        user: { 
          id: user._id, 
          name: user.name || null, 
          email: user.email || null, 
          role: user.role || 'user',
          phone: user.phone || null,
          address: user.address || null,
          profileImage: user.profileImage || null,
          businessName: user.businessName || null,
          businessAddress: user.businessAddress || null,
          businessPhone: user.businessPhone || null,
          preferredLanguage: user.preferredLanguage || 'hinglish'
        } 
      }, 
      message: 'Login successful' 
    });
  } catch(err){
    console.error('Login error:', err);
    console.error('Error stack:', err.stack);
    console.error('Error details:', {
      message: err.message,
      name: err.name,
      code: err.code
    });
    
    // More detailed error response for debugging
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Server error occurred during login',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
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
    
    // Handle profile image upload - Safe and persistent storage
    if(req.file) {
      let profileImageUrl = null;
      
      // Check if Cloudinary was used (preferred for persistent storage)
      if(req.file.secure_url) {
        // Cloudinary secure URL (HTTPS) - Best for long-term storage
        profileImageUrl = req.file.secure_url;
        console.log('Profile image uploaded to Cloudinary:', profileImageUrl);
      } else if(req.file.path && (req.file.path.startsWith('http://') || req.file.path.startsWith('https://'))) {
        // Cloudinary path (URL) - Ensure HTTPS
        profileImageUrl = req.file.path.startsWith('https://') ? req.file.path : req.file.path.replace('http://', 'https://');
        console.log('Profile image uploaded to Cloudinary:', profileImageUrl);
      } else {
        // Local storage fallback - ensure path is correct
        const filename = req.file.filename || req.file.originalname;
        profileImageUrl = `/uploads/${filename}`;
        console.log('Profile image saved locally:', profileImageUrl);
        
        // Verify file exists
        const filePath = path.join(__dirname, '..', 'uploads', filename);
        if (!fs.existsSync(filePath)) {
          console.error('Warning: Profile image file not found at:', filePath);
          return res.status(500).json({
            success: false,
            data: null,
            message: 'Failed to save profile image. Please try again.'
          });
        }
      }
      
      // Delete old profile image if exists (only for Cloudinary to save storage)
      if(user.profileImage && user.profileImage.startsWith('https://res.cloudinary.com')) {
        // Old Cloudinary image - can be deleted if needed (optional, Cloudinary has free tier)
        // For now, we keep old images for backup
        console.log('Old profile image (Cloudinary):', user.profileImage);
      } else if(user.profileImage && user.profileImage.startsWith('/uploads/')) {
        // Old local file - delete to save space
        const oldFilePath = path.join(__dirname, '..', user.profileImage);
        if(fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
            console.log('Old local profile image deleted:', oldFilePath);
          } catch(err) {
            console.error('Error deleting old profile image:', err);
            // Don't fail the request if deletion fails
          }
        }
      }
      
      // Validate and save new profile image URL
      const validatedUrl = validateProfileImageUrl(profileImageUrl);
      if (validatedUrl) {
        user.profileImage = validatedUrl;
        console.log('Profile image saved to database:', validatedUrl);
      } else {
        console.error('Invalid profile image URL, not saving:', profileImageUrl);
        return res.status(500).json({
          success: false,
          data: null,
          message: 'Failed to save profile image. Please try again.'
        });
      }
    }

    // Save user with validated profile image
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
