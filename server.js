require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

connectDB();
const app = express();

// CORS configuration - must be before other middleware
app.use(cors({
  origin: '*', // Allow all origins (for development)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true
}));

// Body parsers - but don't parse multipart/form-data (let multer handle it)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware (for debugging) - must be before routes
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' || req.method === 'DELETE') {
    console.log(`\n📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
    console.log('Body keys:', Object.keys(req.body || {}));
    if (req.files) {
      console.log('Files:', req.files.length);
    }
    // Log all registered routes for debugging
    if (req.path.includes('cancel')) {
      console.log('🔍 Cancel route check - Path:', req.path, 'Method:', req.method);
    }
  }
  next();
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Uploads directory created:', uploadsDir);
  } catch (err) {
    console.error('Failed to create uploads directory:', err);
  }
}

// serve uploads - must be before routes
app.use('/uploads', express.static(uploadsDir, {
  setHeaders: (res, filePath) => {
    // Set proper content type for images
    if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (filePath.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    } else if (filePath.endsWith('.webp')) {
      res.setHeader('Content-Type', 'image/webp');
    }
  }
}));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/services', require('./routes/services'));
app.use('/api/sliders', require('./routes/sliders'));
app.use('/api/dashboard', require('./routes/dashboard'));

// New Booking Flow routes
app.use('/api/booking-flow', require('./routes/bookingFlow'));

// Notifications routes
app.use('/api/notifications', require('./routes/notifications'));

// Admin routes
app.use('/api/admin/vehicles', require('./routes/admin/vehicles'));

app.get('/', (req,res)=>res.send('Vehicle Rental API Running'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on ${PORT}`));

// Global error handler (including Multer errors) to avoid connection resets
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Error occurred:', err);
  
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'File too large. Maximum size is 10MB per file.' 
    });
  }
  
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ 
      success: false, 
      data: null, 
      message: `Upload error: ${err.message}` 
    });
  }
  
  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      success: false, 
      data: null, 
      message: 'Invalid JSON in request body' 
    });
  }
  
  if (err) {
    console.error('Unhandled error:', err);
    return res.status(500).json({ 
      success: false, 
      data: null, 
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
  
  return next();
});
