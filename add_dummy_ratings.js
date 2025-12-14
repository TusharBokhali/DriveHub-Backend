require('dotenv').config();
const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

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

// Dummy users for reviews (with names and profile images)
const dummyReviewers = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.reviewer@example.com',
    password: 'password123',
    phone: '+91-9876543201',
    address: 'Mumbai, Maharashtra',
    profileImage: 'https://i.pravatar.cc/150?img=1',
    preferredLanguage: 'hinglish'
  },
  {
    name: 'Priya Sharma',
    email: 'priya.reviewer@example.com',
    password: 'password123',
    phone: '+91-9876543202',
    address: 'Delhi, NCR',
    profileImage: 'https://i.pravatar.cc/150?img=5',
    preferredLanguage: 'hinglish'
  },
  {
    name: 'Amit Patel',
    email: 'amit.reviewer@example.com',
    password: 'password123',
    phone: '+91-9876543203',
    address: 'Ahmedabad, Gujarat',
    profileImage: 'https://i.pravatar.cc/150?img=12',
    preferredLanguage: 'hinglish'
  },
  {
    name: 'Sneha Reddy',
    email: 'sneha.reviewer@example.com',
    password: 'password123',
    phone: '+91-9876543204',
    address: 'Hyderabad, Telangana',
    profileImage: 'https://i.pravatar.cc/150?img=9',
    preferredLanguage: 'hinglish'
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.reviewer@example.com',
    password: 'password123',
    phone: '+91-9876543205',
    address: 'Pune, Maharashtra',
    profileImage: 'https://i.pravatar.cc/150?img=15',
    preferredLanguage: 'hinglish'
  },
  {
    name: 'Anjali Desai',
    email: 'anjali.reviewer@example.com',
    password: 'password123',
    phone: '+91-9876543206',
    address: 'Bangalore, Karnataka',
    profileImage: 'https://i.pravatar.cc/150?img=20',
    preferredLanguage: 'hinglish'
  },
  {
    name: 'Rohit Mehta',
    email: 'rohit.reviewer@example.com',
    password: 'password123',
    phone: '+91-9876543207',
    address: 'Chennai, Tamil Nadu',
    profileImage: 'https://i.pravatar.cc/150?img=33',
    preferredLanguage: 'hinglish'
  },
  {
    name: 'Kavita Nair',
    email: 'kavita.reviewer@example.com',
    password: 'password123',
    phone: '+91-9876543208',
    address: 'Kochi, Kerala',
    profileImage: 'https://i.pravatar.cc/150?img=47',
    preferredLanguage: 'hinglish'
  }
];

// Dummy reviews with ratings
const dummyReviews = [
  {
    rating: 5,
    review: 'Excellent vehicle! Very clean and well maintained. Owner was very cooperative. Highly recommended!'
  },
  {
    rating: 4,
    review: 'Good experience overall. Vehicle was in good condition. Minor issues but nothing major. Would rent again.'
  },
  {
    rating: 5,
    review: 'Perfect for our family trip. Comfortable seats, good AC, and smooth driving. Owner provided great service.'
  },
  {
    rating: 3,
    review: 'Average experience. Vehicle was okay but could be better maintained. Price was reasonable though.'
  },
  {
    rating: 5,
    review: 'Amazing service! Vehicle exceeded expectations. Very professional owner and hassle-free process.'
  },
  {
    rating: 4,
    review: 'Nice vehicle with all features working properly. Good value for money. Recommended for city trips.'
  },
  {
    rating: 5,
    review: 'Best rental experience ever! Clean car, punctual owner, and great customer service. Will definitely use again.'
  },
  {
    rating: 4,
    review: 'Satisfactory service. Vehicle was clean and functional. Owner was responsive to queries. Good experience.'
  },
  {
    rating: 5,
    review: 'Outstanding quality! Vehicle was like new. Smooth ride and all amenities working perfectly. 5 stars!'
  },
  {
    rating: 3,
    review: 'Decent vehicle but needs some maintenance. AC was not very cold. Otherwise okay for short trips.'
  },
  {
    rating: 4,
    review: 'Good vehicle for the price. Comfortable and reliable. Owner was helpful throughout the rental period.'
  },
  {
    rating: 5,
    review: 'Fantastic experience! Vehicle was spotless, well-maintained, and owner was very professional. Highly recommended!'
  },
  {
    rating: 4,
    review: 'Nice bike, perfect for city rides. Good mileage and easy to handle. Owner was friendly and cooperative.'
  },
  {
    rating: 5,
    review: 'Excellent service! Professional car wash at my doorstep. Very thorough cleaning. Will definitely use again.'
  },
  {
    rating: 4,
    review: 'Good maintenance service. All issues were addressed properly. Reasonable pricing and professional work.'
  }
];

async function addDummyRatings() {
  try {
    await connectDB();

    console.log('👥 Creating/Checking dummy reviewer users...\n');

    // Create or get dummy reviewer users
    const reviewerUsers = [];
    for (const reviewerData of dummyReviewers) {
      let user = await User.findOne({ email: reviewerData.email });
      
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(reviewerData.password, salt);
        
        user = new User({
          ...reviewerData,
          password: hashedPassword,
          role: 'user'
        });
        
        await user.save();
        console.log(`✅ Created reviewer: ${reviewerData.name}`);
      } else {
        // Update profile image if not set
        if (!user.profileImage) {
          user.profileImage = reviewerData.profileImage;
          await user.save();
        }
        console.log(`✅ Using existing reviewer: ${reviewerData.name}`);
      }
      
      reviewerUsers.push(user);
    }

    console.log('\n🚗 Adding ratings/reviews to vehicles...\n');

    // Get all vehicles
    const vehicles = await Vehicle.find({});
    
    if (vehicles.length === 0) {
      console.log('❌ No vehicles found. Please add vehicles first using add_dummy_vehicles.js');
      process.exit(1);
    }

    let totalRatingsAdded = 0;
    let reviewIndex = 0;

    for (const vehicle of vehicles) {
      // Add 2-4 random reviews per vehicle
      const numReviews = Math.floor(Math.random() * 3) + 2; // 2 to 4 reviews
      
      for (let i = 0; i < numReviews && reviewIndex < dummyReviews.length; i++) {
        // Pick a random reviewer
        const reviewer = reviewerUsers[Math.floor(Math.random() * reviewerUsers.length)];
        
        // Check if this reviewer already rated this vehicle
        const existingRating = vehicle.ratings.find(
          r => r.user.toString() === reviewer._id.toString()
        );
        
        if (existingRating) {
          continue; // Skip if already rated
        }

        // Add rating
        const reviewData = dummyReviews[reviewIndex % dummyReviews.length];
        vehicle.ratings.push({
          user: reviewer._id,
          rating: reviewData.rating,
          review: reviewData.review,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
        });

        reviewIndex++;
        totalRatingsAdded++;
      }

      // Calculate average rating
      vehicle.calculateAverageRating();
      await vehicle.save();
      
      console.log(`✅ Added ${numReviews} reviews to: ${vehicle.title}`);
    }

    console.log('\n📊 Summary:');
    console.log(`✅ Total ratings/reviews added: ${totalRatingsAdded}`);
    console.log(`✅ Reviewers created/used: ${reviewerUsers.length}`);
    console.log(`✅ Vehicles updated: ${vehicles.length}`);
    console.log(`\n🎉 Done! Check vehicles with ratings at: GET /api/vehicles/:id`);
    console.log(`   Ratings will show user name, profile image, rating, and review description`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  }
}

addDummyRatings();

