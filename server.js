require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');

connectDB();
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/services', require('./routes/services'));
app.use('/api/sliders', require('./routes/sliders'));

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
