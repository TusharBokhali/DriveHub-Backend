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

async function moveDriverPriceToSeparateObject() {
  try {
    await connectDB();

    console.log('💰 Moving driver price from pricingOptions to separate driverPricing object...\n');

    // Get all vehicles
    const vehicles = await Vehicle.find({});

    if (vehicles.length === 0) {
      console.log('❌ No vehicles found');
      process.exit(1);
    }

    console.log(`📊 Found ${vehicles.length} vehicles to check\n`);

    let updatedCount = 0;

    for (const vehicle of vehicles) {
      let needsUpdate = false;
      const currencySymbol = vehicle.currency || '₹';
      
      // Rebuild pricingOptions without driver price
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

      // Check if driver price exists in pricingOptions and remove it
      if (vehicle.pricingOptions && vehicle.pricingOptions.length > 0) {
        const driverLabel = vehicle.driverLabel || 'with driver';
        const hasDriverInOptions = vehicle.pricingOptions.some(opt => 
          opt.label === driverLabel || opt.label === 'with driver'
        );
        
        if (hasDriverInOptions) {
          needsUpdate = true;
        }
      }

      // Set driverPricing object if driver is available
      let driverPricingObj = undefined;
      if (vehicle.driverAvailable && vehicle.driverPrice && vehicle.driverPrice > 0) {
        driverPricingObj = {
          label: vehicle.driverLabel || 'with driver',
          price: vehicle.driverPrice,
          currency_symbol: currencySymbol
        };
        needsUpdate = true;
      }

      if (needsUpdate) {
        vehicle.pricingOptions = pricingOptions;
        vehicle.driverPricing = driverPricingObj;
        await vehicle.save();
        updatedCount++;
        console.log(`✅ Updated: ${vehicle.title} - Moved driver price to separate object`);
      } else {
        console.log(`⏭️  Skipping: ${vehicle.title} - No changes needed`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Updated ${updatedCount} vehicles`);
    console.log(`📋 Total vehicles processed: ${vehicles.length}`);
    console.log(`\n🎉 Done! Driver price is now in separate driverPricing object`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

moveDriverPriceToSeparateObject();

