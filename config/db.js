const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error('❌ MONGO_URI is not defined in .env file');
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds socket timeout
      retryWrites: true,
      w: 'majority'
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    
    // Specific error messages
    if (err.name === 'MongooseServerSelectionError') {
      console.error('\n🔧 Common Solutions:');
      console.error('1. Check if your IP address is whitelisted in MongoDB Atlas:');
      console.error('   https://www.mongodb.com/docs/atlas/security-whitelist/');
      console.error('2. Go to MongoDB Atlas → Network Access → Add IP Address');
      console.error('3. For development, you can add: 0.0.0.0/0 (allows all IPs - NOT recommended for production)');
      console.error('4. Check your MONGO_URI in .env file');
      console.error('5. Verify your MongoDB Atlas cluster is running');
    }
    
    if (err.message.includes('authentication failed')) {
      console.error('\n🔧 Authentication Error:');
      console.error('1. Check your MongoDB username and password in MONGO_URI');
      console.error('2. Verify database user has proper permissions');
    }
    
    console.error('\n📋 Full Error Details:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
