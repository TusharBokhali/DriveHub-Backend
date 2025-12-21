# Notification Security Implementation

## 🔐 Security Features

### 1. **Token Authentication & Authorization**

#### How Token Works:
- **JWT Token** se user identify hota hai
- Token mein `user._id` aur `user.role` hota hai
- Har request mein `protect` middleware verify karta hai
- Token se automatically pata chal jata hai:
  - ✅ **Kis user ka token hai** (`req.user._id`)
  - ✅ **User ka role kya hai** (`req.user.role` - user/admin/client)
  - ✅ **User ka email kya hai** (`req.user.email`)

#### Push Token Update:
```javascript
POST /api/notifications/push-token
Authorization: Bearer <JWT_TOKEN>

// Token automatically linked to authenticated user
// req.user._id se user identify hota hai
// No need to pass userId manually - SECURE!
```

**Security Checks:**
- ✅ JWT token verify hota hai
- ✅ User ID match karta hai
- ✅ User exists hai ya nahi check hota hai
- ✅ Token type detect hota hai (Expo/FCM)
- ✅ Logging for security audit

---

### 2. **Booking Ownership Verification**

#### Booking Create:
- Booking create karte waqt `req.user._id` automatically save hota hai
- **Only booking creator** ko notification jata hai
- Booking model mein `user` field mein creator ID store hoti hai

```javascript
// Booking created by user
const booking = new BookingFlow({
  user: req.user._id, // ✅ Automatically from JWT token
  // ... other fields
});

// Notification sent ONLY to booking creator
await createAndSendNotification(
  booking.user._id, // ✅ Only booking owner
  'booking',
  'Booking Created',
  'Your booking has been created...',
  {},
  booking._id
);
```

---

### 3. **Admin Operations Security**

#### Approve/Reject/Start/Complete:
- **Only Admin** can perform these operations
- **Role verification** before any action
- **Notification goes ONLY to booking owner** (not admin)

```javascript
// SECURITY: Verify admin role
if (req.user.role !== 'admin') {
  return res.status(403).json({
    message: 'Forbidden: Admin role required'
  });
}

// Get booking owner (user who created booking)
const bookingOwnerId = booking.user._id;

// Send notification ONLY to booking owner
await createAndSendNotification(
  bookingOwnerId, // ✅ Only booking owner gets notification
  'booking',
  'Booking Approved',
  'Your booking has been approved!',
  {},
  booking._id
);
```

---

### 4. **Notification Flow**

#### Booking Created:
1. User creates booking → `req.user._id` se booking save hoti hai
2. Notification sent to **booking creator only**
3. Log: `Booking created by user {email} (ID: {userId})`

#### Booking Approved:
1. Admin approves booking → Role verified
2. Notification sent to **booking owner only** (not admin)
3. Log: `Admin {adminEmail} approving booking for user {userEmail}`

#### Booking Rejected:
1. Admin rejects booking → Role verified
2. Notification sent to **booking owner only** (not admin)
3. Includes rejection reason

#### Trip Started:
1. Admin starts trip → Role verified
2. Notification sent to **booking owner only** (not admin)

#### Trip Completed:
1. Admin completes trip → Role verified
2. Notification sent to **booking owner only** (not admin)
3. Includes payment status

---

### 5. **Security Checks Summary**

#### ✅ Token Security:
- JWT token verify hota hai
- User ID automatically extract hota hai
- User exists check hota hai
- Role verification hoti hai

#### ✅ Booking Security:
- Booking owner ID automatically save hoti hai
- Admin operations ke liye role check hoti hai
- Booking owner verification hoti hai

#### ✅ Notification Security:
- Notification sirf booking owner ko jata hai
- User verification before sending
- Invalid tokens auto-remove hote hain
- Comprehensive logging

---

### 6. **How to Identify User/Admin**

#### From Token:
```javascript
// After protect middleware
req.user._id      // User ID
req.user.email    // User email
req.user.role     // 'user', 'admin', or 'client'
req.user.name     // User name
```

#### From Booking:
```javascript
// Booking model
booking.user      // User ID who created booking
booking.user._id  // After populate
booking.user.email // After populate
```

---

### 7. **Logging for Security**

All operations are logged:
```
✅ Push token added for admin user: admin@example.com (ID: 123)
🔐 Admin admin@example.com (123) approving booking 456 for user user@example.com (789)
✅ Notification sent to booking owner: user@example.com (789)
❌ Security: Non-admin user user@example.com attempted to approve booking
```

---

### 8. **Key Security Points**

1. ✅ **Token = User Identity**: JWT token se user automatically identify hota hai
2. ✅ **Booking Owner = Notification Recipient**: Sirf booking creator ko notification jata hai
3. ✅ **Admin Only Operations**: Admin role verify hoti hai
4. ✅ **No Manual User ID**: User ID manually pass nahi karna padta
5. ✅ **Automatic Verification**: Sab kuch automatic verify hota hai
6. ✅ **Comprehensive Logging**: Har operation log hota hai

---

## Example Flow

### User Creates Booking:
```
1. User login → JWT token milta hai
2. User creates booking → req.user._id se booking save
3. Notification sent to req.user._id (booking creator)
```

### Admin Approves Booking:
```
1. Admin login → JWT token (role: admin)
2. Admin approves → Role verified
3. Booking.user se owner ID milti hai
4. Notification sent to booking.user (owner only)
5. Admin ko notification NAHI jata
```

---

## Testing

### Test Token Security:
```bash
# Valid user token
POST /api/notifications/push-token
Authorization: Bearer <user_token>
✅ Token linked to user automatically

# Invalid token
POST /api/notifications/push-token
Authorization: Bearer <invalid_token>
❌ 401 Unauthorized
```

### Test Booking Notifications:
```bash
# User creates booking
POST /api/booking-flow/bookings
Authorization: Bearer <user_token>
✅ Notification sent to user only

# Admin approves
POST /api/booking-flow/bookings/:id/approve
Authorization: Bearer <admin_token>
✅ Notification sent to booking owner (not admin)
```

---

## Summary

✅ **Token se user identify hota hai** - JWT token se automatically
✅ **Booking owner automatically track hota hai** - booking.user field se
✅ **Notification sirf booking owner ko jata hai** - secure aur safe
✅ **Admin operations secure hain** - role verification
✅ **Comprehensive logging** - security audit ke liye

**Sab kuch automatic aur secure hai!** 🚀

