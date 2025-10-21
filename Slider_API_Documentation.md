# Slider API Documentation

## Overview
The Slider API allows you to manage slider content for your vehicle rental application. It supports image uploads and different types of sliders (featured, latest, offer, promotion).

## Base URL
```
http://localhost:5000/api/sliders
```

## Authentication
Most endpoints require authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Get All Sliders (Public)
**GET** `/api/sliders`

Get all active sliders. You can filter by type and status.

**Query Parameters:**
- `type` (optional): Filter by slider type (`featured`, `latest`, `offer`, `promotion`)
- `isActive` (optional): Filter by active status (`true`/`false`)

**Example:**
```bash
GET /api/sliders
GET /api/sliders?type=featured
GET /api/sliders?type=offer&isActive=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "slider_id",
      "title": "Premium Cars",
      "subtitle": "Starting from $25/day",
      "description": "Discover our premium car collection",
      "image": "/uploads/1234567890-image.jpg",
      "buttonText": "Explore Now",
      "buttonLink": "/vehicles?type=premium",
      "type": "featured",
      "isActive": true,
      "order": 1,
      "startDate": null,
      "endDate": null,
      "createdBy": "user_id",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Found 1 sliders"
}
```

### 2. Get Slider by ID (Public)
**GET** `/api/sliders/:id`

Get a specific slider by its ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "slider_id",
    "title": "Premium Cars",
    "subtitle": "Starting from $25/day",
    "description": "Discover our premium car collection",
    "image": "/uploads/1234567890-image.jpg",
    "buttonText": "Explore Now",
    "buttonLink": "/vehicles?type=premium",
    "type": "featured",
    "isActive": true,
    "order": 1,
    "createdBy": {
      "_id": "user_id",
      "name": "User Name",
      "email": "user@example.com"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Slider found successfully"
}
```

### 3. Create Slider (Protected)
**POST** `/api/sliders`

Create a new slider with image upload.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:**
- `title` (required): Slider title
- `subtitle` (required): Slider subtitle
- `description` (optional): Slider description
- `image` (required): Image file (JPG, PNG, etc.)
- `buttonText` (optional): Button text (default: "Explore Now")
- `buttonLink` (optional): Button link URL
- `type` (optional): Slider type (`featured`, `latest`, `offer`, `promotion`) - default: `featured`
- `isActive` (optional): Active status (default: `true`)
- `order` (optional): Display order (default: `0`)
- `startDate` (optional): Start date for time-based sliders
- `endDate` (optional): End date for time-based sliders

**Example Request:**
```bash
POST /api/sliders
Content-Type: multipart/form-data
Authorization: Bearer <token>

title: Premium Cars
subtitle: Starting from $25/day
description: Discover our premium car collection
image: [file upload]
buttonText: Explore Now
buttonLink: /vehicles?type=premium
type: featured
order: 1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "new_slider_id",
    "title": "Premium Cars",
    "subtitle": "Starting from $25/day",
    "description": "Discover our premium car collection",
    "image": "/uploads/1234567890-image.jpg",
    "buttonText": "Explore Now",
    "buttonLink": "/vehicles?type=premium",
    "type": "featured",
    "isActive": true,
    "order": 1,
    "createdBy": "user_id",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Slider created successfully"
}
```

### 4. Get My Sliders (Protected)
**GET** `/api/sliders/my/sliders`

Get all sliders created by the authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "slider_id",
      "title": "My Slider",
      "subtitle": "My subtitle",
      "image": "/uploads/image.jpg",
      "type": "featured",
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "message": "Found 1 sliders"
}
```

### 5. Update Slider (Protected)
**PUT** `/api/sliders/:id`

Update an existing slider. Only the creator or admin can update.

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form Data:** (All fields are optional)
- `title`: Updated title
- `subtitle`: Updated subtitle
- `description`: Updated description
- `image`: New image file (optional)
- `buttonText`: Updated button text
- `buttonLink`: Updated button link
- `type`: Updated slider type
- `isActive`: Updated active status
- `order`: Updated display order
- `startDate`: Updated start date
- `endDate`: Updated end date

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "slider_id",
    "title": "Updated Title",
    "subtitle": "Updated Subtitle",
    "image": "/uploads/new-image.jpg",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Slider updated successfully"
}
```

### 6. Toggle Slider Status (Protected)
**PATCH** `/api/sliders/:id/toggle`

Toggle the active status of a slider.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "slider_id",
    "isActive": false,
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "message": "Slider deactivated successfully"
}
```

### 7. Delete Slider (Protected)
**DELETE** `/api/sliders/:id`

Delete a slider. Only the creator or admin can delete.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Slider deleted successfully"
}
```

## Slider Types

1. **featured**: Featured content sliders
2. **latest**: Latest/new arrivals sliders
3. **offer**: Special offer sliders
4. **promotion**: Promotional content sliders

## Image Upload Requirements

- **File Types**: JPG, PNG, GIF, WebP
- **Max Size**: 5MB
- **Storage**: Images are stored in `/uploads/` directory
- **URL Format**: `/uploads/filename.jpg`

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "data": null,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Title is required",
      "param": "title",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "data": null,
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden
```json
{
  "success": false,
  "data": null,
  "message": "Not authorized to update this slider"
}
```

### 404 Not Found
```json
{
  "success": false,
  "data": null,
  "message": "Slider not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "data": null,
  "message": "Server error"
}
```

## Usage Examples

### Creating Different Types of Sliders

**Featured Slider:**
```bash
POST /api/sliders
type: featured
title: Premium Cars
subtitle: Starting from $25/day
```

**Latest Slider:**
```bash
POST /api/sliders
type: latest
title: New Arrivals
subtitle: Latest vehicles added this week
```

**Offer Slider:**
```bash
POST /api/sliders
type: offer
title: Special Offer
subtitle: 50% OFF on Weekend Rentals
startDate: 2024-01-01T00:00:00.000Z
endDate: 2024-12-31T23:59:59.000Z
```

**Promotion Slider:**
```bash
POST /api/sliders
type: promotion
title: Summer Promotion
subtitle: Free Driver with Every Booking
```

## Postman Collection

Import the following files into Postman for easy testing:
1. `Slider_API_Complete.postman_collection.json` - Complete API collection
2. `Slider_API_Environment.postman_environment.json` - Environment variables

## Testing Steps

1. **Start the server**: `npm start`
2. **Import Postman collection**
3. **Register/Login** to get auth token
4. **Set environment variables** in Postman
5. **Test endpoints** in order:
   - Get all sliders (public)
   - Create slider (protected)
   - Get my sliders (protected)
   - Update slider (protected)
   - Toggle status (protected)
   - Delete slider (protected)
