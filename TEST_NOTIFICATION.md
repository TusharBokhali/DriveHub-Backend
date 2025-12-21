# Notification Testing Guide

## Issue: Login ke baad notification nahi aaya

### Possible Reasons:

1. **Push Token nahi hai:**
   - Agar user ke paas push token nahi hai, notification database mein save hoga but push notification nahi jayega
   - Solution: Pehle push token update karo

2. **Notification database mein save ho raha hai:**
   - Check karo: `GET /api/notifications`
   - Notification list mein welcome notification dikhna chahiye

3. **Console logs check karo:**
   - Server console mein ye dikhna chahiye:
     ```
     📧 Attempting to send welcome notification to user...
     📧 Notification created for user...
     ✅ Welcome notification created and sent...
     ```

### Testing Steps:

#### Step 1: Login karo
```bash
POST /api/auth/login
Body: { "email": "user@example.com", "password": "password" }
```

#### Step 2: Console check karo
Server console mein check karo:
- `📧 Attempting to send welcome notification...`
- `📧 Notification created for user...`
- `✅ Welcome notification created...`

#### Step 3: Notifications check karo
```bash
GET /api/notifications
Authorization: Bearer <token>
```

Agar notification list mein welcome notification dikhe:
- ✅ Notification database mein save ho gaya hai
- ❌ Push notification nahi gaya (push token missing)

#### Step 4: Push Token update karo
```bash
POST /api/notifications/push-token
Authorization: Bearer <token>
Body: { "pushToken": "ExponentPushToken[...]" }
```

#### Step 5: Phir se login karo
Ab push token ke saath login karo - notification aayega!

---

## Debug Checklist:

- [ ] Server console mein logs dikh rahe hain?
- [ ] Notification database mein save ho raha hai? (GET /api/notifications)
- [ ] User ke paas push token hai? (Check user model)
- [ ] Expo/FCM service properly initialized hai?
- [ ] Error logs check kiye?

---

## Common Issues:

### Issue 1: Notification database mein hai but push nahi gaya
**Reason:** User ke paas push token nahi hai
**Solution:** Push token update karo

### Issue 2: Notification database mein bhi nahi hai
**Reason:** Notification create function fail ho raha hai
**Solution:** Console logs check karo, error dekhoge

### Issue 3: Push token hai but notification nahi aaya
**Reason:** Expo/FCM service issue
**Solution:** Service initialization check karo

---

## Quick Test:

1. Login karo
2. Console check karo
3. `GET /api/notifications` call karo
4. Notification list check karo
5. Agar notification hai → Push token missing
6. Push token update karo
7. Phir se login karo → Notification aayega!

