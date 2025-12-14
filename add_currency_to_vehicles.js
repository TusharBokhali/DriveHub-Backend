require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

async function addCurrencyToVehicles() {
  try {
    await connectDB();

    console.log('💰 Adding currency to existing vehicles...\n');

    // Get all vehicles without currency or with null currency
    const vehicles = await Vehicle.find({
      $or: [
        { currency: { $exists: false } },
        { currency: null },
        { currency: '' }
      ]
    });

    if (vehicles.length === 0) {
      console.log('✅ All vehicles already have currency field');
      process.exit(0);
    }

    console.log(`📊 Found ${vehicles.length} vehicles to update\n`);

    let updatedCount = 0;

    for (const vehicle of vehicles) {
      // Set default currency to ₹
      vehicle.currency = '₹';
      await vehicle.save();
      updatedCount++;
      console.log(`✅ Updated: ${vehicle.title} - Currency: ₹`);
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated ${updatedCount} vehicles with default currency (₹)`);
    console.log(`\n🎉 Done! All vehicles now have currency field`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

addCurrencyToVehicles();

