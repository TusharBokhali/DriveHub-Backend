# Firebase FCM Setup Guide - Backend (Zero se Complete)

## Step 1: Firebase Console mein Project Create karo

### 1.1 Firebase Console mein jao
1. Browser mein jao: https://console.firebase.google.com/
2. Google account se login karo
3. "Add project" ya "Create a project" click karo

### 1.2 Project Details
- **Project name**: `DriveHub` (ya koi bhi naam)
- **Google Analytics**: Optional (enable kar sakte ho ya skip)
- **Create project** click karo

### 1.3 Project Ready
- Project create hone ke baad "Continue" click karo

---

## Step 2: Cloud Messaging (FCM) Enable karo

### 2.1 Project Settings
1. Firebase Console mein apne project ko open karo
2. Left sidebar mein **⚙️ Settings** (gear icon) click karo
3. **Project settings** select karo

### 2.2 Cloud Messaging Tab
1. Top mein **Cloud Messaging** tab click karo
2. Yahan **Server key** aur **Sender ID** dikhega (baad mein use hoga)

---

## Step 3: Service Account Key Download karo

### 3.1 Service Accounts
1. Firebase Console mein **⚙️ Settings** → **Project settings**
2. **Service accounts** tab click karo
3. Yahan **Node.js** option select karo

### 3.2 Generate New Private Key
1. **Generate new private key** button click karo
2. Dialog box mein **Generate key** click karo
3. Ek JSON file download hogi (example: `drivehub-firebase-adminsdk-xxxxx.json`)

### 3.3 Important Notes
- ✅ Ye file **SECRET** hai - kabhi bhi public repository mein commit mat karo
- ✅ File ko safe jagah rakho
- ✅ File ka naam kuch aisa hoga: `your-project-firebase-adminsdk-xxxxx-xxxxx.json`

---

## Step 4: Backend mein Configuration

### 4.1 Service Account File ko Project mein rakho

**Option A: Root Directory mein rakho (Recommended)**
```
DriveHub-Backend/
  ├── config/
  │   └── firebase-service-account.json  ← Yahan rakho
  ├── server.js
  └── ...
```

**Option B: .env file mein (Alternative)**
- Service account JSON ko environment variable mein convert karo

### 4.2 .env File Update karo

Project root mein `.env` file mein ye add karo:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n"

# OR Use Service Account File Path
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

**Important Notes:**
- `FIREBASE_PRIVATE_KEY` mein `\n` characters include karo
- Private key ko quotes mein rakho
- Service account file path use karo (easier method)

---

## Step 5: Code Update karo

### 5.1 Service Account File Method (Easiest)

`utils/fcmService.js` file ko update karo:

```javascript
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

let firebaseInitialized = false;

try {
  if (!admin.apps.length) {
    // Method 1: Service Account File (Easiest)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                path.join(__dirname, '..', 'config', 'firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized with service account file');
    } else {
      // Method 2: Environment Variables
      if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          })
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized with environment variables');
      } else {
        console.warn('⚠️ Firebase configuration not found. Push notifications will not work.');
      }
    }
  } else {
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error.message);
  firebaseInitialized = false;
}
```

---

## Step 6: .gitignore Update karo

Service account file ko git se protect karo:

`.gitignore` file mein add karo:
```
# Firebase
config/firebase-service-account.json
firebase-service-account.json
*.json
!package.json
!package-lock.json
```

---

## Step 7: Testing

### 7.1 Server Start karo
```bash
npm start
# ya
npm run dev
```

### 7.2 Check Console
Agar setup sahi hai, console mein ye dikhega:
```
✅ Firebase Admin SDK initialized with service account file
```

Agar error aaye:
```
❌ Firebase Admin SDK initialization error: ...
```

---

## Step 8: Test Notification API

### 8.1 FCM Token Update karo
```bash
POST /api/notifications/fcm-token
Authorization: Bearer <your_token>
Body: {
  "fcmToken": "test_token_here"
}
```

### 8.2 Test Notification Send karo
Test karne ke liye ek test endpoint bhi bana sakte ho (optional).

---

## Common Issues aur Solutions

### Issue 1: "Service account file not found"
**Solution**: 
- File path check karo
- `.env` mein `FIREBASE_SERVICE_ACCOUNT_PATH` set karo
- File permissions check karo

### Issue 2: "Invalid private key"
**Solution**:
- Private key mein `\n` characters check karo
- Quotes properly lagao
- Service account file method use karo (easier)

### Issue 3: "Permission denied"
**Solution**:
- Service account file ko read permissions do
- File path correct hai ya nahi check karo

### Issue 4: "Project ID mismatch"
**Solution**:
- Service account file aur Firebase project match karo
- Correct project se service account download karo

---

## Quick Setup Checklist

- [ ] Firebase Console mein project create kiya
- [ ] Cloud Messaging enable kiya
- [ ] Service account key download kiya
- [ ] Service account file ko `config/` folder mein rakha
- [ ] `.env` file mein path set kiya
- [ ] `.gitignore` mein file add kiya
- [ ] Server start kiya aur console check kiya
- [ ] Test notification send kiya

---

## Security Best Practices

1. ✅ Service account file ko **NEVER** commit karo git mein
2. ✅ `.env` file ko `.gitignore` mein add karo
3. ✅ Production mein environment variables use karo
4. ✅ Service account file permissions restrict karo (read-only)
5. ✅ Regular security audits karo

---

## Next Steps

1. Frontend se FCM token receive karo
2. Token ko backend mein save karo (`/api/notifications/fcm-token`)
3. Booking status change par automatic notifications test karo
4. Notification history check karo

---

## Support

Agar koi issue aaye:
1. Console errors check karo
2. Firebase Console mein project status check karo
3. Service account file format verify karo
4. Environment variables check karo

**Happy Coding! 🚀**

