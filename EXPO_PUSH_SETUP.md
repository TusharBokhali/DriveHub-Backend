# Expo Push Notifications Setup Guide

## Overview
Agar aap React Native Expo use kar rahe ho, toh Expo Push Notification service automatically available hai. **Firebase setup ki zarurat nahi hai** Expo ke liye!

## Expo Push Tokens

Expo push tokens ka format hota hai:
```
ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
```

Yeh tokens Expo automatically generate karta hai jab aap `expo-notifications` package use karte ho.

---

## Frontend Setup (React Native Expo)

### 1. Install Package
```bash
npx expo install expo-notifications
```

### 2. Get Push Token
```javascript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync({
      projectId: 'your-expo-project-id', // Expo project ID
    })).data;
    
    console.log('Expo Push Token:', token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

// Use in your component
useEffect(() => {
  registerForPushNotificationsAsync().then(token => {
    if (token) {
      // Send token to backend
      updatePushToken(token);
    }
  });
}, []);
```

### 3. Send Token to Backend
```javascript
const updatePushToken = async (token) => {
  try {
    const response = await fetch('YOUR_API_URL/api/notifications/push-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${yourAuthToken}`
      },
      body: JSON.stringify({
        pushToken: token
      })
    });
    
    const data = await response.json();
    console.log('Token updated:', data);
  } catch (error) {
    console.error('Error updating token:', error);
  }
};
```

---

## Backend Setup

### ✅ Already Done!
Backend mein sab kuch ready hai:
- ✅ `expo-server-sdk` package install ho gaya
- ✅ Expo push service create ho gaya (`utils/expoPushService.js`)
- ✅ Notification controller Expo tokens support karta hai
- ✅ Automatic token type detection (Expo vs FCM)

### No Firebase Setup Needed!
Expo ke liye **Firebase setup ki zarurat nahi hai**. Expo apna push notification service provide karta hai.

---

## API Endpoints

### Update Push Token
```bash
POST /api/notifications/push-token
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

### Remove Push Token (Logout)
```bash
DELETE /api/notifications/push-token
Authorization: Bearer <token>
Content-Type: application/json

Body:
{
  "pushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}
```

---

## How It Works

1. **Frontend**: Expo se push token get karo
2. **Frontend**: Token ko backend mein save karo (`/api/notifications/push-token`)
3. **Backend**: Token automatically detect hota hai (Expo format)
4. **Backend**: Booking status change par notification send hota hai
5. **Frontend**: Notification receive hota hai automatically

---

## Token Format Detection

Backend automatically detect karta hai:
- **Expo Token**: `ExponentPushToken[...]` → Expo service use hota hai
- **FCM Token**: Long string without `ExponentPushToken` → Firebase service use hota hai

Agar dono types ke tokens hain, dono ko notification send hota hai!

---

## Testing

### 1. Get Token from Frontend
```javascript
const token = await Notifications.getExpoPushTokenAsync();
console.log('Token:', token.data);
```

### 2. Send to Backend
```bash
POST /api/notifications/push-token
{
  "pushToken": "ExponentPushToken[your-token-here]"
}
```

### 3. Create Booking
Booking create karo - automatic notification aayega!

---

## Expo Project ID

Agar aap Expo managed workflow use kar rahe ho:
- `app.json` ya `app.config.js` mein `expo.projectId` check karo
- Ya Expo dashboard se project ID le sakte ho

Agar bare workflow use kar rahe ho:
- `expo-project-id` manually set karna padega

---

## Common Issues

### Issue: "DeviceNotRegistered"
**Solution**: Token invalid hai, naya token generate karo

### Issue: "No token received"
**Solution**: 
- Physical device use karo (emulator mein kaam nahi karega)
- Permissions check karo
- Expo project ID sahi hai ya nahi verify karo

### Issue: "Token format invalid"
**Solution**: Token `ExponentPushToken[...]` format mein hona chahiye

---

## Benefits of Expo Push

✅ **No Firebase Setup** - Expo automatically handle karta hai
✅ **Easy Integration** - Just get token and send to backend
✅ **Cross Platform** - Android aur iOS dono mein kaam karta hai
✅ **Free** - Expo push service free hai
✅ **Automatic** - Token management automatic hai

---

## Next Steps

1. Frontend mein `expo-notifications` install karo
2. Push token get karo
3. Token ko backend mein save karo
4. Booking create karo - notification aayega!

**Happy Coding! 🚀**

