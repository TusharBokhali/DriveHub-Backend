# Notification API Usage Guide - Postman Collection

## 📋 Complete API Endpoints

### Base URL
```
http://localhost:5000
```

---

## 🔐 Authentication

Sabhi notification APIs ke liye authentication required hai:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📱 Push Token Management

### 1. Update Push Token (Expo/FCM)
**Endpoint:** `POST /api/notifications/push-token`

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Body (Expo Token):**
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Body (FCM Token):**
```json
{
  "pushToken": "your_fcm_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pushTokens": ["ExponentPushToken[...]"],
    "tokenType": "Expo",
    "totalTokens": 1,
    "userRole": "user",
    "userId": "user_id_here"
  },
  "message": "Expo push token updated successfully for user"
}
```

**Important:**
- ✅ Token automatically linked to authenticated user
- ✅ Multiple devices support (ek user ke multiple tokens)
- ✅ Automatic token type detection (Expo vs FCM)

---

### 2. Remove Push Token (Logout)
**Endpoint:** `DELETE /api/notifications/push-token`

**Headers:**
```
Authorization: Bearer <user_token>
Content-Type: application/json
```

**Body:**
```json
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pushTokens": [],
    "removed": true
  },
  "message": "Expo push token removed successfully"
}
```

---

## 📬 Notification Management

### 3. Get All Notifications
**Endpoint:** `GET /api/notifications`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `unreadOnly` (optional): Get only unread (true/false, default: false)

**Example:**
```
GET /api/notifications?page=1&limit=20&unreadOnly=false
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "user": "user_id",
        "type": "booking",
        "title": "Booking Approved",
        "message": "Your booking has been approved!",
        "data": {
          "action": "booking_approved",
          "status": "approved",
          "vehicleTitle": "Honda City"
        },
        "bookingId": "booking_id",
        "isRead": false,
        "readAt": null,
        "createdAt": "2024-01-15T10:00:00.000Z"
      }
    ],
    "unreadCount": 5,
    "totalCount": 20,
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  },
  "message": "Found 20 notifications"
}
```

---

### 4. Get Unread Notifications Only
**Endpoint:** `GET /api/notifications?unreadOnly=true`

**Response:** Same format as above, but only unread notifications

---

### 5. Get Notification by ID
**Endpoint:** `GET /api/notifications/:id`

**Example:**
```
GET /api/notifications/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "notification_id",
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "type": "booking",
    "title": "Booking Approved",
    "message": "Your booking has been approved!",
    "data": {...},
    "bookingId": {...},
    "isRead": false,
    "createdAt": "2024-01-15T10:00:00.000Z"
  },
  "message": "Notification found successfully"
}
```

---

### 6. Mark Notification as Read
**Endpoint:** `PUT /api/notifications/:id/read`

**Example:**
```
PUT /api/notifications/507f1f77bcf86cd799439011/read
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "notification_id",
    "isRead": true,
    "readAt": "2024-01-15T11:00:00.000Z"
  },
  "message": "Notification marked as read"
}
```

---

### 7. Mark All Notifications as Read
**Endpoint:** `PUT /api/notifications/read-all`

**Response:**
```json
{
  "success": true,
  "data": {
    "updatedCount": 5
  },
  "message": "Marked 5 notifications as read"
}
```

---

### 8. Delete Notification
**Endpoint:** `DELETE /api/notifications/:id`

**Example:**
```
DELETE /api/notifications/507f1f77bcf86cd799439011
```

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Notification deleted successfully"
}
```

---

### 9. Clear All Read Notifications
**Endpoint:** `DELETE /api/notifications/clear-all`

**Response:**
```json
{
  "success": true,
  "data": {
    "deletedCount": 10
  },
  "message": "Deleted 10 read notifications"
}
```

---

## 🔄 Automatic Notifications

Ye notifications automatically send hote hain booking status change par:

### Booking Created
- **Trigger:** User creates booking
- **Recipient:** Booking creator (user)
- **Message:** "Your booking has been created and is pending admin approval."

### Booking Approved
- **Trigger:** Admin approves booking
- **Recipient:** Booking owner (user who created booking)
- **Message:** "Your booking for [vehicle] has been approved!"

### Booking Rejected
- **Trigger:** Admin rejects booking
- **Recipient:** Booking owner (user who created booking)
- **Message:** "Your booking for [vehicle] has been rejected. [reason]"

### Trip Started
- **Trigger:** Admin marks booking as ongoing
- **Recipient:** Booking owner (user who created booking)
- **Message:** "Your trip with [vehicle] has started! Have a safe journey."

### Trip Completed
- **Trigger:** Admin completes booking
- **Recipient:** Booking owner (user who created booking)
- **Message:** "Your trip with [vehicle] has been completed successfully! Payment status: [paid/unpaid]."

---

## 📝 Postman Collection Usage

### Step 1: Import Collection
1. Postman open karo
2. **Import** button click karo
3. `Vehicle_Rental_API.postman_collection.json` file select karo
4. Import ho jayega

### Step 2: Set Variables
1. Collection variables mein jao
2. Set karo:
   - `base_url`: `http://localhost:5000`
   - `user_token`: Login se mila hua token
   - `admin_token`: Admin login se mila hua token
   - `notification_id`: Notification ID (test ke liye)

### Step 3: Test APIs

#### Update Push Token:
1. **Notifications** → **Update Push Token**
2. Body mein Expo token paste karo
3. Send karo
4. Response check karo

#### Get Notifications:
1. **Notifications** → **Get All Notifications**
2. Send karo
3. Notifications list aayega

#### Mark as Read:
1. **Notifications** → **Get All Notifications** (pehle notification ID le lo)
2. `notification_id` variable mein ID set karo
3. **Mark Notification as Read** send karo

---

## 🔍 Testing Flow

### Complete Test Flow:

1. **Login User:**
   ```
   POST /api/auth/login
   Body: { "email": "user@example.com", "password": "password" }
   Response: { "data": { "token": "..." } }
   ```

2. **Update Push Token:**
   ```
   POST /api/notifications/push-token
   Authorization: Bearer <token>
   Body: { "pushToken": "ExponentPushToken[...]" }
   ```

3. **Create Booking:**
   ```
   POST /api/booking-flow/bookings
   Authorization: Bearer <token>
   Body: { ... }
   ```
   ✅ Automatic notification aayega!

4. **Get Notifications:**
   ```
   GET /api/notifications
   Authorization: Bearer <token>
   ```
   ✅ Booking created notification dikhega!

5. **Admin Approves:**
   ```
   POST /api/booking-flow/bookings/:id/approve
   Authorization: Bearer <admin_token>
   ```
   ✅ User ko automatic notification aayega!

6. **Check Notifications Again:**
   ```
   GET /api/notifications
   ```
   ✅ Booking approved notification dikhega!

---

## 📊 Response Examples

### Success Response:
```json
{
  "success": true,
  "data": {...},
  "message": "Operation successful"
}
```

### Error Response:
```json
{
  "success": false,
  "data": null,
  "message": "Error message here"
}
```

---

## 🔐 Security Notes

1. ✅ **Token Authentication:** Har request mein valid JWT token required
2. ✅ **User Identification:** Token se automatically user identify hota hai
3. ✅ **Notification Ownership:** User sirf apni notifications dekh sakta hai
4. ✅ **Booking Owner:** Notification sirf booking creator ko jata hai

---

## 💡 Tips

1. **Token Management:**
   - Login ke baad token save karo
   - Token expire hone par naya token le lo
   - Logout par push token remove karo

2. **Notification Management:**
   - Regular notifications check karo
   - Unread notifications highlight karo
   - Read notifications clear karo (space saving)

3. **Testing:**
   - Pehle push token update karo
   - Phir booking create karo
   - Notifications check karo
   - Admin operations test karo

---

## 🚀 Quick Start

1. Postman collection import karo
2. Login karo aur token le lo
3. Push token update karo
4. Booking create karo
5. Notifications check karo!

**Happy Testing! 🎉**

