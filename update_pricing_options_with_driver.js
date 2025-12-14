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

async function updatePricingOptionsWithDriver() {
  try {
    await connectDB();

    console.log('💰 Updating pricingOptions with driver prices...\n');

    // Get all vehicles
    const vehicles = await Vehicle.find({});

    if (vehicles.length === 0) {
      console.log('❌ No vehicles found');
      process.exit(1);
    }

    console.log(`📊 Found ${vehicles.length} vehicles to check\n`);

    let updatedCount = 0;

    for (const vehicle of vehicles) {
      const currencySymbol = vehicle.currency || '₹';
      const pricingOptions = [];

      // Add existing pricing options
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

      // Add driver price if driver is available
      if (vehicle.driverAvailable && vehicle.driverPrice && vehicle.driverPrice > 0) {
        // Check if driver price already exists in pricingOptions
        const driverExists = pricingOptions.some(opt => 
          opt.label === (vehicle.driverLabel || 'with driver')
        );
        
        if (!driverExists) {
          pricingOptions.push({
            label: vehicle.driverLabel || 'with driver',
            price: vehicle.driverPrice,
            currency_symbol: currencySymbol
          });
          updatedCount++;
          console.log(`✅ Updated: ${vehicle.title} - Added driver price to pricingOptions`);
        } else {
          console.log(`⏭️  Skipping: ${vehicle.title} - Driver price already in pricingOptions`);
        }
      }

      // Update vehicle with pricingOptions
      vehicle.pricingOptions = pricingOptions;
      await vehicle.save();
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated ${updatedCount} vehicles with driver prices in pricingOptions`);
    console.log(`📋 Total vehicles processed: ${vehicles.length}`);
    console.log(`\n🎉 Done! All vehicles now have driver prices in pricingOptions array`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

updatePricingOptionsWithDriver();

