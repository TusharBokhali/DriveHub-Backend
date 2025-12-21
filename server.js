require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

connectDB();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

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
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, data: null, message: 'File too large' });
  }
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ success: false, data: null, message: `Upload error: ${err.message}` });
  }
  if (err) {
    console.error('Unhandled error:', err);
    return res.status(500).json({ success: false, data: null, message: 'Internal server error' });
  }
  return next();
});
