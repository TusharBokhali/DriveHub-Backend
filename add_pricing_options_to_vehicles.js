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

async function addPricingOptionsToVehicles() {
  try {
    await connectDB();

    console.log('💰 Adding pricingOptions array to existing vehicles...\n');

    // Get all vehicles
    const vehicles = await Vehicle.find({});

    if (vehicles.length === 0) {
      console.log('❌ No vehicles found');
      process.exit(1);
    }

    console.log(`📊 Found ${vehicles.length} vehicles to update\n`);

    let updatedCount = 0;

    for (const vehicle of vehicles) {
      // Skip if pricingOptions already exists and has data
      if (vehicle.pricingOptions && vehicle.pricingOptions.length > 0) {
        console.log(`⏭️  Skipping: ${vehicle.title} - pricingOptions already exists`);
        continue;
      }

      // Build pricing options array from existing prices
      const currencySymbol = vehicle.currency || '₹';
      const pricingOptions = [];

      if (vehicle.hourlyPrice) {
        pricingOptions.push({
          label: 'per hour',
          price: vehicle.hourlyPrice,
          currency_symbol: currencySymbol
        });
      }
      if (vehicle.dailyPrice) {
        pricingOptions.push({
          label: 'per day',
          price: vehicle.dailyPrice,
          currency_symbol: currencySymbol
        });
      }
      if (vehicle.perKmPrice) {
        pricingOptions.push({
          label: 'per km',
          price: vehicle.perKmPrice,
          currency_symbol: currencySymbol
        });
      }

      // Update vehicle with pricingOptions
      vehicle.pricingOptions = pricingOptions;
      await vehicle.save();
      
      updatedCount++;
      console.log(`✅ Updated: ${vehicle.title} - Added ${pricingOptions.length} pricing option(s)`);
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated ${updatedCount} vehicles with pricingOptions array`);
    console.log(`⏭️  Skipped ${vehicles.length - updatedCount} vehicles (already had pricingOptions)`);
    console.log(`\n🎉 Done! All vehicles now have pricingOptions array`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

addPricingOptionsToVehicles();

