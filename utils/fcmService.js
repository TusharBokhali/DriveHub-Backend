const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

try {
  // Check if Firebase Admin is already initialized
  if (!admin.apps.length) {
    // Method 1: Service Account File (Easiest - Recommended)
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || 
                                path.join(__dirname, '..', 'config', 'firebase-service-account.json');
    
    if (fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized with service account file:', serviceAccountPath);
    } 
    // Method 2: Service Account JSON as Environment Variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized with service account key from environment');
    } 
    // Method 3: Individual Environment Variables
    else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
        })
      });
      firebaseInitialized = true;
      console.log('✅ Firebase Admin SDK initialized with environment variables');
    } 
    // Method 4: Default credentials (for Google Cloud environments)
    else {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault()
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized with default credentials');
      } catch (defaultError) {
        console.warn('⚠️ Firebase configuration not found. Push notifications will not work.');
        console.warn('   Please configure Firebase using one of these methods:');
        console.warn('   1. Place service account file at: config/firebase-service-account.json');
        console.warn('   2. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env');
        console.warn('   3. Set FIREBASE_SERVICE_ACCOUNT_KEY in .env');
        console.warn('   4. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env');
        firebaseInitialized = false;
      }
    }
  } else {
    firebaseInitialized = true;
    console.log('✅ Firebase Admin SDK already initialized');
  }
} catch (error) {
  console.error('❌ Firebase Admin SDK initialization error:', error.message);
  console.error('   Error details:', error);
  console.warn('⚠️ Push notifications will not work without proper Firebase configuration');
  firebaseInitialized = false;
}

/**
 * Send push notification to single device
 * @param {string} fcmToken - FCM token of the device
 * @param {string} title - Notification title
 * @param {string} body - Notification message
 * @param {object} data - Additional data payload
 * @returns {Promise<object>} - FCM response
 */
exports.sendNotification = async (fcmToken, title, body, data = {}) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized, skipping push notification');
    return { success: false, error: 'Firebase not configured' };
  }

  if (!fcmToken) {
    console.warn('FCM token not provided');
    return { success: false, error: 'FCM token required' };
  }

  const message = {
    notification: {
      title: title,
      body: body
    },
    data: {
      ...data,
      title: title,
      body: body
    },
    token: fcmToken,
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending notification:', error);
    
    // Handle invalid token
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      return { 
        success: false, 
        error: 'Invalid or unregistered token',
        code: error.code,
        shouldRemoveToken: true 
      };
    }
    
    return { success: false, error: error.message, code: error.code };
  }
};

/**
 * Send push notification to multiple devices
 * @param {Array<string>} fcmTokens - Array of FCM tokens
 * @param {string} title - Notification title
 * @param {string} body - Notification message
 * @param {object} data - Additional data payload
 * @returns {Promise<object>} - FCM response with results
 */
exports.sendMulticastNotification = async (fcmTokens, title, body, data = {}) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized, skipping push notification');
    return { success: false, error: 'Firebase not configured' };
  }

  if (!fcmTokens || fcmTokens.length === 0) {
    console.warn('No FCM tokens provided');
    return { success: false, error: 'FCM tokens required' };
  }

  const message = {
    notification: {
      title: title,
      body: body
    },
    data: {
      ...data,
      title: title,
      body: body
    },
    android: {
      priority: 'high',
      notification: {
        sound: 'default',
        channelId: 'default'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    tokens: fcmTokens
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`Successfully sent ${response.successCount} notifications`);
    console.log(`Failed: ${response.failureCount}`);
    
    // Return invalid tokens that should be removed
    const invalidTokens = [];
    if (response.responses) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success && 
            (resp.error?.code === 'messaging/invalid-registration-token' ||
             resp.error?.code === 'messaging/registration-token-not-registered')) {
          invalidTokens.push(fcmTokens[idx]);
        }
      });
    }
    
    return {
      success: response.successCount > 0,
      successCount: response.successCount,
      failureCount: response.failureCount,
      invalidTokens: invalidTokens
    };
  } catch (error) {
    console.error('Error sending multicast notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if Firebase is initialized
 */
exports.isInitialized = () => {
  return firebaseInitialized;
};

