# Quick Firebase Setup - 5 Minutes

## Step 1: Firebase Console (2 minutes)

1. **Jao**: https://console.firebase.google.com/
2. **Login** karo Google account se
3. **"Add project"** click karo
4. **Project name** do: `DriveHub` (ya koi bhi naam)
5. **Create project** click karo
6. **Continue** click karo

## Step 2: Service Account Download (1 minute)

1. Firebase Console mein **⚙️ Settings** → **Project settings**
2. **Service accounts** tab click karo
3. **Node.js** select karo
4. **"Generate new private key"** click karo
5. **"Generate key"** click karo
6. JSON file download hogi

## Step 3: Backend Setup (2 minutes)

### 3.1 File ko rakho
Download ki hui JSON file ko rename karo:
```
firebase-service-account.json
```

Aur isko project mein rakho:
```
DriveHub-Backend/
  └── config/
      └── firebase-service-account.json  ← Yahan rakho
```

### 3.2 .env File Update (Optional)
Agar file path change karna ho, `.env` mein add karo:
```env
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

## Step 4: Test (30 seconds)

1. Server start karo:
```bash
npm start
```

2. Console mein ye dikhega:
```
✅ Firebase Admin SDK initialized with service account file
```

## Done! 🎉

Ab aap notifications send kar sakte ho!

---

## Troubleshooting

### Error: "Cannot find module"
- File path check karo
- File name exactly `firebase-service-account.json` ho
- File `config/` folder mein ho

### Error: "Invalid credentials"
- Service account file sahi download kiya hai ya nahi check karo
- File ko edit mat karo
- Naya service account download karo

### Error: "Permission denied"
- File permissions check karo
- File readable hai ya nahi verify karo

---

## Next Steps

1. Frontend se FCM token receive karo
2. Token ko backend mein save karo: `POST /api/notifications/fcm-token`
3. Booking create karo - automatic notification aayega!

