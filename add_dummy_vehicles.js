require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');

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

// Dummy vehicles data
const dummyVehicles = [
  // Cars for Rent (Daily)
  {
    title: 'Honda City 2023 - Premium Sedan',
    description: 'Well maintained Honda City with all modern features. Perfect for family trips and long drives. AC, Music System, Power Steering included.',
    category: 'car',
    vehicleType: 'rent',
    rentType: 'daily',
    price: 2500,
    dailyPrice: 2500,
    location: 'Mumbai, Maharashtra',
    mileage: 15000,
    seats: 5,
    transmission: 'automatic',
    fuelType: 'petrol',
    year: 2023,
    driverRequired: false,
    driverAvailable: true,
    driverPrice: 500,
    isAvailable: true,
    features: [
      { name: 'AC', icon: 'ac', available: true },
      { name: 'Music System', icon: 'music', available: true },
      { name: 'GPS Navigation', icon: 'gps', available: true },
      { name: 'Power Steering', icon: 'steering', available: true }
    ]
  },
  {
    title: 'Maruti Swift - Compact Hatchback',
    description: 'Fuel efficient and easy to drive. Perfect for city commuting. Great mileage and low maintenance.',
    category: 'car',
    vehicleType: 'rent',
    rentType: 'daily',
    price: 1800,
    dailyPrice: 1800,
    location: 'Delhi, NCR',
    mileage: 25000,
    seats: 5,
    transmission: 'manual',
    fuelType: 'petrol',
    year: 2022,
    driverRequired: false,
    driverAvailable: false,
    isAvailable: true,
    features: [
      { name: 'AC', icon: 'ac', available: true },
      { name: 'Power Windows', icon: 'window', available: true }
    ]
  },
  // Cars for Rent (Hourly)
  {
    title: 'Toyota Innova Crysta - 7 Seater',
    description: 'Spacious 7-seater SUV perfect for group travel. Comfortable seating and powerful engine.',
    category: 'car',
    vehicleType: 'rent',
    rentType: 'hourly',
    price: 400,
    hourlyPrice: 400,
    location: 'Bangalore, Karnataka',
    mileage: 30000,
    seats: 7,
    transmission: 'manual',
    fuelType: 'diesel',
    year: 2021,
    driverRequired: true,
    driverAvailable: true,
    driverPrice: 200,
    isAvailable: true,
    features: [
      { name: 'AC', icon: 'ac', available: true },
      { name: 'Music System', icon: 'music', available: true },
      { name: 'Third Row Seating', icon: 'seats', available: true }
    ]
  },
  {
    title: 'Hyundai Creta - Compact SUV',
    description: 'Modern compact SUV with advanced features. Great for both city and highway driving.',
    category: 'car',
    vehicleType: 'rent',
    rentType: 'hourly',
    price: 350,
    hourlyPrice: 350,
    location: 'Pune, Maharashtra',
    mileage: 20000,
    seats: 5,
    transmission: 'automatic',
    fuelType: 'petrol',
    year: 2023,
    driverRequired: false,
    driverAvailable: true,
    driverPrice: 150,
    isAvailable: true,
    features: [
      { name: 'AC', icon: 'ac', available: true },
      { name: 'Touchscreen Infotainment', icon: 'screen', available: true },
      { name: 'Sunroof', icon: 'sunroof', available: true }
    ]
  },
  // Cars for Rent (Per KM)
  {
    title: 'Mahindra XUV700 - Luxury SUV',
    description: 'Premium SUV with luxury features. Perfect for long distance travel and family trips.',
    category: 'car',
    vehicleType: 'rent',
    rentType: 'per_km',
    price: 15,
    perKmPrice: 15,
    location: 'Chennai, Tamil Nadu',
    mileage: 12000,
    seats: 7,
    transmission: 'automatic',
    fuelType: 'diesel',
    year: 2023,
    driverRequired: true,
    driverAvailable: true,
    driverPrice: 300,
    isAvailable: true,
    features: [
      { name: 'AC', icon: 'ac', available: true },
      { name: 'Premium Sound System', icon: 'music', available: true },
      { name: 'Leather Seats', icon: 'seats', available: true },
      { name: '360 Camera', icon: 'camera', available: true }
    ]
  },
  // Cars for Sale
  {
    title: 'Tata Nexon EV - Electric Car',
    description: 'Eco-friendly electric vehicle with excellent range. Low running cost and zero emissions.',
    category: 'car',
    vehicleType: 'sell',
    rentType: 'fixed',
    price: 1500000,
    location: 'Hyderabad, Telangana',
    mileage: 5000,
    seats: 5,
    transmission: 'automatic',
    fuelType: 'electric',
    year: 2023,
    isAvailable: true,
    features: [
      { name: 'AC', icon: 'ac', available: true },
      { name: 'Fast Charging', icon: 'charging', available: true },
      { name: 'Touchscreen', icon: 'screen', available: true }
    ]
  },
  {
    title: 'Ford EcoSport - Pre-owned',
    description: 'Well maintained pre-owned car. Single owner, all service records available.',
    category: 'car',
    vehicleType: 'sell',
    rentType: 'fixed',
    price: 650000,
    location: 'Kolkata, West Bengal',
    mileage: 45000,
    seats: 5,
    transmission: 'manual',
    fuelType: 'petrol',
    year: 2020,
    isAvailable: true,
    features: [
      { name: 'AC', icon: 'ac', available: true },
      { name: 'Music System', icon: 'music', available: true }
    ]
  },
  // Bikes for Rent
  {
    title: 'Royal Enfield Classic 350',
    description: 'Iconic cruiser bike perfect for long rides. Powerful engine and comfortable seating.',
    category: 'bike',
    vehicleType: 'rent',
    rentType: 'daily',
    price: 800,
    dailyPrice: 800,
    location: 'Goa',
    mileage: 10000,
    seats: 2,
    transmission: 'manual',
    fuelType: 'petrol',
    year: 2022,
    driverRequired: false,
    isAvailable: true,
    features: [
      { name: 'ABS', icon: 'abs', available: true },
      { name: 'LED Lights', icon: 'light', available: true }
    ]
  },
  {
    title: 'Yamaha R15 V4 - Sports Bike',
    description: 'High performance sports bike. Perfect for enthusiasts and city riding.',
    category: 'bike',
    vehicleType: 'rent',
    rentType: 'hourly',
    price: 200,
    hourlyPrice: 200,
    location: 'Mumbai, Maharashtra',
    mileage: 8000,
    seats: 2,
    transmission: 'manual',
    fuelType: 'petrol',
    year: 2023,
    driverRequired: false,
    isAvailable: true,
    features: [
      { name: 'ABS', icon: 'abs', available: true },
      { name: 'Digital Display', icon: 'display', available: true }
    ]
  },
  // Bikes for Sale
  {
    title: 'Bajaj Pulsar 220F',
    description: 'Reliable commuter bike with good mileage. Well maintained, ready to use.',
    category: 'bike',
    vehicleType: 'sell',
    rentType: 'fixed',
    price: 95000,
    location: 'Jaipur, Rajasthan',
    mileage: 25000,
    seats: 2,
    transmission: 'manual',
    fuelType: 'petrol',
    year: 2021,
    isAvailable: true,
    features: [
      { name: 'Digital Console', icon: 'display', available: true }
    ]
  },
  // Auto Rickshaws
  {
    title: 'Bajaj Auto Rickshaw - CNG',
    description: 'Eco-friendly CNG auto rickshaw. Perfect for short distance travel.',
    category: 'auto',
    vehicleType: 'rent',
    rentType: 'per_km',
    price: 8,
    perKmPrice: 8,
    location: 'Delhi, NCR',
    mileage: 50000,
    seats: 3,
    transmission: 'manual',
    fuelType: 'cng',
    year: 2020,
    driverRequired: true,
    driverAvailable: true,
    driverPrice: 0,
    isAvailable: true,
    features: [
      { name: 'CNG Kit', icon: 'cng', available: true }
    ]
  },
  {
    title: 'Mahindra Auto Rickshaw',
    description: 'Comfortable auto rickshaw with good space. Ideal for city commuting.',
    category: 'auto',
    vehicleType: 'rent',
    rentType: 'hourly',
    price: 150,
    hourlyPrice: 150,
    location: 'Ahmedabad, Gujarat',
    mileage: 40000,
    seats: 3,
    transmission: 'manual',
    fuelType: 'petrol',
    year: 2021,
    driverRequired: true,
    driverAvailable: true,
    driverPrice: 0,
    isAvailable: true,
    features: []
  },
  // Service Vehicles
  {
    title: 'Car Washing Service',
    description: 'Professional car washing and detailing service. We come to your location.',
    category: 'other',
    vehicleType: 'service',
    rentType: 'fixed',
    price: 500,
    location: 'Mumbai, Maharashtra',
    serviceCategory: 'cleaning',
    serviceDescription: 'Complete car wash including exterior, interior cleaning, and waxing. Mobile service available.',
    isAvailable: true,
    features: [
      { name: 'Mobile Service', icon: 'mobile', available: true },
      { name: 'Interior Cleaning', icon: 'cleaning', available: true }
    ]
  },
  {
    title: 'Vehicle Maintenance Service',
    description: 'Complete vehicle maintenance and servicing. All types of vehicles welcome.',
    category: 'other',
    vehicleType: 'service',
    rentType: 'fixed',
    price: 2000,
    location: 'Bangalore, Karnataka',
    serviceCategory: 'maintenance',
    serviceDescription: 'Full service including oil change, filter replacement, brake check, and general inspection.',
    isAvailable: true,
    features: [
      { name: 'Oil Change', icon: 'oil', available: true },
      { name: 'Brake Service', icon: 'brake', available: true },
      { name: 'Filter Replacement', icon: 'filter', available: true }
    ]
  },
  {
    title: 'Vehicle Inspection Service',
    description: 'Professional vehicle inspection for insurance, registration, or pre-purchase.',
    category: 'other',
    vehicleType: 'service',
    rentType: 'fixed',
    price: 1500,
    location: 'Delhi, NCR',
    serviceCategory: 'inspection',
    serviceDescription: 'Comprehensive vehicle inspection including engine, transmission, brakes, suspension, and body condition.',
    isAvailable: true,
    features: [
      { name: 'Engine Check', icon: 'engine', available: true },
      { name: 'Body Inspection', icon: 'body', available: true },
      { name: 'Documentation', icon: 'doc', available: true }
    ]
  }
];

async function addDummyVehicles() {
  try {
    await connectDB();

    // Find or create a client user to own these vehicles
    let clientUser = await User.findOne({ role: 'client' });
    
    if (!clientUser) {
      console.log('📝 Creating a client user for vehicles...');
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('client123', salt);
      
      clientUser = new User({
        name: 'Vehicle Owner',
        email: 'vehicleowner@example.com',
        password: hashedPassword,
        role: 'client',
        phone: '+91-9876543210',
        businessName: 'ABC Vehicle Services',
        businessAddress: 'Mumbai, India',
        businessPhone: '+91-9876543211',
        preferredLanguage: 'hinglish'
      });
      
      await clientUser.save();
      console.log('✅ Client user created:', clientUser.email);
    } else {
      console.log('✅ Using existing client user:', clientUser.email);
    }

    console.log('\n🚗 Adding 15 dummy vehicles...\n');

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < dummyVehicles.length; i++) {
      const vehicleData = dummyVehicles[i];
      
      try {
        // Check if vehicle with same title already exists
        const existing = await Vehicle.findOne({ 
          title: vehicleData.title,
          owner: clientUser._id 
        });
        
        if (existing) {
          console.log(`⏭️  Skipping "${vehicleData.title}" - already exists`);
          continue;
        }

        const vehicle = new Vehicle({
          ...vehicleData,
          owner: clientUser._id,
          images: [] // No images for dummy data
        });

        await vehicle.save();
        successCount++;
        console.log(`✅ ${i + 1}. Added: ${vehicleData.title} (${vehicleData.category} - ${vehicleData.vehicleType})`);
      } catch (err) {
        errorCount++;
        console.error(`❌ Error adding "${vehicleData.title}":`, err.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Successfully added: ${successCount} vehicles`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`\n🎉 Done! You can now check the vehicles at: GET /api/vehicles`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

addDummyVehicles();

