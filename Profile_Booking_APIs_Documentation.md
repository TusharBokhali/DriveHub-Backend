# Profile Update & Booking List APIs Documentation

## Overview
This document describes the new APIs for profile management and booking list retrieval in the Vehicle Rental System.

## Profile Update API

### Update User Profile
**Endpoint:** `PUT /api/auth/profile`  
**Authentication:** Required (Bearer Token)  
**Content-Type:** `multipart/form-data` (for file uploads) or `application/json`

#### Request Body
```json
{
  "name": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "address": "string (optional)",
  "businessName": "string (optional)",
  "businessAddress": "string (optional)",
  "businessPhone": "string (optional)",
  "preferredLanguage": "string (optional, enum: ['hindi', 'english', 'hinglish'])",
  "profileImage": "file (optional)"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "name": "Updated Name",
    "email": "updated@example.com",
    "phone": "+91-9876543210",
    "address": "Updated Address",
    "profileImage": "/uploads/filename.jpg",
    "businessName": "Business Name",
    "businessAddress": "Business Address",
    "businessPhone": "+91-9876543210",
    "preferredLanguage": "hinglish",
    "role": "user"
  },
  "message": "Profile updated successfully"
}
```

#### Features
- ✅ Email validation and uniqueness check
- ✅ Profile image upload support
- ✅ Partial updates (only provided fields are updated)
- ✅ Business information support for clients
- ✅ Language preference setting

#### Error Responses
- `400` - Invalid email format or email already exists
- `404` - User not found
- `500` - Server error

---

## Booking List APIs

### 1. Get User Bookings (Simple)
**Endpoint:** `GET /api/bookings/me`  
**Authentication:** Required (Bearer Token)

#### Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "booking_id",
      "vehicle": {
        "_id": "vehicle_id",
        "title": "Vehicle Title",
        "category": "car",
        "images": ["image1.jpg", "image2.jpg"],
        "price": 1000,
        "rentType": "daily",
        "driverAvailable": true,
        "driverPrice": 500
      },
      "owner": {
        "_id": "owner_id",
        "name": "Owner Name",
        "email": "owner@example.com",
        "phone": "+91-9876543210",
        "businessName": "Business Name"
      },
      "startAt": "2024-01-01T10:00:00.000Z",
      "endAt": "2024-01-02T10:00:00.000Z",
      "status": "confirmed",
      "totalPrice": 1500,
      "createdAt": "2024-01-01T09:00:00.000Z"
    }
  ],
  "message": "Found 1 bookings"
}
```

### 2. Get Detailed Booking List (Advanced)
**Endpoint:** `GET /api/bookings/list`  
**Authentication:** Required (Bearer Token)

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of items per page |
| `status` | string | - | Filter by booking status (pending, confirmed, cancelled, completed, in_progress) |
| `startDate` | string | - | Filter bookings from this date (ISO format) |
| `endDate` | string | - | Filter bookings until this date (ISO format) |
| `sortBy` | string | createdAt | Sort field (createdAt, startAt, endAt, totalPrice) |
| `sortOrder` | string | desc | Sort order (asc, desc) |

#### Example Request
```
GET /api/bookings/list?page=1&limit=5&status=confirmed&sortBy=createdAt&sortOrder=desc
```

#### Response
```json
{
  "success": true,
  "data": {
    "bookings": [
      {
        "_id": "booking_id",
        "vehicle": {
          "_id": "vehicle_id",
          "title": "Honda City",
          "category": "car",
          "images": ["honda_city_1.jpg"],
          "price": 2000,
          "rentType": "daily",
          "driverAvailable": true,
          "driverPrice": 800,
          "owner": "owner_id"
        },
        "renter": {
          "_id": "renter_id",
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "+91-9876543210",
          "profileImage": "/uploads/profile.jpg"
        },
        "owner": {
          "_id": "owner_id",
          "name": "Rental Company",
          "email": "rental@example.com",
          "phone": "+91-9876543210",
          "businessName": "ABC Rentals",
          "businessPhone": "+91-9876543210",
          "profileImage": "/uploads/company_logo.jpg"
        },
        "startAt": "2024-01-15T09:00:00.000Z",
        "endAt": "2024-01-17T18:00:00.000Z",
        "expectedKm": 200,
        "pickupLocation": "Airport Terminal 1",
        "destination": "City Center",
        "driverRequired": true,
        "driverAssigned": true,
        "driverName": "Raj Kumar",
        "driverPhone": "+91-9876543211",
        "driverLicense": "DL123456789",
        "vehiclePrice": 4000,
        "driverPrice": 1600,
        "totalPrice": 5600,
        "status": "confirmed",
        "ownerAccepted": true,
        "ownerAcceptedAt": "2024-01-14T15:30:00.000Z",
        "paymentMethod": "online",
        "paymentStatus": "paid",
        "paymentId": "pay_123456789",
        "tripStarted": false,
        "tripCompleted": false,
        "actualKm": null,
        "messages": [],
        "createdAt": "2024-01-14T10:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalBookings": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  },
  "message": "Found 5 bookings"
}
```

#### Features
- ✅ Pagination support
- ✅ Status filtering
- ✅ Date range filtering
- ✅ Sorting options
- ✅ Role-based data (shows different data for users vs clients)
- ✅ Detailed vehicle and user information
- ✅ Complete booking history

---

## Usage Examples

### 1. Update Profile with Image
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "name=John Doe" \
  -F "email=john@example.com" \
  -F "phone=+91-9876543210" \
  -F "profileImage=@profile.jpg"
```

### 2. Get Booking List with Filters
```bash
curl -X GET "http://localhost:3000/api/bookings/list?page=1&limit=10&status=confirmed" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Update Profile (JSON)
```bash
curl -X PUT http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Name",
    "email": "updated@example.com",
    "phone": "+91-9876543210",
    "preferredLanguage": "hinglish"
  }'
```

---

## Error Handling

All APIs follow a consistent error response format:

```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

### Common Error Codes
- `400` - Bad Request (validation errors, invalid data)
- `401` - Unauthorized (invalid or missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `500` - Internal Server Error

---

## Testing

Use the provided test script to verify the APIs:

```bash
node test_profile_booking_apis.js
```

Make sure your server is running on `http://localhost:3000` before running the tests.

---

## Notes

1. **Profile Image Upload**: The profile image is stored in the `uploads/` directory and the path is saved in the database.

2. **Email Uniqueness**: When updating email, the system checks for uniqueness across all users.

3. **Role-based Access**: The booking list API returns different data based on user role (renter vs owner).

4. **Pagination**: The advanced booking list API supports pagination with configurable page size.

5. **Filtering**: Multiple filters can be combined for precise data retrieval.

6. **Sorting**: Results can be sorted by any field in ascending or descending order.
