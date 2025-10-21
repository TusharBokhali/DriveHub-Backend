# Hinglish Vehicle Rental App - Backend API Documentation

## Overview
Complete backend implementation for a Hinglish vehicle rental application with two modes:
1. **User Mode**: Browse, rent, buy vehicles, request services
2. **Client Mode**: Manage vehicles, accept bookings, provide services

## Key Features Implemented

### 🚗 Vehicle Management
- **Three Vehicle Types**: Sell, Rent, Service
- **Multiple Pricing**: Hourly, Daily, Per KM pricing for rentals
- **Driver Options**: Optional driver with separate pricing
- **Ratings & Reviews**: 5-star rating system with reviews
- **Image Upload**: Multiple vehicle images support

### 📱 User Features
- **Browse Vehicles**: Filter by type, category, price, driver requirement
- **Vehicle Details**: Complete vehicle information with ratings
- **Booking System**: Rent vehicles with trip details
- **Service Requests**: Request vehicle maintenance/repair services
- **Profile Management**: Update personal information and preferences
- **Rating System**: Rate and review vehicles after use

### 🏢 Client Features
- **Vehicle Management**: Add, update, delete vehicles
- **Booking Management**: Accept/decline rental requests
- **Service Management**: Accept and manage service requests
- **Driver Assignment**: Assign drivers to bookings
- **Trip Tracking**: Monitor trip status and completion
- **Business Profile**: Manage business information

## API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register user/client
- `POST /login` - Login user/client
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile

### Vehicles (`/api/vehicles`)
- `GET /` - Get all vehicles (with filters)
- `GET /:id` - Get vehicle by ID
- `POST /` - Create vehicle (Client only)
- `PUT /:id` - Update vehicle (Owner only)
- `DELETE /:id` - Delete vehicle (Owner only)
- `GET /my/vehicles` - Get my vehicles (Client only)
- `POST /:id/rate` - Rate vehicle

### Bookings (`/api/bookings`)
- `POST /` - Create booking
- `GET /me` - Get my bookings (User)
- `GET /:id` - Get booking details
- `GET /owner/requests` - Get owner bookings (Client)
- `POST /:id/accept` - Accept booking (Client)
- `POST /:id/decline` - Decline booking (Client)
- `POST /:id/start` - Start trip
- `POST /:id/complete` - Complete trip

### Services (`/api/services`)
- `POST /` - Create service request
- `GET /my` - Get my service requests (User)
- `GET /:id` - Get service request details
- `GET /` - Get all service requests (Client)
- `POST /:id/accept` - Accept service request (Client)
- `PUT /:id/status` - Update service status
- `GET /assigned/me` - Get assigned services (Client)

## Database Models

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: 'user' | 'client',
  phone: String,
  address: String,
  profileImage: String,
  businessName: String, // for clients
  businessAddress: String,
  businessPhone: String,
  preferredLanguage: 'hindi' | 'english' | 'hinglish'
}
```

### Vehicle Model
```javascript
{
  owner: ObjectId (User),
  title: String,
  description: String,
  category: 'bike' | 'car' | 'auto' | 'other',
  vehicleType: 'sell' | 'rent' | 'service',
  rentType: 'hourly' | 'daily' | 'per_km' | 'fixed',
  price: Number,
  hourlyPrice: Number,
  dailyPrice: Number,
  perKmPrice: Number,
  driverRequired: Boolean,
  driverPrice: Number,
  driverAvailable: Boolean,
  ratings: [{
    user: ObjectId,
    rating: Number (1-5),
    review: String,
    createdAt: Date
  }],
  averageRating: Number,
  totalRatings: Number,
  location: String,
  isAvailable: Boolean,
  serviceCategory: String, // for service type
  serviceDescription: String,
  images: [String]
}
```

### Booking Model
```javascript
{
  vehicle: ObjectId (Vehicle),
  renter: ObjectId (User),
  owner: ObjectId (User),
  startAt: Date,
  endAt: Date,
  expectedKm: Number,
  pickupLocation: String,
  destination: String,
  driverRequired: Boolean,
  driverAssigned: Boolean,
  driverName: String,
  driverPhone: String,
  driverLicense: String,
  vehiclePrice: Number,
  driverPrice: Number,
  totalPrice: Number,
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress',
  ownerAccepted: Boolean,
  paymentMethod: 'online' | 'offline',
  paymentStatus: 'pending' | 'paid' | 'failed',
  tripStarted: Boolean,
  tripCompleted: Boolean,
  actualKm: Number,
  messages: [{
    sender: ObjectId,
    message: String,
    timestamp: Date
  }]
}
```

### Service Model
```javascript
{
  user: ObjectId (User),
  vehicleCategory: 'bike' | 'car' | 'auto' | 'other',
  serviceType: 'maintenance' | 'repair' | 'cleaning' | 'inspection' | 'other',
  title: String,
  description: String,
  mobile: String,
  email: String,
  address: String,
  urgency: 'low' | 'medium' | 'high' | 'urgent',
  preferredDate: Date,
  preferredTime: String,
  paymentMethod: 'online' | 'offline',
  estimatedPrice: Number,
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled',
  assignedTo: ObjectId (User), // client who accepted
  images: [String],
  notes: String
}
```

## Key Features Explained

### 1. Vehicle Types
- **Sell**: Vehicles available for purchase
- **Rent**: Vehicles available for rental with flexible pricing
- **Service**: Service providers offering vehicle maintenance/repair

### 2. Pricing System
- **Multiple Pricing Options**: Hourly, Daily, Per KM for rentals
- **Driver Pricing**: Separate pricing for driver service
- **Dynamic Calculation**: Automatic price calculation based on duration/distance

### 3. Booking Flow
1. User creates booking request
2. Client receives notification
3. Client accepts/declines with driver info
4. Trip starts when confirmed
5. Trip completes with actual details

### 4. Service Request Flow
1. User creates service request
2. Clients can view and accept requests
3. Service status updates (pending → accepted → in_progress → completed)
4. Payment handling (online/offline)

### 5. Rating System
- 5-star rating system
- Written reviews
- Average rating calculation
- Rating history per vehicle

## Postman Collection
Complete Postman collection available: `Vehicle_Rental_API_Complete.postman_collection.json`

### Environment Variables
- `base_url`: http://localhost:5000
- `user_token`: JWT token for user authentication
- `client_token`: JWT token for client authentication
- `vehicle_id`: Vehicle ID for testing
- `booking_id`: Booking ID for testing
- `service_id`: Service ID for testing

## Usage Instructions

### 1. Setup
```bash
npm install
npm run dev
```

### 2. Authentication
1. Register as user or client
2. Login to get JWT token
3. Use token in Authorization header: `Bearer <token>`

### 3. Testing Flow
1. Register client and create vehicles
2. Register user and browse vehicles
3. Create booking/service requests
4. Accept requests as client
5. Complete trips/services

## Advanced Features

### Driver Management
- Optional driver assignment
- Driver information tracking
- Separate driver pricing

### Trip Tracking
- Real-time trip status
- Start/complete trip functionality
- Actual vs expected distance tracking

### Communication
- Message system in bookings
- Status updates and notifications

### Payment Integration
- Online/offline payment options
- Payment status tracking

## Security Features
- JWT authentication
- Role-based access control
- Input validation
- File upload security
- Password hashing

## Future Enhancements
- Live location tracking
- Push notifications
- Payment gateway integration
- Advanced search and filters
- Multi-language support
- Admin dashboard

This backend provides a complete foundation for a Hinglish vehicle rental application with all the requested features for both user and client modes.
